from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from src.core.database.session import get_db
from src.models.user import User
from src.schemas.user import UserCreate, UserResponse, UserUpdate, UserLogin, TokenResponse
from src.services.user_services import create_user, authenticate_user, update_user
from src.utils.auth import create_access_token
from src.utils.dependencies import get_current_user

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with name, email, and password.
    Returns user details with an authentication token.
    """
    user = create_user(db, user_data)
    token = create_access_token(str(user.id))
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "token": token
    }

@router.post("/login", response_model=TokenResponse)
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user with email and password.
    Returns user details with an authentication token.
    """
    user = authenticate_user(db, user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(str(user.id))
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "token": token
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.
    Requires authentication.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current authenticated user's profile.
    Requires authentication and current password for verification.
    """
    updated_user = update_user(db, str(current_user.id), user_data)
    return updated_user

@router.get("/", response_model=List[UserResponse])
def list_all_users(
    skip: int = Query(0, ge=0, description="Skip N users"),
    limit: int = Query(100, ge=1, le=100, description="Limit to N users"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all users (admin functionality).
    Requires authentication.
    In a real application, this would be restricted to admin users.
    """
    # For simplicity, we're not implementing admin checks here
    users = db.query(User).offset(skip).limit(limit).all()
    return users