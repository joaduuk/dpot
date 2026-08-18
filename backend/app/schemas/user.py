from pydantic import BaseModel, EmailStr
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
    role: UserRole = UserRole.saver


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
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str