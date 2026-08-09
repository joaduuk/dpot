from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.core.database import Base


class AgentStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    suspended = "suspended"


class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    market_name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    city = Column(String, nullable=False)
    country = Column(String, default="GH", nullable=False)
    mobile_money_number = Column(String, nullable=True)
    mobile_money_provider = Column(String, nullable=True)  # MTN, Vodafone, AirtelTigo
    status = Column(SAEnum(AgentStatus), default=AgentStatus.pending, nullable=False)
    total_savers = Column(Integer, default=0)
    total_commission_earned = Column(Float, default=0.0)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="agent_profile", foreign_keys=[user_id])
    pots = relationship("Pot", back_populates="agent")
    payments = relationship("Payment", back_populates="agent")
    reconciliations = relationship("DailyReconciliation", back_populates="agent")
    commissions = relationship("AgentCommission", back_populates="agent")
    #user = relationship("User", back_populates="agent_profile", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])