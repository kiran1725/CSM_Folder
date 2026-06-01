from sqlalchemy.orm import Session
from app.models.models import ServiceRequest, ServiceStatus
from app.schemas.schemas import ServiceRequestCreate

class ServiceRepository:
    @staticmethod
    def create_request(db: Session, request: ServiceRequestCreate, user_id: int):
        db_request = ServiceRequest(**request.dict(), user_id=user_id)
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def get_user_requests(db: Session, user_id: int):
        return db.query(ServiceRequest).filter(ServiceRequest.user_id == user_id).all()

    @staticmethod
    def get_all_requests(db: Session):
        return db.query(ServiceRequest).all()

    @staticmethod
    def update_status(db: Session, request_id: int, status: ServiceStatus):
        db_request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
        if db_request:
            db_request.status = status
            db.commit()
            db.refresh(db_request)
        return db_request
