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
    ConfirmEmailRequest, ResendConfirmationRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

RESET_TOKEN_EXPIRE_MINUTES = 30
VERIFY_TOKEN_EXPIRE_HOURS = 48
RESEND_COOLDOWN_SECONDS = 60


def _email_not_verified(user: User) -> HTTPException:
    # A structured detail so the frontend can show a "resend" button instead
    # of a plain error; the email is safe to return since the password matched.
    return HTTPException(
        status_code=403,
        detail={
            "code": "email_not_verified",
            "message": "Please confirm your email before logging in. Check your inbox for the link.",
            "email": user.email,
        },
    )


def _send_confirmation_email(user: User, db: Session):
    # Like reset tokens, a signed JWT with a "purpose" claim — plus the email
    # it was sent to, so a link stops working if the address is changed.
    token = create_access_token(
        {"sub": str(user.id), "purpose": "email_verify", "email": user.email},
        expires_delta=timedelta(hours=VERIFY_TOKEN_EXPIRE_HOURS),
    )
    confirm_link = f"{FRONTEND_URL}/confirm-email?token={token}"
    html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#1f2937">Confirm your {APP_NAME} email</h2>
          <p style="color:#4b5563">
            Hi {user.full_name}, welcome to {APP_NAME}! Click below to confirm your email
            and start saving. This link expires in {VERIFY_TOKEN_EXPIRE_HOURS} hours.
          </p>
          <a href="{confirm_link}" style="display:inline-block;background:#1a6b4a;color:white;
             padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
            Confirm email
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:16px">
            If you didn't create a {APP_NAME} account, you can safely ignore this email.
          </p>
        </div>
    """
    user.email_verification_sent_at = datetime.utcnow()
    db.commit()
    try:
        send_email(user.email, f"{APP_NAME} — Confirm your email", html)
    except Exception as e:
        print(f"[EMAIL] Confirmation send failed: {e}")


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
        email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # No token is returned: the saver logs in after clicking the emailed link.
    _send_confirmation_email(user, db)
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
    if not user.email_verified:
        raise _email_not_verified(user)

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
    if not user.email_verified:
        raise _email_not_verified(user)

    token = create_access_token({
        "sub": str(user.id),
        "phone": user.phone,
        "role": user.role.value,
    })
    return {"access_token": token, "token_type": "bearer"}


# ── Email confirmation ─────────────────────────────────────────────────────

@router.post("/confirm-email")
def confirm_email(data: ConfirmEmailRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.token)
    if not payload or payload.get("purpose") != "email_verify":
        raise HTTPException(status_code=400, detail="Invalid or expired confirmation link")

    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or user.email != payload.get("email"):
        raise HTTPException(status_code=400, detail="Invalid or expired confirmation link")

    if not user.email_verified:
        user.email_verified = True
        db.commit()
    return {"message": "Email confirmed. You can now log in."}


@router.post("/resend-confirmation")
def resend_confirmation(data: ResendConfirmationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    # Same generic response either way, so this can't be used to discover
    # which emails have accounts. The cooldown stops it spamming an inbox.
    if user and not user.email_verified:
        sent_at = user.email_verification_sent_at
        if not sent_at or datetime.utcnow() - sent_at >= timedelta(seconds=RESEND_COOLDOWN_SECONDS):
            _send_confirmation_email(user, db)

    return {"message": "If that email is waiting for confirmation, a new link has been sent."}


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
