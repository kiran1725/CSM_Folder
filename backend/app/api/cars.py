from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import CarCreate, CarOut
from app.services.business_service import CarService
from app.api.deps import get_current_user

router = APIRouter(prefix="/cars", tags=["cars"])

@router.post("/", response_model=CarOut)
def add_car(car: CarCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return CarService.add_car(db, car, current_user.id)

@router.get("/", response_model=List[CarOut])
def get_my_cars(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return CarService.get_my_cars(db, current_user.id)
