from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.user import UserRole, UserStatus


class UserRegister(BaseModel):
    full_name: str
    phone: str
    email: EmailStr  # required — no longer optional, needed for login-by-email and password reset
    password: str
    country: str = "GH"
    # No role field: public sign-up always makes a saver. Agents and admins
    # come only from the admin endpoints or the agent-apply flow. Extra
    # fields (e.g. a client-sent "role") are ignored by pydantic.


class UserLogin(BaseModel):
    identifier: str  # phone number OR email
    password: str


class UserResponse(BaseModel):
    id: UUID
    full_name: str
    phone: str
    email: Optional[str] = None
    role: UserRole
    status: UserStatus
    country: str
    email_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ConfirmEmailRequest(BaseModel):
    token: str


class ResendConfirmationRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ProfileUpdate(BaseModel):
    # Only the safe fields — email changes go through email confirmation.
    full_name: Optional[str] = None
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
