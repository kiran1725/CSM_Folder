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
    PAID = "PAID"


from app.schemas.payment import PaymentStatus, PaymentMethod


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


from app.schemas.payment import (
    ServiceLineItem, PaymentCreate, PaymentUpdate, PaymentOut,
    SavedCardCreate, SavedCardOut
)