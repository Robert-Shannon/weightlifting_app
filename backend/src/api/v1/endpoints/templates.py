from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from src.core.database.session import get_db
from src.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse,
    TemplateExerciseCreate,
    TemplateExerciseUpdate,
    TemplateExerciseResponse,
    TemplateSetCreate,
    TemplateSetUpdate,
    TemplateSetResponse,
    TemplateSuperset,
    SupersetResponse
)
from src.services.template_services import (
    get_templates as get_templates_service,
    get_template_with_exercises as get_template_service,
    create_template as create_template_service,
    update_template as update_template_service,
    delete_template as delete_template_service,
    add_exercise_to_template as add_exercise_service,
    update_template_exercise as update_exercise_service,
    delete_template_exercise as delete_exercise_service,
    add_set_to_template_exercise as add_set_service,
    update_template_set as update_set_service,
    delete_template_set as delete_set_service,
    create_superset as create_superset_service,
    delete_superset as delete_superset_service
)
from src.utils.dependencies import get_current_user
from src.models.user import User

router = APIRouter()

@router.get("/", response_model=List[TemplateListResponse])
def read_templates(
    skip: int = Query(0, ge=0, description="Skip N items"),
    limit: int = Query(100, ge=1, le=100, description="Limit to N items"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a list of workout templates.
    """
    return get_templates_service(db, str(current_user.id), skip, limit)

@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new workout template.
    
    - **name**: Template name (e.g., "Push Workout")
    - **description**: Optional template description
    """
    return create_template_service(db, str(current_user.id), template_data)

@router.get("/{template_id}", response_model=TemplateResponse)
def read_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get template details with exercises and sets.
    """
    return get_template_service(db, str(template_id), str(current_user.id))

@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: UUID,
    template_data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update template basic info (name, description).
    """
    return update_template_service(db, str(template_id), str(current_user.id), template_data)

@router.delete("/{template_id}", response_model=dict)
def delete_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a template.
    """
    return delete_template_service(db, str(template_id), str(current_user.id))

@router.post("/{template_id}/exercises", response_model=TemplateExerciseResponse)
def add_exercise_to_template(
    template_id: UUID,
    exercise_data: TemplateExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add an exercise to a template.
    
    - **exercise_id**: ID of the exercise to add
    - **order**: Position of the exercise in the template
    - **notes**: Optional notes for this exercise
    """
    return add_exercise_service(db, str(template_id), str(current_user.id), exercise_data)

@router.put("/{template_id}/exercises/{exercise_id}", response_model=TemplateExerciseResponse)
def update_exercise_in_template(
    template_id: UUID,
    exercise_id: UUID,
    exercise_data: TemplateExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an exercise in a template.
    
    - **order**: Position of the exercise
    - **notes**: Notes for this exercise
    - **superset_group_id**: Superset group ID (if part of a superset)
    - **superset_order**: Order within the superset
    """
    return update_exercise_service(db, str(template_id), str(exercise_id), str(current_user.id), exercise_data)

@router.delete("/{template_id}/exercises/{exercise_id}", response_model=dict)
def delete_exercise_from_template(
    template_id: UUID,
    exercise_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove an exercise from a template.
    """
    return delete_exercise_service(db, str(template_id), str(exercise_id), str(current_user.id))

@router.post("/{template_id}/exercises/{exercise_id}/sets", response_model=TemplateSetResponse)
def add_set_to_exercise(
    template_id: UUID,
    exercise_id: UUID,
    set_data: TemplateSetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a set to an exercise in a template.
    
    - **set_number**: Number of the set (1, 2, 3, etc.)
    - **target_reps**: Target number of repetitions
    - **target_weight**: Target weight for the set
    - **is_warmup**: Whether this is a warmup set
    - **target_rest_time**: Target rest time after the set (in seconds)
    - **tempo**: Optional tempo notation (e.g., "3-1-2-0")
    """
    return add_set_service(db, str(template_id), str(exercise_id), str(current_user.id), set_data)

@router.put("/{template_id}/exercises/{exercise_id}/sets/{set_id}", response_model=TemplateSetResponse)
def update_set_in_template(
    template_id: UUID,
    exercise_id: UUID,
    set_id: UUID,
    set_data: TemplateSetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a set in a template.
    """
    return update_set_service(db, str(template_id), str(exercise_id), str(set_id), str(current_user.id), set_data)

@router.delete("/{template_id}/exercises/{exercise_id}/sets/{set_id}", response_model=dict)
def delete_set_from_template(
    template_id: UUID,
    exercise_id: UUID,
    set_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a set from a template.
    """
    return delete_set_service(db, str(template_id), str(exercise_id), str(set_id), str(current_user.id))

@router.post("/{template_id}/supersets", response_model=SupersetResponse)
def create_superset_in_template(
    template_id: UUID,
    superset_data: TemplateSuperset,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a superset group in a template.
    
    - **exercise_ids**: List of exercise IDs to include in the superset
    - **orders**: List of order values for each exercise in the superset
    """
    return create_superset_service(db, str(template_id), str(current_user.id), superset_data)

@router.delete("/{template_id}/supersets/{superset_id}", response_model=dict)
def delete_superset_from_template(
    template_id: UUID,
    superset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a superset grouping (keeps exercises).
    """
    return delete_superset_service(db, str(template_id), str(superset_id), str(current_user.id))