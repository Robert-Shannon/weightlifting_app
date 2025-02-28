from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime
import uuid

from src.models.user import User
from src.schemas.user import UserCreate, UserUpdate
from src.utils.auth import get_password_hash, verify_password

def get_user_by_email(db: Session, email: str):
    """Get a user by their email address"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str):
    """Get a user by their ID"""
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user_data: UserCreate):
    """Create a new user"""
    # Check if email already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        id=uuid.uuid4(),
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Save to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate a user by email and password"""
    user = get_user_by_email(db, email)
    
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user

def update_user(db: Session, user_id: str, user_data: UserUpdate):
    """Update user information"""
    # Get the user
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password(user_data.current_password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Update user fields
    if user_data.name:
        db_user.name = user_data.name
    
    if user_data.email:
        # Check if the new email already exists
        existing_user = get_user_by_email(db, user_data.email)
        if existing_user and existing_user.id != db_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        db_user.email = user_data.email
    
    # Update password if provided
    if user_data.new_password:
        db_user.password_hash = get_password_hash(user_data.new_password)
    
    # Update timestamp
    db_user.updated_at = datetime.utcnow()
    
    # Save changes
    db.commit()
    db.refresh(db_user)
    
    return db_user