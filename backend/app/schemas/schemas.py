from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Enums ───────────────────────────────────────────────
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"


class ServiceStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, Enum):
    CREDIT_DEBIT_CARD = "CREDIT_DEBIT_CARD"
    UPI = "UPI"
    NET_BANKING = "NET_BANKING"
    DIGITAL_WALLET = "DIGITAL_WALLET"


# ─── Auth / User ─────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# ─── Car ─────────────────────────────────────────────────
class CarCreate(BaseModel):
    car_model: str
    car_brand: str
    car_number: str


class CarOut(BaseModel):
    id: int
    user_id: int
    car_model: str
    car_brand: str
    car_number: str

    class Config:
        from_attributes = True


# ─── Service Request ─────────────────────────────────────
class ServiceRequestCreate(BaseModel):
    car_id: int
    service_type: str


class ServiceRequestOut(BaseModel):
    id: int
    user_id: int
    car_id: int
    service_type: str
    request_date: datetime
    status: ServiceStatus

    class Config:
        from_attributes = True


class ServiceRequestUpdate(BaseModel):
    status: ServiceStatus


class ServiceStatusUpdate(BaseModel):
    status: ServiceStatus


# ─── Payment ─────────────────────────────────────────────
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


# ─── Saved Card ──────────────────────────────────────────
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