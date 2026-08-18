from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.core.email import send_email
from app.core.config import FRONTEND_URL, APP_NAME
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import (
    UserRegister, UserLogin, UserResponse, TokenResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

RESET_TOKEN_EXPIRE_MINUTES = 30


@router.post("/register", response_model=UserResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.phone == data.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    if data.email and db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=data.full_name,
        phone=data.phone,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        country=data.country,
        status=UserStatus.active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login accepts either a phone number or an email in `identifier`."""
    identifier = data.identifier.strip()
    user = (
        db.query(User)
        .filter((User.phone == identifier) | (User.email == identifier))
        .first()
    )
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone/email or password")
    if user.status == UserStatus.suspended:
        raise HTTPException(status_code=403, detail="Account suspended")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({
        "sub": str(user.id),
        "phone": user.phone,
        "role": user.role.value,
    })
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ── Swagger UI compatible login ───────────────────────────────────────────
@router.post("/token")
def token_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Used by Swagger UI authorize button. Username = phone number or email."""
    identifier = form_data.username.strip()
    user = (
        db.query(User)
        .filter((User.phone == identifier) | (User.email == identifier))
        .first()
    )
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone/email or password")

    token = create_access_token({
        "sub": str(user.id),
        "phone": user.phone,
        "role": user.role.value,
    })
    return {"access_token": token, "token_type": "bearer"}


# ── Password reset ─────────────────────────────────────────────────────────
# Reset tokens are short-lived signed JWTs (a "purpose" claim marks them as
# reset-only) rather than a stored DB record — no migration needed, and
# they self-expire after RESET_TOKEN_EXPIRE_MINUTES.

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    # Always return the same generic response whether or not the email is
    # registered — this avoids leaking which emails have accounts.
    if user:
        token = create_access_token(
            {"sub": str(user.id), "purpose": "password_reset"},
            expires_delta=timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
        )
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        html = f"""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h2 style="color:#1f2937">Reset your {APP_NAME} password</h2>
              <p style="color:#4b5563">
                Hi {user.full_name}, click below to reset your password. This link expires in
                {RESET_TOKEN_EXPIRE_MINUTES} minutes.
              </p>
              <a href="{reset_link}" style="display:inline-block;background:#1a6b4a;color:white;
                 padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
                Reset password
              </a>
              <p style="color:#9ca3af;font-size:12px;margin-top:16px">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
        """
        try:
            send_email(user.email, f"{APP_NAME} — Reset your password", html)
        except Exception as e:
            print(f"[EMAIL] Password reset send failed: {e}")

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.token)
    if not payload or payload.get("purpose") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password reset successfully. You can now log in."}
