from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


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
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
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
    """Used by Swagger UI authorize button. Username = phone number."""
    user = db.query(User).filter(User.phone == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone or password")

    token = create_access_token({
        "sub": str(user.id),
        "phone": user.phone,
        "role": user.role.value,
    })
    return {"access_token": token, "token_type": "bearer"}