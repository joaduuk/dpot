from sqlalchemy import Boolean, Column, String, Float, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.core.database import Base


class PaymentStatus(str, enum.Enum):
    pending = "pending"       # Recorded by agent, not yet transferred
    confirmed = "confirmed"   # Platform received funds
    disputed = "disputed"


class DayAllocationStatus(str, enum.Enum):
    unpaid = "unpaid"
    pending = "pending"       # Payment recorded, awaiting confirmation
    confirmed = "confirmed"   # Green dot
    buffer = "buffer"         # Paid but not allocated to a day yet


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pot_id = Column(UUID(as_uuid=True), ForeignKey("pots.id"), nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)

    amount = Column(Float, nullable=False)
    days_covered = Column(Integer, nullable=False)  # amount / daily_amount
    method = Column(String, nullable=False)          # cash | mobile_money | bank_transfer
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.pending, nullable=False)

    # Reference for digital payments
    reference = Column(String, nullable=True)

    recorded_by = Column(String, nullable=False)     # "agent" | "system" | "saver"
    wallet_credit_used = Column(Float, default=0.0)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)

    # Relationships
    pot = relationship("Pot", back_populates="payments")
    agent = relationship("Agent", back_populates="payments")
    day_allocations = relationship("DayAllocation", back_populates="payment")


class DayAllocation(Base):
    __tablename__ = "day_allocations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pot_id = Column(UUID(as_uuid=True), ForeignKey("pots.id"), nullable=False)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True)

    day_number = Column(Integer, nullable=False)
    status = Column(SAEnum(DayAllocationStatus), default=DayAllocationStatus.unpaid)
    is_fee_day = Column(Boolean, default=False)   # ← NEW: True only for day 31
    allocated_at = Column(DateTime, nullable=True)

    # Relationships
    pot = relationship("Pot", back_populates="day_allocations")
    payment = relationship("Payment", back_populates="day_allocations")