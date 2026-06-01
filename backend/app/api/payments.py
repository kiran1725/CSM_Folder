from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import Payment, SavedCard, ServiceRequest, PaymentStatus, PaymentMethod
from app.schemas.schemas import PaymentCreate, PaymentOut, PaymentUpdate, SavedCardCreate, SavedCardOut
from typing import List
import uuid, json
from datetime import datetime, timezone

router = APIRouter(prefix="/payments", tags=["payments"])


def _generate_invoice_number(db: Session) -> str:
    count = db.query(Payment).count() + 1
    return f"INV-{datetime.now().year}-{str(count).zfill(4)}"


def _detect_card_type(last4_or_number: str) -> str:
    n = last4_or_number.replace(" ", "")
    if n.startswith("4"):
        return "visa"
    if n.startswith(("51", "52", "53", "54", "55")):
        return "mastercard"
    if n.startswith(("34", "37")):
        return "amex"
    if n.startswith("6"):
        return "rupay"
    return "unknown"


# ─── Create / initiate a payment ─────────────────────────
@router.post("/initiate", response_model=PaymentOut)
def initiate_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if data.total_amount <= 0:
        raise HTTPException(400, "Invalid payment amount")

    invoice_no = _generate_invoice_number(db)

    breakdown_json = None
    if data.service_breakdown:
        breakdown_json = json.dumps([item.dict() for item in data.service_breakdown])

    payment = Payment(
        invoice_number=invoice_no,
        user_id=current_user.id,
        service_request_id=data.service_request_id,
        service_breakdown=breakdown_json,
        subtotal=data.subtotal,
        gst_rate=data.gst_rate,
        gst_amount=data.gst_amount,
        discount=data.discount,
        total_amount=data.total_amount,
        payment_method=data.payment_method,
        payment_status=PaymentStatus.PENDING,
        notes=data.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return _enrich_payment(payment, db)


# ─── Confirm / process payment ────────────────────────────
@router.patch("/{payment_id}/pay", response_model=PaymentOut)
def process_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    if payment.payment_status == PaymentStatus.PAID:
        raise HTTPException(400, "Payment already completed")

    if data.payment_method:
        payment.payment_method = data.payment_method
    if data.notes:
        payment.notes = data.notes

    payment.payment_status = PaymentStatus.PAID
    payment.paid_at = datetime.now(timezone.utc)

    if payment.service_request_id:
        from app.models.models import ServiceStatus
        sr = db.query(ServiceRequest).filter(ServiceRequest.id == payment.service_request_id).first()
        if sr and sr.status == "PENDING":
            sr.status = ServiceStatus.IN_PROGRESS

    db.commit()
    db.refresh(payment)
    return _enrich_payment(payment, db)


# ─── Get my payments ──────────────────────────────────────
@router.get("/history", response_model=List[PaymentOut])
def payment_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()
    return [_enrich_payment(p, db) for p in payments]


# ─── Saved Cards (MUST be before /{payment_id} to avoid route conflict) ───
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
        raise HTTPException(404, "Card not found")
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
        raise HTTPException(404, "Card not found")
    card.is_default = True
    db.commit()
    return {"message": "Default card updated"}


# ─── Get single payment (MUST be after /saved-cards) ─────
@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    return _enrich_payment(payment, db)


# ─── Helper ───────────────────────────────────────────────
def _enrich_payment(payment: Payment, db: Session) -> dict:
    """Add car info and service_type from the linked service request."""
    result = {
        "id": payment.id,
        "invoice_number": payment.invoice_number,
        "user_id": payment.user_id,
        "service_request_id": payment.service_request_id,
        "service_breakdown": json.loads(payment.service_breakdown) if payment.service_breakdown else None,
        "subtotal": payment.subtotal,
        "gst_rate": payment.gst_rate,
        "gst_amount": payment.gst_amount,
        "discount": payment.discount,
        "total_amount": payment.total_amount,
        "payment_method": payment.payment_method,
        "payment_status": payment.payment_status,
        "paid_at": payment.paid_at,
        "created_at": payment.created_at,
        "notes": payment.notes,
        "car": None,
        "service_type": None,
    }
    if payment.service_request_id:
        sr = db.query(ServiceRequest).filter(ServiceRequest.id == payment.service_request_id).first()
        if sr:
            result["service_type"] = sr.service_type
            from app.models.models import Car
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