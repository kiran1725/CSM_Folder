from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum
from app.models.payment import PaymentStatus, PaymentMethod

# ─── New Payment Schemas ─────────────────────────────────
class OrderCreate(BaseModel):
    service_id: int

class OrderOut(BaseModel):
    order_id: str
    amount: float
    currency: str = "INR"

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class VerifyResponse(BaseModel):
    status: str
    payment_id: Optional[int] = None
    invoice_number: Optional[str] = None

# ─── Legacy / Compatibility Schemas ───────────────────────
class ServiceLineItem(BaseModel):
    label: str
    amount: float

class PaymentCreate(BaseModel):
    service_request_id: Optional[int] = None
    service_breakdown: Optional[List[ServiceLineItem]] = None
    subtotal: float
    gst_rate: float = 18.0
    gst_amount: float
    discount: float = 0.0
    total_amount: float
    payment_method: Optional[PaymentMethod] = None
    notes: Optional[str] = None

class PaymentUpdate(BaseModel):
    payment_method: Optional[PaymentMethod] = None
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None

class CarOut(BaseModel):
    id: int
    user_id: int
    car_model: str
    car_brand: str
    car_number: str

    class Config:
        from_attributes = True

class PaymentOut(BaseModel):
    id: int
    invoice_number: str
    user_id: int
    service_request_id: Optional[int] = None
    service_breakdown: Optional[List[ServiceLineItem]] = None
    subtotal: float
    gst_rate: float
    gst_amount: float
    discount: float
    total_amount: float
    payment_method: Optional[PaymentMethod] = None
    payment_status: PaymentStatus
    paid_at: Optional[datetime] = None
    created_at: datetime
    notes: Optional[str] = None
    car: Optional[CarOut] = None
    service_type: Optional[str] = None

    class Config:
        from_attributes = True

class SavedCardCreate(BaseModel):
    card_type: str
    last4: str
    expiry: str
    name_on_card: Optional[str] = None
    is_default: bool = False

class SavedCardOut(BaseModel):
    id: int
    card_type: str
    last4: str
    expiry: str
    name_on_card: Optional[str] = None
    is_default: bool

    class Config:
        from_attributes = True
