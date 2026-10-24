from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserResponse, ProfileUpdate, ChangePasswordRequest

# Lives under /auth alongside login/register, but in its own module so the
# signed-in user's self-service endpoints stay separate from the auth flows.
router = APIRouter(prefix="/auth", tags=["Profile"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit the safe profile fields. Email changes are deliberately not
    allowed here — they need to go through email confirmation."""
    if data.full_name is not None:
        full_name = data.full_name.strip()
        if not full_name:
            raise HTTPException(status_code=400, detail="Name can't be empty")
        current_user.full_name = full_name

    if data.phone is not None:
        phone = data.phone.strip()
        if not phone:
            raise HTTPException(status_code=400, detail="Phone number can't be empty")
        if phone != current_user.phone:
            # Phone is a login identifier and how agents find savers, so it must stay unique.
            taken = db.query(User).filter(User.phone == phone, User.id != current_user.id).first()
            if taken:
                raise HTTPException(status_code=400, detail="Phone number already registered")
            current_user.phone = phone

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 400 rather than 401: the frontend treats any 401 as "session expired"
    # and logs the user out, which is wrong for a mistyped password.
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if data.current_password == data.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from the current one")

    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}
