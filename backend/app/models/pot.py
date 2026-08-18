from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Date, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.core.database import Base


class PotStatus(str, enum.Enum):
    awaiting_agent = "awaiting_agent"  # cash pot created, no agent has claimed it yet
    pending = "pending"        # Created, not started yet
    active = "active"          # Cycle running
    completed = "completed"    # 30 days done, awaiting cashout
    cashed_out = "cashed_out"  # Paid out


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    mobile_money = "mobile_money"
    bank_transfer = "bank_transfer"


class Pot(Base):
    __tablename__ = "pots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    saver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    name = Column(String, nullable=False, default="My Pot 1")

    # Pot configuration
    daily_amount = Column(Float, nullable=False)
    currency = Column(String, default="GHS", nullable=False)
    payment_method = Column(SAEnum(PaymentMethod), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)  # start_date + 29 days

    # Progress tracking
    status = Column(SAEnum(PotStatus), default=PotStatus.pending, nullable=False)
    days_paid = Column(Integer, default=0)       # allocated days
    buffer_days = Column(Integer, default=0)     # paid but not yet allocated
    total_collected = Column(Float, default=0.0) # total cash received

    # Payout
    payout_requested_at = Column(DateTime, nullable=True)
    payout_notice_given_at = Column(DateTime, nullable=True)
    payout_method = Column(SAEnum(PaymentMethod), nullable=True)
    cashed_out_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    saver = relationship("User", back_populates="pots", foreign_keys=[saver_id])
    agent = relationship("Agent", back_populates="pots")
    day_allocations = relationship("DayAllocation", back_populates="pot", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="pot", cascade="all, delete-orphan")
    payout = relationship("Payout", back_populates="pot", uselist=False)