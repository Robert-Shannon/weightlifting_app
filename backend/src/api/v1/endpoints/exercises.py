from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database.session import get_db

router = APIRouter()


@router.get("/")
def read_exercises(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return {"message": "List exercises endpoint"}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_exercise(db: Session = Depends(get_db)):
    return {"message": "Create exercise endpoint"}


@router.get("/{exercise_id}")
def read_exercise(exercise_id: str, db: Session = Depends(get_db)):
    return {"message": f"Get exercise {exercise_id} endpoint"}


@router.put("/{exercise_id}")
def update_exercise(exercise_id: str, db: Session = Depends(get_db)):
    return {"message": f"Update exercise {exercise_id} endpoint"}


@router.delete("/{exercise_id}")
def delete_exercise(exercise_id: str, db: Session = Depends(get_db)):
    return {"message": f"Delete exercise {exercise_id} endpoint"}


@router.post("/import")
def import_exercises(db: Session = Depends(get_db)):
    return {"message": "Import exercises from file endpoint"}
