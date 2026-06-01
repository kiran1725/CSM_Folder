# backend/app/api/users.py
# Add these routes to your existing users router (or create this file and include it in main.py)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.services.auth_service import AuthService
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/users", tags=["users"])

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.put("/me")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.name:   current_user.name  = data.name
    if data.phone:  current_user.phone = data.phone
    db.commit(); db.refresh(current_user)
    return { "id": current_user.id, "name": current_user.name, "email": current_user.email, "phone": current_user.phone }

@router.put("/me/password")
def update_password(data: PasswordUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not AuthService.verify_password(data.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    current_user.password = AuthService.get_password_hash(data.new_password)
    db.commit()
    return { "message": "Password updated successfully" }