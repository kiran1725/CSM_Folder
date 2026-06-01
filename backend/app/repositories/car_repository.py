from sqlalchemy.orm import Session
from app.models.models import Car
from app.schemas.schemas import CarCreate

class CarRepository:
    @staticmethod
    def create_car(db: Session, car: CarCreate, user_id: int):
        db_car = Car(**car.dict(), user_id=user_id)
        db.add(db_car)
        db.commit()
        db.refresh(db_car)
        return db_car

    @staticmethod
    def get_user_cars(db: Session, user_id: int):
        return db.query(Car).filter(Car.user_id == user_id).all()

    @staticmethod
    def get_car_by_id(db: Session, car_id: int):
        return db.query(Car).filter(Car.id == car_id).first()

    @staticmethod
    def get_all_cars(db: Session):
        return db.query(Car).all()