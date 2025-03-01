from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from src.models.workout import (
    WorkoutTemplate,
    WorkoutTemplateExercise,
    WorkoutTemplateSet
)
from src.models.exercise import Exercise
from src.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateExerciseCreate,
    TemplateExerciseUpdate,
    TemplateSetCreate,
    TemplateSetUpdate,
    TemplateSuperset
)

def get_templates(db: Session, user_id: str, skip: int = 0, limit: int = 100):
    """
    Get a list of workout templates for a user
    """
    templates = db.query(WorkoutTemplate).filter(
        WorkoutTemplate.user_id == user_id
    ).order_by(
        WorkoutTemplate.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    # Get exercise count for each template
    result = []
    for template in templates:
        exercise_count = db.query(WorkoutTemplateExercise).filter(
            WorkoutTemplateExercise.workout_template_id == template.id
        ).count()
        
        template_dict = {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "exercise_count": exercise_count
        }
        result.append(template_dict)
    
    return result

def get_template_by_id(db: Session, template_id: str, user_id: str):
    """
    Get a workout template by its ID
    """
    template = db.query(WorkoutTemplate).filter(
        WorkoutTemplate.id == template_id,
        WorkoutTemplate.user_id == user_id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with ID {template_id} not found"
        )
    
    return template

def get_template_with_exercises(db: Session, template_id: str, user_id: str):
    """
    Get a workout template with all its exercises and sets
    """
    template = get_template_by_id(db, template_id, user_id)
    
    # Get exercises for this template
    exercises = db.query(WorkoutTemplateExercise).filter(
        WorkoutTemplateExercise.workout_template_id == template_id
    ).order_by(
        WorkoutTemplateExercise.order
    ).all()
    
    # Get sets and exercise details for each exercise
    result_exercises = []
    for exercise in exercises:
        # Get sets
        sets = db.query(WorkoutTemplateSet).filter(
            WorkoutTemplateSet.workout_template_exercise_id == exercise.id
        ).order_by(
            WorkoutTemplateSet.set_number
        ).all()
        
        # Get exercise details
        exercise_details = db.query(Exercise).filter(
            Exercise.id == exercise.exercise_id
        ).first()
        
        exercise_dict = {
            "id": exercise.id,
            "exercise_id": exercise.exercise_id,
            "order": exercise.order,
            "notes": exercise.notes,
            "superset_group_id": exercise.superset_group_id,
            "superset_order": exercise.superset_order,
            "created_at": exercise.created_at,
            "updated_at": exercise.updated_at,
            "sets": sets,
            "exercise_name": exercise_details.name if exercise_details else None,
            "target_muscle_group": exercise_details.target_muscle_group if exercise_details else None
        }
        
        result_exercises.append(exercise_dict)
    
    # Construct response
    result = {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "user_id": template.user_id,
        "created_at": template.created_at,
        "updated_at": template.updated_at,
        "exercises": result_exercises
    }
    
    return result

def create_template(db: Session, user_id: str, template_data: TemplateCreate):
    """
    Create a new workout template
    """
    # Create template with new UUID
    now = datetime.utcnow()
    template_id = uuid.uuid4()
    
    template = WorkoutTemplate(
        id=template_id,
        name=template_data.name,
        description=template_data.description,
        user_id=user_id,
        created_at=now,
        updated_at=now
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    # Return with empty exercises list
    return {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "user_id": template.user_id,
        "created_at": template.created_at,
        "updated_at": template.updated_at,
        "exercises": []
    }

def update_template(db: Session, template_id: str, user_id: str, template_data: TemplateUpdate):
    """
    Update a workout template
    """
    template = get_template_by_id(db, template_id, user_id)
    
    # Update fields if provided
    if template_data.name is not None:
        template.name = template_data.name
    
    if template_data.description is not None:
        template.description = template_data.description
    
    template.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Return updated template with exercises
    return get_template_with_exercises(db, template_id, user_id)

def delete_template(db: Session, template_id: str, user_id: str):
    """
    Delete a workout template
    """
    template = get_template_by_id(db, template_id, user_id)
    
    # Delete all sets belonging to exercises in this template
    exercises = db.query(WorkoutTemplateExercise).filter(
        WorkoutTemplateExercise.workout_template_id == template_id
    ).all()
    
    for exercise in exercises:
        db.query(WorkoutTemplateSet).filter(
            WorkoutTemplateSet.workout_template_exercise_id == exercise.id
        ).delete()
    
    # Delete all exercises in this template
    db.query(WorkoutTemplateExercise).filter(
        WorkoutTemplateExercise.workout_template_id == template_id
    ).delete()
    
    # Delete the template
    db.delete(template)
    db.commit()
    
    return {"success": True}

def add_exercise_to_template(db: Session, template_id: str, user_id: str, exercise_data: TemplateExerciseCreate):
    """
    Add an exercise to a template
    """
    # Verify the template exists and belongs to the user
    template = get_template_by_id(db, template_id, user_id)
    
    # Verify the exercise exists
    exercise = db.query(Exercise).filter(Exercise.id == exercise_data.exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_data.exercise_id} not found"
        )
    
    # Create a new template exercise
    now = datetime.utcnow()
    exercise_id = uuid.uuid4()
    
    template_exercise = WorkoutTemplateExercise(
        id=exercise_id,
        workout_template_id=template_id,
        exercise_id=exercise_data.exercise_id,
        order=exercise_data.order,
        notes=exercise_data.notes,
        created_at=now,
        updated_at=now
    )
    
    db.add(template_exercise)
    db.commit()
    db.refresh(template_exercise)
    
    # Add exercise details to response
    return {
        "id": template_exercise.id,
        "exercise_id": template_exercise.exercise_id,
        "order": template_exercise.order,
        "notes": template_exercise.notes,
        "exercise_name": exercise.name,
        "target_muscle_group": exercise.target_muscle_group,
        "sets": []
    }

def update_template_exercise(db: Session, template_id: str, exercise_id: str, user_id: str, exercise_data: TemplateExerciseUpdate):
    """
    Update an exercise in a template
    """
    # Verify the template exists and belongs to the user
    template = get_template_by_id(db, template_id, user_id)
    
    # Get the template exercise
    template_exercise = db.query(WorkoutTemplateExercise).filter(
        WorkoutTemplateExercise.id == exercise_id,
        WorkoutTemplateExercise.workout_template_id == template_id
    ).first()
    
    if not template_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found in template {template_id}"
        )
    
    # Update fields if provided
    if exercise_data.order is not None:
        template_exercise.order = exercise_data.order
    
    if exercise_data.notes is not None:
        template_exercise.notes = exercise_data.notes
    
    if exercise_data.superset_group_id is not None:
        template_exercise.superset_group_id = exercise_data.superset_group_id
    
    if exercise_data.superset_order is not None:
        template_exercise.superset_order = exercise_data.superset_order
    
    template_exercise.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(template_exercise)
    
    # Get exercise details
    exercise = db.query(Exercise).filter(Exercise.id == template_exercise.exercise_id).first()
    
    # Get sets for this exercise
    sets = db.query(WorkoutTemplateSet).filter(
        WorkoutTemplateSet.workout_template_exercise_id == exercise_id
    ).order_by(WorkoutTemplateSet.set_number).all()
    
    # Construct response
    return {
        "id": template_exercise.id,
        "exercise_id": template_exercise.exercise_id,
        "order": template_exercise.order,
        "notes": template_exercise.notes,
        "superset_group_id": template_exercise.superset_group_id,
        "superset_order": template_exercise.superset_order,
        "sets": sets,
        "exercise_name": exercise.name if exercise else None,
        "target_muscle_group": exercise.target_muscle_group if exercise else None,
        "created_at": template_exercise.created_at,
        "updated_at": template_exercise.updated_at
    }

