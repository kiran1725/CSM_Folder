from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import ServiceRequestCreate, ServiceRequestOut, ServiceRequestUpdate, ServiceStatus
from app.services.business_service import ServiceRequestService
from app.api.deps import get_current_user, get_admin_user

router = APIRouter(prefix="/service-requests", tags=["service-requests"])

# Customer Endpoints
@router.post("/", response_model=ServiceRequestOut)
def create_request(
    request: ServiceRequestCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    return ServiceRequestService.create_request(db, request, current_user.id)

@router.get("/me", response_model=List[ServiceRequestOut])
def get_my_requests(
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    return ServiceRequestService.get_my_requests(db, current_user.id)

# Admin Endpoints
@router.get("/all", response_model=List[ServiceRequestOut])
def get_all_requests(
    db: Session = Depends(get_db), 
    admin_user = Depends(get_admin_user)
):
    return ServiceRequestService.get_all_requests(db)

@router.patch("/{request_id}/status", response_model=ServiceRequestOut)
def update_status(
    request_id: int, 
    update_data: ServiceRequestUpdate, 
    db: Session = Depends(get_db), 
    admin_user = Depends(get_admin_user)
):
    updated_request = ServiceRequestService.update_request_status(db, request_id, update_data.status)
    if not updated_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    return updated_request
