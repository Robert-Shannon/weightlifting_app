from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from src.core.database.session import get_db
from src.models.exercise import Exercise
from src.schemas.exercise import ExerciseCreate, ExerciseUpdate, ExerciseResponse, ExerciseImportResponse, ExerciseFilter
from src.services.exercise_services import (
    get_exercises, 
    get_exercise_by_id, 
    create_exercise, 
    update_exercise, 
    delete_exercise,
    import_exercises_from_csv
)
from src.utils.dependencies import get_current_user
from src.models.user import User

router = APIRouter()

@router.get("/", response_model=List[ExerciseResponse])
def read_exercises(
    target_muscle_group: Optional[str] = Query(None, description="Filter by target muscle group"),
    difficulty_level: Optional[str] = Query(None, description="Filter by difficulty level"),
    equipment: Optional[str] = Query(None, description="Filter by equipment type"),
    body_region: Optional[str] = Query(None, description="Filter by body region"),
    force_type: Optional[str] = Query(None, description="Filter by force type"),
    mechanics: Optional[str] = Query(None, description="Filter by mechanics"),
    skip: int = Query(0, ge=0, description="Skip N items"),
    limit: int = Query(100, ge=1, le=100, description="Limit to N items"),
    db: Session = Depends(get_db)
):
    """
    Get a list of exercises with optional filtering.
    Supports filtering by target muscle group, difficulty level, equipment, etc.
    """
    filters = ExerciseFilter(
        target_muscle_group=target_muscle_group,
        difficulty_level=difficulty_level,
        equipment=equipment,
        body_region=body_region,
        force_type=force_type,
        mechanics=mechanics
    )
    
    exercises = get_exercises(db, skip=skip, limit=limit, filters=filters)
    return exercises

@router.post("/", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_new_exercise(
    exercise_data: ExerciseCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new exercise (admin only).
    Requires authentication.
    """
    # In a real app, you'd check if the user is an admin here
    # if not current_user.is_admin:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not authorized to create exercises"
    #     )
    
    return create_exercise(db, exercise_data)

@router.get("/{exercise_id}", response_model=ExerciseResponse)
def read_exercise(
    exercise_id: UUID, 
    db: Session = Depends(get_db)
):
    """
    Get details for a specific exercise by ID.
    """
    return get_exercise_by_id(db, str(exercise_id))

@router.put("/{exercise_id}", response_model=ExerciseResponse)
def update_existing_exercise(
    exercise_id: UUID, 
    exercise_data: ExerciseUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an exercise (admin only).
    Requires authentication.
    """
    # In a real app, you'd check if the user is an admin here
    # if not current_user.is_admin:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not authorized to update exercises"
    #     )
    
    return update_exercise(db, str(exercise_id), exercise_data)

@router.delete("/{exercise_id}")
def delete_existing_exercise(
    exercise_id: UUID, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an exercise (admin only).
    Requires authentication.
    """
    # In a real app, you'd check if the user is an admin here
    # if not current_user.is_admin:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not authorized to delete exercises"
    #     )
    
    return delete_exercise(db, str(exercise_id))

@router.post("/import", response_model=ExerciseImportResponse)
def import_exercises(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import exercises from a CSV file (admin only).
    Requires authentication.
    The CSV should have headers matching the exercise model fields.
    """
    # In a real app, you'd check if the user is an admin here
    # if not current_user.is_admin:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not authorized to import exercises"
    #     )
    
    return import_exercises_from_csv(db, file)