def delete_template_exercise(db: Session, template_id: str, exercise_id: str, user_id: str):
    """
    Remove an exercise from a template
    """
    # Verify the template exists and belongs to the user
    template = get_template_by_id(db, template_id, user_id)
    
    # Get the template exercise
    template_exercise = db.query(WorkoutTemplateExercise).filter(
        WorkoutTemplateExercise.id == exercise_id,
        WorkoutTemplateExercise.workout_template_id == template_id
    ).first()
    
    if not template_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found in template {template_id}"
        )
    
    # Delete all sets belonging to this exercise
    db.query(WorkoutTemplateSet).filter(
        WorkoutTemplateSet.workout_template_exercise_id == exercise_id
    ).delete()
    
    # Delete the exercise
    db.delete(template_exercise)
    db.commit()
    
    return {"success": True}

def add_set_to_template_exercise(db: Session, template_id: str, exercise_id: str, user_id: str, set_data: TemplateSetCreate):
    """
    Add a set to an exercise in a template
    """
    # Verify the template exists and belongs to the user
    template = get_template_by_id(db, template_id, user_id)
    
    # Get the template exercise
    template_exercise = db.query(WorkoutTemplateExercise).filter(
        WorkoutTemplateExercise.id == exercise_id,
        WorkoutTemplateExercise.workout_template_id == template_id
    ).first()
    
    if not template_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found in template {template_id}"
        )
    
    # Check if a set with this number already exists
    existing_set = db.query(WorkoutTemplateSet).filter(
        WorkoutTemplateSet.workout_template_exercise_id == exercise_id,
        WorkoutTemplateSet.set_number == set_data.set_number
    ).first()
    
    if existing_set:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Set number {set_data.set_number} already exists for this exercise"
        )
    
    # Create a new set
    now = datetime.utcnow()
    set_id = uuid.uuid4()
    
    template_set = WorkoutTemplateSet(
        id=set_id,
        workout_template_exercise_id=exercise_id,
        set_number=set_data.set_number,
        target_reps=set_data.target_reps,
        target_weight=set_data.target_weight,
        is_warmup=set_data.is_warmup,
        target_rest_time=set_data.target_rest_time,
        tempo=set_data.tempo,
        created_at=now,
        updated_at=now
    )
    
    db.add(template_set)
    db.commit()
    db.refresh(template_set)
    
    return template_set

