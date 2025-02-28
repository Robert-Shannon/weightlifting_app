from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from src.core.database.session import get_db
from src.utils.auth import decode_access_token
from src.services.user_services import get_user_by_id

# OAuth2 scheme for token retrieval
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency to get the current authenticated user from a JWT token.
    This can be used to protect routes that require authentication.
    """
    # Create an exception for authentication failures
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode the token
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception
    
    # Get the user from the database
    user = get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    
    return user