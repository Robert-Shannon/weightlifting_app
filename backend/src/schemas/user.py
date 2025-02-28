from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: str
    new_password: Optional[str] = None
    
    @validator('new_password')
    def password_strength(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError('New password must be at least 8 characters long')
        return v

class UserResponse(UserBase):
    id: UUID
    
    class Config:
        orm_mode = True

class TokenResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    token: str