def update_template_set(db: Session, template_id: str, exercise_id: str, set_id: str, user_id: str, set_data: TemplateSetUpdate):
    """
    Update a set in a template
    """
    # Verify the template exists and belongs to the user
    template = get_template_by_id(db, template_id, user_id)
    
    # Get the template exercise
    template_exercise = db.query(WorkoutTemplateExercise).filter(
        WorkoutTemplateExercise.id == exercise_id,
        WorkoutTemplateExercise.workout_template_id == template_id
    ).first()
    
    if not template_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found in template {template_id}"
        )
    
    # Get the template set
    template_set = db.query(WorkoutTemplateSet).filter(
        WorkoutTemplateSet.id == set_id,
        WorkoutTemplateSet.workout_template_exercise_id == exercise_id
    ).first()
    
    if not template_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Set with ID {set_id} not found for exercise {exercise_id}"
        )
    
    # Update fields if provided
    if set_data.target_reps is not None:
        template_set.target_reps = set_data.target_reps
    
    if set_data.target_weight is not None:
        template_set.target_weight = set_data.target_weight
    
    if set_data.is_warmup is not None:
        template_set.is_warmup = set_data.is_warmup
    
    if set_data.target_rest_time is not None:
        template_set.target_rest_time = set_data.target_rest_time
    
    if set_data.tempo is not None:
        template_set.tempo = set_data.tempo
    
    template_set.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(template_set)
    
    return template_set

def delete_template_set(db: Session, template_id: str, exercise_id: str, set_id: str, user_id: str):
    """
    Remove a set from a template
    """
    # Verify the template exists and belongs to the user
    template = get_template_by_id(db, template_id, user_id)
    
    # Get the template exercise
    template_exercise = db.query(WorkoutTemplateExercise).filter(
        WorkoutTemplateExercise.id == exercise_id,
        WorkoutTemplateExercise.workout_template_id == template_id
    ).first()
    
    if not template_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found in template {template_id}"
        )
    
    # Get the template set
    template_set = db.query(WorkoutTemplateSet).filter(
        WorkoutTemplateSet.id == set_id,
        WorkoutTemplateSet.workout_template_exercise_id == exercise_id
    ).first()
    
    if not template_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Set with ID {set_id} not found for exercise {exercise_id}"
        )
    
    # Delete the set
    db.delete(template_set)
    db.commit()
    
    return {"success": True}

def create_superset(db: Session, template_id: str, user_id: str, superset_data: TemplateSuperset):
    """
    Create a superset group in a template
    """
    # Verify the template exists and belongs to the user
    template = get_template_by_id(db, template_id, user_id)
    
    # Check if the exercise count matches the order count
    if len(superset_data.exercise_ids) != len(superset_data.orders):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of exercise IDs must match number of orders"
        )
    
    # Generate a unique superset group ID
    superset_group_id = str(uuid.uuid4())
    
    # Update each exercise in the superset
    updated_exercises = []
    for i, exercise_id in enumerate(superset_data.exercise_ids):
        # Get the template exercise
        template_exercise = db.query(WorkoutTemplateExercise).filter(
            WorkoutTemplateExercise.id == exercise_id,
            WorkoutTemplateExercise.workout_template_id == template_id
        ).first()
        
        if not template_exercise:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exercise with ID {exercise_id} not found in template {template_id}"
            )
        
        # Update superset info
        template_exercise.superset_group_id = superset_group_id
        template_exercise.superset_order = superset_data.orders[i]
        template_exercise.updated_at = datetime.utcnow()
        
        db.add(template_exercise)
        
        # Add to updated exercises with attributes
        updated_exercises.append({
            "id": str(exercise_id),
            "superset_group_id": superset_group_id,
            "superset_order": superset_data.orders[i]
        })
    
    db.commit()
    
    return {"superset_group_id": superset_group_id, "exercises": updated_exercises}

def delete_superset(db: Session, template_id: str, superset_id: str, user_id: str):
    """
    Remove a superset grouping (keeping exercises)
    """
    # Verify the template exists and belongs to the user
    template = get_template_by_id(db, template_id, user_id)
    
    # Find exercises in this superset
    superset_exercises = db.query(WorkoutTemplateExercise).filter(
        WorkoutTemplateExercise.workout_template_id == template_id,
        WorkoutTemplateExercise.superset_group_id == superset_id
    ).all()
    
    if not superset_exercises:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Superset with ID {superset_id} not found in template {template_id}"
        )
    
    # Remove superset grouping from exercises
    for exercise in superset_exercises:
        exercise.superset_group_id = None
        exercise.superset_order = None
        exercise.updated_at = datetime.utcnow()
        db.add(exercise)
    
    db.commit()
    
    return {"success": True}