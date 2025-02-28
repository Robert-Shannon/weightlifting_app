from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database.session import get_db
from src.models.user import User
from src.schemas.user import UserCreate, UserResponse, UserUpdate, UserLogin, TokenResponse
from src.services.user_services import create_user, authenticate_user, update_user
from src.utils.auth import create_access_token
from src.utils.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def create_new_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with name, email, and password.
    Returns user details with an authentication token.
    """
    # Create the user
    user = create_user(db, user_data)
    
    # Generate a token
    token = create_access_token(str(user.id))
    
    # Return user with token
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
    # Authenticate the user
    user = authenticate_user(db, user_data.email, user_data.password)
    
    # If authentication failed
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate a token
    token = create_access_token(str(user.id))
    
    # Return user with token
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "token": token
    }

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.
    Requires authentication.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(
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

@router.get("/", response_model=list[UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
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