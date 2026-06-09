import os
import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import ServiceRequest, Car, User, ServiceStatus
from app.models.payment import Payment, SavedCard, PaymentStatus, PaymentMethod
from app.schemas.payment import (
    OrderCreate, OrderOut, PaymentVerify, VerifyResponse,
    PaymentCreate, PaymentOut, PaymentUpdate, SavedCardCreate, SavedCardOut
)
from app.services.payment_service import PaymentService, SERVICE_PRICES

# Define templates path dynamically relative to this file
current_dir = os.path.dirname(os.path.abspath(__file__))
templates_dir = os.path.join(current_dir, "..", "templates")
templates = Jinja2Templates(directory=templates_dir)

router = APIRouter(prefix="/payments", tags=["payments"])

# Helper to authenticate user from query param token (used for HTML rendering pages)
def get_user_from_token(token: str, db: Session) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token missing")
    from app.services.auth_service import AuthService
    from app.repositories.user_repository import UserRepository
    payload = AuthService.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token subject")
    user = UserRepository.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ─── Razorpay Core API Endpoints ─────────────────────────

@router.post("/create-order", response_model=OrderOut)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Creates a Razorpay order and saves a PENDING payment record."""
    res = PaymentService.create_razorpay_order(db, data, current_user.id)
    return res

@router.post("/verify", response_model=VerifyResponse)
def verify_payment_signature(
    data: PaymentVerify,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Verifies the Razorpay signature and updates the payment and service request status."""
    res = PaymentService.verify_payment(db, data)
    return res

@router.get("/invoice/{payment_id}/pdf")
def download_invoice_pdf(
    payment_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """Generates and downloads a professional ReportLab PDF invoice."""
    # Authenticate user from query token
    user = get_user_from_token(token, db)
    
    # Check that the payment belongs to the user
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
         raise HTTPException(status_code=404, detail="Payment record not found")
    if payment.customer_id != user.id and user.role.value != "ADMIN":
         raise HTTPException(status_code=403, detail="Not authorized to access this invoice")

    pdf_buffer = PaymentService.generate_pdf_invoice(db, payment_id)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{payment.invoice_number}.pdf"}
    )

# ─── HTML Template Rendering Routes ───────────────────────

