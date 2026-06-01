from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import UserOut, CarOut
from app.api.deps import get_admin_user
from app.models.models import User, Car, UserRole

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    """Get all registered customers (admin only)."""
    return db.query(User).filter(User.role == UserRole.CUSTOMER).all()

@router.get("/cars", response_model=List[CarOut])
def get_all_cars(
    db: Session = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    """Get all registered vehicles (admin only)."""
    return db.query(Car).all()