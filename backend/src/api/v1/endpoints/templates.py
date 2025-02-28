from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database.session import get_db

router = APIRouter()


@router.get("/")
def read_templates(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return {"message": "List templates endpoint"}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_template(db: Session = Depends(get_db)):
    return {"message": "Create template endpoint"}


@router.get("/{template_id}")
def read_template(template_id: str, db: Session = Depends(get_db)):
    return {"message": f"Get template {template_id} endpoint"}


@router.put("/{template_id}")
def update_template(template_id: str, db: Session = Depends(get_db)):
    return {"message": f"Update template {template_id} endpoint"}


@router.delete("/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db)):
    return {"message": f"Delete template {template_id} endpoint"}


@router.post("/{template_id}/exercises")
def add_exercise_to_template(template_id: str, db: Session = Depends(get_db)):
    return {"message": f"Add exercise to template {template_id} endpoint"}
