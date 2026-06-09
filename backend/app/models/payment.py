import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Float, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PAID = "PAID"
    REFUNDED = "REFUNDED"

class PaymentMethod(str, enum.Enum):
    CREDIT_DEBIT_CARD = "CREDIT_DEBIT_CARD"
    UPI = "UPI"
    NET_BANKING = "NET_BANKING"
    DIGITAL_WALLET = "DIGITAL_WALLET"

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column("id", Integer, primary_key=True, index=True)
    invoice_number = Column("invoice_number", String(100), unique=True, nullable=False)
    customer_id = Column("user_id", Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column("service_request_id", Integer, ForeignKey("service_requests.id"), nullable=True)

    service_breakdown = Column(Text, nullable=True)  # JSON string

    subtotal = Column(Float, nullable=False, default=0.0)
    gst_rate = Column(Float, nullable=False, default=18.0)
    gst_amount = Column(Float, nullable=False, default=0.0)
    discount = Column(Float, nullable=False, default=0.0)
    amount = Column("total_amount", Float, nullable=False, default=0.0)

    payment_method = Column(Enum(PaymentMethod), nullable=True)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    payment_date = Column("created_at", DateTime(timezone=True), server_default=func.now())
    notes = Column(String(255), nullable=True)
    transaction_id = Column(String(255), nullable=True)

    user = relationship("User", back_populates="payments")
    service_request = relationship("ServiceRequest", back_populates="payment")

    # Compatibility properties (aliases) for original codebase usage
    @property
    def id(self):
        return self.payment_id

    @id.setter
    def id(self, value):
        self.payment_id = value

    @property
    def user_id(self):
        return self.customer_id

    @user_id.setter
    def user_id(self, value):
        self.customer_id = value

    @property
    def service_request_id(self):
        return self.service_id

    @service_request_id.setter
    def service_request_id(self, value):
        self.service_id = value

    @property
    def total_amount(self):
        return self.amount

    @total_amount.setter
    def total_amount(self, value):
        self.amount = value

    @property
    def created_at(self):
        return self.payment_date

    @created_at.setter
    def created_at(self, value):
        self.payment_date = value

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
