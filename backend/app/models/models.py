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
    PAID = "PAID"


from app.models.payment import PaymentStatus, PaymentMethod


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


from app.models.payment import Payment, SavedCard