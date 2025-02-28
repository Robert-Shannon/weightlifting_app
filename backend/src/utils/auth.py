from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import jwt
from src.core.config.settings import settings

# Password context for hashing and verifying
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Generate a hashed version of the password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that a plain password matches a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str) -> str:
    """Create a JWT access token for a user"""
    # Set token expiration
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Create token payload
    to_encode = {
        "sub": str(user_id),
        "exp": expire
    }
    
    # Encode the JWT token
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt

def decode_access_token(token: str) -> Optional[str]:
    """Decode a JWT token and return the user ID if valid"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except jwt.PyJWTError:
        return None