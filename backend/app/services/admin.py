from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import UserOut
from app.api.deps import get_admin_user
from app.repositories.user_repository import UserRepository
from app.repositories.car_repository import CarRepository
from app.schemas.schemas import CarOut

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db), admin_user = Depends(get_admin_user)):
    return UserRepository.get_users(db)

@router.get("/cars", response_model=List[CarOut])
def get_all_cars(db: Session = Depends(get_db), admin_user = Depends(get_admin_user)):
    return CarRepository.get_all_cars(db)