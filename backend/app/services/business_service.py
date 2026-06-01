from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.repositories.car_repository import CarRepository
from app.repositories.service_repository import ServiceRepository
from app.services.auth_service import AuthService
from app.schemas.schemas import UserCreate, CarCreate, ServiceRequestCreate, ServiceStatus
from fastapi import HTTPException

class UserService:
    @staticmethod
    def register_user(db: Session, user: UserCreate):
        # Check if email already exists
        existing_user = UserRepository.get_user_by_email(db, user.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        hashed_password = AuthService.get_password_hash(user.password)
        return UserRepository.create_user(db, user, hashed_password)

    @staticmethod
    def login_user(db: Session, email, password):
        user = UserRepository.get_user_by_email(db, email)
        if not user or not AuthService.verify_password(password, user.password):
            return None
        return user

class CarService:
    @staticmethod
    def add_car(db: Session, car: CarCreate, user_id: int):
        return CarRepository.create_car(db, car, user_id)

    @staticmethod
    def get_my_cars(db: Session, user_id: int):
        return CarRepository.get_user_cars(db, user_id)

class ServiceRequestService:
    @staticmethod
    def create_request(db: Session, request: ServiceRequestCreate, user_id: int):
        return ServiceRepository.create_request(db, request, user_id)

    @staticmethod
    def get_my_requests(db: Session, user_id: int):
        return ServiceRepository.get_user_requests(db, user_id)

    @staticmethod
    def get_all_requests(db: Session):
        return ServiceRepository.get_all_requests(db)

    @staticmethod
    def update_request_status(db: Session, request_id: int, status: ServiceStatus):
        return ServiceRepository.update_status(db, request_id, status)
