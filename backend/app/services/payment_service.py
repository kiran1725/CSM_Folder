import os
import io
import json
import uuid
from datetime import datetime, timezone
import razorpay
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.models import ServiceRequest, ServiceStatus, User, Car
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.schemas.payment import OrderCreate, OrderOut, PaymentVerify, VerifyResponse

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# Load environment variables
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_SxekrXowMq4G6Z")
RAZORPAY_SECRET = os.getenv("RAZORPAY_SECRET", "mock_secret_for_testing")

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_SECRET))

# Price list for mapping service_type to base charges
SERVICE_PRICES = {
    'General Service': 2499,
    'Oil Change': 899,
    'Brake Service': 699,
    'Brake Inspection': 699,
    'Engine Repair': 1999,
    'Engine Check': 999,
    'Tire Change': 599,
    'AC Service': 999
}

class PaymentService:
    @staticmethod
    def create_razorpay_order(db: Session, data: OrderCreate, current_user_id: int) -> dict:
        # 1. Fetch Service Request
        service_request = db.query(ServiceRequest).filter(ServiceRequest.id == data.service_id).first()
        if not service_request:
            raise HTTPException(status_code=404, detail="Service Request not found")

        # 2. Calculate Pricing
        base_price = SERVICE_PRICES.get(service_request.service_type, 1500.0)
        additional_charges = 0.0
        subtotal = base_price + additional_charges
        gst_rate = 18.0
        gst_amount = round(subtotal * (gst_rate / 100.0), 2)
        discount = 0.0
        total_amount = round(subtotal + gst_amount - discount, 2)

        # 3. Create Razorpay Order
        # Razorpay expects amount in paise (multiply by 100)
        amount_in_paise = int(total_amount * 100)
        
        try:
            order_data = {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"receipt_sr_{service_request.id}",
                "payment_capture": 1
            }
            # Only attempt Razorpay SDK call if not mocking
            if RAZORPAY_SECRET != "mock_secret_for_testing":
                razorpay_order = razorpay_client.order.create(data=order_data)
                order_id = razorpay_order["id"]
            else:
                order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
        except Exception as e:
            print("Razorpay order creation error:", e)
            # Fallback to local mock order id for testing
            order_id = f"order_mock_{uuid.uuid4().hex[:12]}"

        # 4. Generate Unique Invoice Number (INV-YYYY-XXXX)
        count = db.query(Payment).count() + 1
        invoice_number = f"INV-{datetime.now().year}-{str(count).zfill(4)}"

        # 5. Create breakdown JSON
        breakdown_list = [{"label": service_request.service_type, "amount": base_price}]
        if additional_charges > 0:
            breakdown_list.append({"label": "Additional Charges", "amount": additional_charges})
        service_breakdown_json = json.dumps(breakdown_list)

        # 6. Save Payment record with PENDING status
        db_payment = Payment(
            invoice_number=invoice_number,
            customer_id=current_user_id,
            service_id=service_request.id,
            service_breakdown=service_breakdown_json,
            subtotal=subtotal,
            gst_rate=gst_rate,
            gst_amount=gst_amount,
            discount=discount,
            amount=total_amount,
            payment_status=PaymentStatus.PENDING,
            transaction_id=order_id  # Store order_id temporarily in transaction_id field
        )
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)

        return {
            "order_id": order_id,
            "amount": total_amount,
            "currency": "INR"
        }

    @staticmethod
    def verify_payment(db: Session, data: PaymentVerify) -> dict:
        # 1. Verify Razorpay signature
        is_verified = False
        try:
            if RAZORPAY_SECRET != "mock_secret_for_testing":
                razorpay_client.utility.verify_payment_signature({
                    'razorpay_order_id': data.razorpay_order_id,
                    'razorpay_payment_id': data.razorpay_payment_id,
                    'razorpay_signature': data.razorpay_signature
                })
                is_verified = True
            else:
                print("[WARNING] Skipping signature verification in Mock mode")
                is_verified = True
        except Exception as e:
            print("Signature verification failed:", e)
            is_verified = False

        # 2. Retrieve Payment record
        # Note: We saved order_id in transaction_id during creation
        payment = db.query(Payment).filter(Payment.transaction_id == data.razorpay_order_id).first()
        if not payment:
            # Fallback check by service ID or notes if order_id lookup failed
            raise HTTPException(status_code=404, detail="Payment record not found")

        if not is_verified:
            # Mark payment as FAILED
            payment.payment_status = PaymentStatus.FAILED
            db.commit()
            raise HTTPException(status_code=400, detail="Payment signature verification failed")

        # 3. Update Payment details on success
        payment.payment_status = PaymentStatus.SUCCESS
        payment.transaction_id = data.razorpay_payment_id
        payment.payment_method = PaymentMethod.UPI  # Default to UPI or auto-detect if needed
        payment.paid_at = datetime.now(timezone.utc)
        
        # 4. Update service status to PAID
        if payment.service_id:
            service_request = db.query(ServiceRequest).filter(ServiceRequest.id == payment.service_id).first()
            if service_request:
                service_request.status = ServiceStatus.PAID

        db.commit()
        db.refresh(payment)

        return {
            "status": "SUCCESS",
            "payment_id": payment.payment_id,
            "invoice_number": payment.invoice_number
        }

    @staticmethod
    def generate_pdf_invoice(db: Session, payment_id: int) -> io.BytesIO:
        # Fetch detailed payment, user, car, and request data
        payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment record not found")

        customer = db.query(User).filter(User.id == payment.customer_id).first()
        service_request = db.query(ServiceRequest).filter(ServiceRequest.id == payment.service_id).first()
        car = db.query(Car).filter(Car.id == service_request.car_id).first() if service_request else None

        if not customer or not service_request or not car:
            raise HTTPException(status_code=404, detail="Invoice details could not be resolved")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=40, leftMargin=40,
                                topMargin=40, bottomMargin=40)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles for premium look
        title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1d4ed8'), # Vibrant Primary Blue
            spaceAfter=15
        )
        normal_style = ParagraphStyle(
            'InvoiceNormal',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#334155')
        )
        bold_style = ParagraphStyle(
            'InvoiceBold',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#0f172a'),
            fontName='Helvetica-Bold'
        )
        header_style = ParagraphStyle(
            'InvoiceHeader',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.white,
            fontName='Helvetica-Bold'
        )

        # 1. Document Title
        story.append(Paragraph("INVOICE RECEIPT", title_style))
        story.append(Spacer(1, 10))

        # 2. Company & Invoice Meta Info
        date_str = payment.paid_at.strftime('%d-%b-%Y %I:%M %p') if payment.paid_at else payment.payment_date.strftime('%d-%b-%Y')
        meta_data = [
            [
                Paragraph("<b>CarHub Connect</b><br/>123 Auto Service Highway<br/>Tech Hub, Bangalore 560001<br/>Email: billing@carhub.com", normal_style),
                Paragraph(f"<b>Invoice Number:</b> {payment.invoice_number}<br/><b>Payment Date:</b> {date_str}<br/><b>Status:</b> SUCCESS<br/><b>Reference:</b> {payment.transaction_id or 'N/A'}", normal_style)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[270, 270])
        meta_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 20))

        # 3. Customer & Vehicle Details Card
        details_data = [
            [
                Paragraph("<b>Billed To:</b>", bold_style),
                Paragraph("<b>Vehicle Details:</b>", bold_style)
            ],
            [
                Paragraph(f"Name: {customer.name}<br/>Customer ID: CUST-{customer.id:04d}<br/>Email: {customer.email}<br/>Phone: {customer.phone or 'N/A'}", normal_style),
                Paragraph(f"Model: {car.car_brand} {car.car_model}<br/>Number: {car.car_number}", normal_style)
            ]
        ]
        details_table = Table(details_data, colWidths=[270, 270])
        details_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('PADDING', (0,0), (-1,-1), 12),
            ('BOTTOMPADDING', (0,0), (-1,0), 2),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('LINEBELOW', (0,0), (-1,0), 0.5, colors.HexColor('#e2e8f0')),
        ]))
        story.append(details_table)
        story.append(Spacer(1, 20))

        # 4. Table Header for Charges
        charges_headers = [
            Paragraph("Item Description", header_style),
            Paragraph("Service Category", header_style),
            Paragraph("Charges (INR)", header_style)
        ]
        
        # Parse breakdown list
        breakdown = []
        if payment.service_breakdown:
            try:
                breakdown = json.loads(payment.service_breakdown)
            except Exception:
                breakdown = [{"label": service_request.service_type, "amount": payment.subtotal}]
        else:
            breakdown = [{"label": service_request.service_type, "amount": payment.subtotal}]

        table_data = [charges_headers]
        for item in breakdown:
            table_data.append([
                Paragraph(item.get("label", "Standard Car Service"), normal_style),
                Paragraph(service_request.service_type, normal_style),
                Paragraph(f"INR {item.get('amount', 0.0):,.2f}", normal_style)
            ])
        
        # Subtotal, Tax, Total rows
        table_data.append([Paragraph("", normal_style), Paragraph("<b>Subtotal:</b>", bold_style), Paragraph(f"INR {payment.subtotal:,.2f}", normal_style)])
        table_data.append([Paragraph("", normal_style), Paragraph(f"<b>GST ({payment.gst_rate}%):</b>", bold_style), Paragraph(f"INR {payment.gst_amount:,.2f}", normal_style)])
        if payment.discount > 0:
            table_data.append([Paragraph("", normal_style), Paragraph("<b>Discount:</b>", bold_style), Paragraph(f"- INR {payment.discount:,.2f}", normal_style)])
        table_data.append([Paragraph("", normal_style), Paragraph("<b>Total Amount:</b>", bold_style), Paragraph(f"INR {payment.amount:,.2f}", bold_style)])

        charges_table = Table(table_data, colWidths=[240, 150, 150])
        
        # Layout style configuration
        t_style = [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1d4ed8')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1, len(breakdown)), 0.5, colors.HexColor('#e2e8f0')),
        ]
        total_start_row = len(breakdown) + 1
        for r in range(total_start_row, len(table_data)):
            t_style.append(('LINEABOVE', (1, r), (2, r), 0.5, colors.HexColor('#e2e8f0')))
            t_style.append(('ALIGN', (1, r), (1, r), 'RIGHT'))
        
        t_style.append(('BACKGROUND', (1, len(table_data)-1), (2, len(table_data)-1), colors.HexColor('#eff6ff')))
        
        charges_table.setStyle(TableStyle(t_style))
        story.append(charges_table)
        story.append(Spacer(1, 30))

        # 5. Terms, Payment Method & Footer
        footer_data = [
            [
                Paragraph(f"<b>Payment Method:</b> {payment.payment_method.value if payment.payment_method else 'UPI'}<br/><b>Transaction Status:</b> PAID / SECURE", normal_style),
                Paragraph("<b>Terms & Conditions:</b><br/>All services carry a standard warranty of 30 days. For queries regarding your invoice, support is available 24/7.", normal_style)
            ]
        ]
        footer_table = Table(footer_data, colWidths=[270, 270])
        footer_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LINEABOVE', (0,0), (-1,0), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,0), 12),
        ]))
        story.append(footer_table)

        doc.build(story)
        buffer.seek(0)
        return buffer
