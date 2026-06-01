import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Float, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"


class ServiceStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, enum.Enum):
    CREDIT_DEBIT_CARD = "CREDIT_DEBIT_CARD"
    UPI = "UPI"
    NET_BANKING = "NET_BANKING"
    DIGITAL_WALLET = "DIGITAL_WALLET"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER)

    cars = relationship("Car", back_populates="owner")
    service_requests = relationship("ServiceRequest", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    saved_cards = relationship("SavedCard", back_populates="user")


class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    car_model = Column(String(100), nullable=False)
    car_brand = Column(String(100), nullable=False)
    car_number = Column(String(20), unique=True, nullable=False)

    owner = relationship("User", back_populates="cars")
    service_requests = relationship("ServiceRequest", back_populates="car")


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    car_id = Column(Integer, ForeignKey("cars.id"))
    service_type = Column(String(100), nullable=False)
    request_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(ServiceStatus), default=ServiceStatus.PENDING)

    user = relationship("User", back_populates="service_requests")
    car = relationship("Car", back_populates="service_requests")
    payment = relationship("Payment", back_populates="service_request", uselist=False)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(20), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=True)

    service_breakdown = Column(Text, nullable=True)  # JSON string

    subtotal = Column(Float, nullable=False, default=0.0)
    gst_rate = Column(Float, nullable=False, default=18.0)
    gst_amount = Column(Float, nullable=False, default=0.0)
    discount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)

    payment_method = Column(Enum(PaymentMethod), nullable=True)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(255), nullable=True)

    user = relationship("User", back_populates="payments")
    service_request = relationship("ServiceRequest", back_populates="payment")


class SavedCard(Base):
    __tablename__ = "saved_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    card_type = Column(String(20))       # visa / mastercard / amex / rupay
    last4 = Column(String(4), nullable=False)
    expiry = Column(String(7), nullable=False)   # MM/YY
    name_on_card = Column(String(100))
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_cards")