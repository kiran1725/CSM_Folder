from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import UserCreate, UserOut, LoginRequest, Token
from app.services.business_service import UserService
from app.services.auth_service import AuthService
from app.models.models import UserRole

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserService.register_user(db, user)
    return db_user

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = UserService.login_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    # Safely get role string whether it's an enum or plain string
    role_str = user.role.value if isinstance(user.role, UserRole) else str(user.role)

    access_token = AuthService.create_access_token(
        data={"sub": user.email, "role": role_str}
    )
    return {"access_token": access_token, "token_type": "bearer"}