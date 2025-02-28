from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database.session import get_db

router = APIRouter()


@router.get("/")
def read_users(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return {"message": "List users endpoint"}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(db: Session = Depends(get_db)):
    return {"message": "Create user endpoint"}


@router.get("/me")
def read_user_me(db: Session = Depends(get_db)):
    return {"message": "Current user info endpoint"}


@router.put("/me")
def update_user_me(db: Session = Depends(get_db)):
    return {"message": "Update current user endpoint"}