@router.get("/bill-summary", response_class=HTMLResponse)
def get_bill_summary_page(
    request: Request,
    service_id: int = Query(...),
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """Renders the HTML bill summary page."""
    user = get_user_from_token(token, db)
    service_request = db.query(ServiceRequest).filter(ServiceRequest.id == service_id).first()
    if not service_request:
        raise HTTPException(status_code=404, detail="Service Booking not found")
        
    base_charges = SERVICE_PRICES.get(service_request.service_type, 1500.0)
    additional_charges = 200.0 if service_request.service_type == "General Service" else 0.0
    subtotal = base_charges + additional_charges
    gst_rate = 18.0
    gst_amount = round(subtotal * (gst_rate / 100.0), 2)
    total_amount = round(subtotal + gst_amount, 2)
    
    car = db.query(Car).filter(Car.id == service_request.car_id).first()
    
    return templates.TemplateResponse("bill_summary.html", {
        "request": request,
        "customer": user,
        "service": service_request,
        "car": car,
        "service_charges": base_charges,
        "additional_charges": additional_charges,
        "taxes": gst_amount,
        "total_amount": total_amount,
        "token": token
    })

@router.get("/checkout", response_class=HTMLResponse)
def get_checkout_page(
    request: Request,
    service_id: int = Query(...),
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """Renders the payment/checkout loader page which opens Razorpay."""
    user = get_user_from_token(token, db)
    service_request = db.query(ServiceRequest).filter(ServiceRequest.id == service_id).first()
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")

    base_charges = SERVICE_PRICES.get(service_request.service_type, 1500.0)
    additional_charges = 200.0 if service_request.service_type == "General Service" else 0.0
    subtotal = base_charges + additional_charges
    gst_rate = 18.0
    gst_amount = round(subtotal * (gst_rate / 100.0), 2)
    total_amount = round(subtotal + gst_amount, 2)

    return templates.TemplateResponse("payment.html", {
        "request": request,
        "service_id": service_id,
        "amount": total_amount,
        "customer": user,
        "service_type": service_request.service_type,
        "token": token,
        "razorpay_key_id": os.getenv("RAZORPAY_KEY_ID", "rzp_test_SxekrXowMq4G6Z")
    })

@router.get("/success", response_class=HTMLResponse)
def get_success_page(
    request: Request,
    payment_id: int = Query(...),
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """Renders the premium payment success confirmation page."""
    user = get_user_from_token(token, db)
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
        
    service_request = db.query(ServiceRequest).filter(ServiceRequest.id == payment.service_id).first()
    car = db.query(Car).filter(Car.id == service_request.car_id).first() if service_request else None
    
    # Format Date and Time
    paid_time = payment.paid_at.replace(tzinfo=timezone.utc).astimezone() if payment.paid_at else datetime.now()
    formatted_date = paid_time.strftime("%d-%b-%Y")
    formatted_time = paid_time.strftime("%I:%M %p")

    return templates.TemplateResponse("payment_success.html", {
        "request": request,
        "payment": payment,
        "service": service_request,
        "car": car,
        "customer": user,
        "formatted_date": formatted_date,
        "formatted_time": formatted_time,
        "token": token
    })

@router.get("/failed", response_class=HTMLResponse)
def get_failed_page(
    request: Request,
    reason: str = Query("Payment failed or cancelled"),
    service_id: int = Query(None),
    token: str = Query(...)
):
    """Renders the payment failure page."""
    user = get_user_from_token(token, db=next(get_db()))
    formatted_date = datetime.now().strftime("%d-%b-%Y")
    formatted_time = datetime.now().strftime("%I:%M %p")
    
    return templates.TemplateResponse("payment_failed.html", {
        "request": request,
        "reason": reason,
        "service_id": service_id,
        "customer": user,
        "formatted_date": formatted_date,
        "formatted_time": formatted_time,
        "token": token
    })

@router.get("/invoice/{payment_id}", response_class=HTMLResponse)
def get_invoice_page(
    request: Request,
    payment_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """Renders the HTML invoice layout for display and browser printing."""
    user = get_user_from_token(token, db)
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
        
    service_request = db.query(ServiceRequest).filter(ServiceRequest.id == payment.service_id).first()
    car = db.query(Car).filter(Car.id == service_request.car_id).first() if service_request else None
    
    # Parse breakdown
    breakdown = []
    if payment.service_breakdown:
        try:
            breakdown = json.loads(payment.service_breakdown)
        except Exception:
            breakdown = [{"label": service_request.service_type, "amount": payment.subtotal}]
    else:
        breakdown = [{"label": service_request.service_type, "amount": payment.subtotal}]
        
    paid_time = payment.paid_at.replace(tzinfo=timezone.utc).astimezone() if payment.paid_at else datetime.now()
    formatted_date = paid_time.strftime("%d-%b-%Y")

    return templates.TemplateResponse("invoice.html", {
        "request": request,
        "payment": payment,
        "service": service_request,
        "car": car,
        "customer": user,
        "breakdown": breakdown,
        "formatted_date": formatted_date,
        "token": token
    })

# ─── Legacy APIs & React Compatibility Endpoints ───────────

@router.get("/", response_model=List[PaymentOut])
def get_all_payments_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Legacy endpoint returning user payments list."""
    payments = db.query(Payment).filter(
        Payment.customer_id == current_user.id
    ).order_by(Payment.payment_date.desc()).all()
    return [_enrich_payment_data(p, db) for p in payments]

@router.get("/", response_model=List[PaymentOut])
def get_payments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """GET /payments/ — returns all payments for current user (or all if admin)."""
    if hasattr(current_user, 'role') and getattr(current_user.role, 'value', str(current_user.role)) == 'ADMIN':
        payments = db.query(Payment).order_by(Payment.payment_date.desc()).all()
    else:
        payments = db.query(Payment).filter(
            Payment.customer_id == current_user.id
        ).order_by(Payment.payment_date.desc()).all()
    return [_enrich_payment_data(p, db) for p in payments]

@router.post("/", response_model=PaymentOut, status_code=201)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """POST /payments/ — create a new payment record (frontend-compatible)."""
    if data.total_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid payment amount")

    count = db.query(Payment).count() + 1
    invoice_no = f"INV-{datetime.now().year}-{str(count).zfill(4)}"

    breakdown_json = None
    if data.service_breakdown:
        breakdown_json = json.dumps([item.dict() for item in data.service_breakdown])

    payment = Payment(
        invoice_number=invoice_no,
        customer_id=current_user.id,
        service_id=data.service_request_id,
        service_breakdown=breakdown_json,
        subtotal=data.subtotal,
        gst_rate=data.gst_rate,
        gst_amount=data.gst_amount,
        discount=data.discount,
        amount=data.total_amount,
        payment_status=PaymentStatus.PAID,   # Razorpay already confirmed payment
        payment_method=data.payment_method,
        paid_at=datetime.now(timezone.utc),
        notes=data.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return _enrich_payment_data(payment, db)

@router.post("/initiate", response_model=PaymentOut)
def initiate_payment_legacy(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Legacy initiate endpoint for React dashboard compatibility."""
    if data.total_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid payment amount")
    
    count = db.query(Payment).count() + 1
    invoice_no = f"INV-{datetime.now().year}-{str(count).zfill(4)}"
    
    breakdown_json = None
    if data.service_breakdown:
        breakdown_json = json.dumps([item.dict() for item in data.service_breakdown])

    payment = Payment(
        invoice_number=invoice_no,
        customer_id=current_user.id,
        service_id=data.service_request_id,
        service_breakdown=breakdown_json,
        subtotal=data.subtotal,
        gst_rate=data.gst_rate,
        gst_amount=data.gst_amount,
        discount=data.discount,
        amount=data.total_amount,
        payment_status=PaymentStatus.PENDING,
        notes=data.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return _enrich_payment_data(payment, db)

@router.patch("/{payment_id}/pay", response_model=PaymentOut)
@router.patch("/{payment_id}", response_model=PaymentOut)
def process_payment_legacy(
    payment_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Legacy mark as PAID/Update endpoint."""
    payment = db.query(Payment).filter(
        Payment.payment_id == payment_id,
        Payment.customer_id == current_user.id
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    if payment.payment_status == PaymentStatus.PAID or payment.payment_status == PaymentStatus.SUCCESS:
        raise HTTPException(status_code=400, detail="Payment already completed")

    if data.payment_method:
        payment.payment_method = data.payment_method
    if data.notes:
        payment.notes = data.notes
    if data.payment_status:
        payment.payment_status = data.payment_status

    payment.paid_at = datetime.now(timezone.utc)

    if payment.service_id:
        sr = db.query(ServiceRequest).filter(ServiceRequest.id == payment.service_id).first()
        if sr:
            sr.status = ServiceStatus.PAID

    db.commit()
    db.refresh(payment)
    return _enrich_payment_data(payment, db)

@router.get("/history", response_model=List[PaymentOut])
def get_payment_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Legacy /history endpoint returning user payments list."""
    payments = db.query(Payment).filter(
        Payment.customer_id == current_user.id
    ).order_by(Payment.payment_date.desc()).all()
    return [_enrich_payment_data(p, db) for p in payments]

@router.get("/saved-cards", response_model=List[SavedCardOut])
def get_saved_cards(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(SavedCard).filter(SavedCard.user_id == current_user.id).all()

@router.post("/saved-cards", response_model=SavedCardOut)
def add_saved_card(
    data: SavedCardCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if data.is_default:
        db.query(SavedCard).filter_by(user_id=current_user.id).update({"is_default": False})
    card = SavedCard(user_id=current_user.id, **data.dict())
    db.add(card)
    db.commit()
    db.refresh(card)
    return card

@router.delete("/saved-cards/{card_id}")
def delete_saved_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    card = db.query(SavedCard).filter(
        SavedCard.id == card_id,
        SavedCard.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"message": "Card removed"}

@router.patch("/saved-cards/{card_id}/set-default")
def set_default_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    db.query(SavedCard).filter_by(user_id=current_user.id).update({"is_default": False})
    card = db.query(SavedCard).filter(
        SavedCard.id == card_id,
        SavedCard.user_id == current_user.id
    ).first()
    if not card:
         raise HTTPException(status_code=404, detail="Card not found")
    card.is_default = True
    db.commit()
    return {"message": "Default card updated"}

@router.get("/{payment_id}", response_model=PaymentOut)
def get_single_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    payment = db.query(Payment).filter(
        Payment.payment_id == payment_id,
        Payment.customer_id == current_user.id
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return _enrich_payment_data(payment, db)

@router.delete("/{payment_id}")
def delete_single_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    payment = db.query(Payment).filter(
        Payment.payment_id == payment_id,
        Payment.customer_id == current_user.id
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(payment)
    db.commit()
    return {"message": "Invoice deleted"}

# ─── Internal Helpers ─────────────────────────────────────

def _enrich_payment_data(payment: Payment, db: Session) -> dict:
    """Enriches the db record with relational details to match legacy schema."""
    result = {
        "id": payment.payment_id,
        "invoice_number": payment.invoice_number,
        "user_id": payment.customer_id,
        "service_request_id": payment.service_id,
        "service_breakdown": json.loads(payment.service_breakdown) if payment.service_breakdown else None,
        "subtotal": payment.subtotal,
        "gst_rate": payment.gst_rate,
        "gst_amount": payment.gst_amount,
        "discount": payment.discount,
        "total_amount": payment.amount,
        "payment_method": payment.payment_method,
        # Map internally SUCCESS -> PAID so React front-end doesn't break
        "payment_status": PaymentStatus.PAID if payment.payment_status == PaymentStatus.SUCCESS else payment.payment_status,
        "paid_at": payment.paid_at,
        "created_at": payment.payment_date,
        "notes": payment.notes,
        "car": None,
        "service_type": None,
    }
    
    if payment.service_id:
        sr = db.query(ServiceRequest).filter(ServiceRequest.id == payment.service_id).first()
        if sr:
            result["service_type"] = sr.service_type
            car = db.query(Car).filter(Car.id == sr.car_id).first()
            if car:
                result["car"] = {
                    "id": car.id,
                    "user_id": car.user_id,
                    "car_model": car.car_model,
                    "car_brand": car.car_brand,
                    "car_number": car.car_number,
                }
    return result