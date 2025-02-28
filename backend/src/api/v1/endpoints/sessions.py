from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database.session import get_db

router = APIRouter()


@router.get("/")
def read_sessions(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return {"message": "List sessions endpoint"}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_session(db: Session = Depends(get_db)):
    return {"message": "Create session endpoint"}


@router.get("/{session_id}")
def read_session(session_id: str, db: Session = Depends(get_db)):
    return {"message": f"Get session {session_id} endpoint"}


@router.put("/{session_id}")
def update_session(session_id: str, db: Session = Depends(get_db)):
    return {"message": f"Update session {session_id} endpoint"}


@router.post("/{session_id}/complete")
def complete_session(session_id: str, db: Session = Depends(get_db)):
    return {"message": f"Complete session {session_id} endpoint"}


@router.post("/{session_id}/exercises")
def add_exercise_to_session(session_id: str, db: Session = Depends(get_db)):
    return {"message": f"Add exercise to session {session_id} endpoint"}


@router.post("/{session_id}/exercises/{exercise_id}/sets")
def log_set(session_id: str, exercise_id: str, db: Session = Depends(get_db)):
    return {"message": f"Log set for exercise {exercise_id} in session {session_id} endpoint"}
