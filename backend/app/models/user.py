from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    saver = "saver"
    agent = "agent"
    admin = "admin"
    super_admin = "super_admin"


class UserStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    pending = "pending"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=True, unique=True)
    phone = Column(String, nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.saver, nullable=False)
    status = Column(SAEnum(UserStatus), default=UserStatus.active, nullable=False)
    country = Column(String, default="GH", nullable=False)
    language = Column(String, default="en", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    # Self-registered savers must click the emailed link before they can log
    # in; accounts an admin creates are trusted and start verified.
    email_verified = Column(Boolean, default=False, nullable=False)
    email_verification_sent_at = Column(DateTime, nullable=True)

    # Relationships
    pots = relationship("Pot", back_populates="saver", foreign_keys="Pot.saver_id")
    #agent_profile = relationship("Agent", back_populates="user", uselist=False)
    agent_profile = relationship("Agent", back_populates="user", uselist=False, foreign_keys="Agent.user_id")
    wallet = relationship("Wallet", back_populates="user", uselist=False)