from sqlalchemy.orm import Session
from app.models.models import User
from app.schemas.schemas import UserCreate

class UserRepository:
    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def create_user(db: Session, user: UserCreate, hashed_password: str):
        db_user = User(
            name=user.name,
            email=user.email,
            password=hashed_password,
            phone=user.phone,
            role=user.role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_users(db: Session):
        return db.query(User).all()

    @staticmethod
    def update_user(db: Session, user_id: int, user_update_data: dict):
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user:
            for key, value in user_update_data.items():
                setattr(db_user, key, value)
            db.commit()
            db.refresh(db_user)
        return db_user
