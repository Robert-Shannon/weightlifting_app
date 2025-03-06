from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
import uuid
from datetime import datetime
import csv
import io
from typing import List, Dict, Any, Optional

from src.models.exercise import Exercise
from src.schemas.exercise import ExerciseCreate, ExerciseUpdate, ExerciseFilter

def get_exercises(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    filters: Optional[ExerciseFilter] = None
):
    """
    Get a list of exercises with optional filtering
    """
    query = db.query(Exercise)
    
    # Apply filters if provided
    if filters:
        if filters.target_muscle_group:
            query = query.filter(Exercise.target_muscle_group == filters.target_muscle_group)
        if filters.difficulty_level:
            query = query.filter(Exercise.difficulty_level == filters.difficulty_level)
        if filters.equipment:
            # Filter by either primary or secondary equipment
            query = query.filter(
                (Exercise.primary_equipment == filters.equipment) | 
                (Exercise.secondary_equipment == filters.equipment)
            )
        if filters.body_region:
            query = query.filter(Exercise.body_region == filters.body_region)
        if filters.force_type:
            query = query.filter(Exercise.force_type == filters.force_type)
        if filters.mechanics:
            query = query.filter(Exercise.mechanics == filters.mechanics)
    
    # Apply pagination
    return query.offset(skip).limit(limit).all()

def get_exercise_by_id(db: Session, exercise_id: str):
    """
    Get an exercise by its ID
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found"
        )
    return exercise

def get_exercise_by_name(db: Session, name: str):
    """
    Get an exercise by its name
    """
    return db.query(Exercise).filter(Exercise.name == name).first()

def create_exercise(db: Session, exercise_data: ExerciseCreate):
    """
    Create a new exercise
    """
    # Check if exercise with this name already exists
    existing_exercise = get_exercise_by_name(db, exercise_data.name)
    if existing_exercise:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Exercise with name '{exercise_data.name}' already exists"
        )
    
    # Create new exercise
    db_exercise = Exercise(
        id=uuid.uuid4(),
        **exercise_data.model_dump(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Save to database
    db.add(db_exercise)
    db.commit()
    db.refresh(db_exercise)
    
    return db_exercise

def update_exercise(db: Session, exercise_id: str, exercise_data: ExerciseUpdate):
    """
    Update an existing exercise
    """
    # Get the exercise
    db_exercise = get_exercise_by_id(db, exercise_id)
    
    # Check if name is being updated and already exists
    if exercise_data.name and exercise_data.name != db_exercise.name:
        existing_exercise = get_exercise_by_name(db, exercise_data.name)
        if existing_exercise:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Exercise with name '{exercise_data.name}' already exists"
            )
    
    # Update the exercise fields
    exercise_data_dict = {k: v for k, v in exercise_data.model_dump().items() if v is not None}
    for key, value in exercise_data_dict.items():
        setattr(db_exercise, key, value)
    
    # Update timestamp
    db_exercise.updated_at = datetime.utcnow()
    
    # Save changes
    db.commit()
    db.refresh(db_exercise)
    
    return db_exercise

def delete_exercise(db: Session, exercise_id: str):
    """
    Delete an exercise
    """
    # Get the exercise
    db_exercise = get_exercise_by_id(db, exercise_id)
    
    # Delete from database
    db.delete(db_exercise)
    db.commit()
    
    return {"success": True}

def import_exercises_from_csv(db: Session, file: UploadFile):
    """
    Import exercises from a CSV file
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )
    
    # Read the CSV file
    content = file.file.read()
    
    # Decode the content
    buffer = io.StringIO(content.decode('utf-8-sig'))
    
    # Parse the CSV
    reader = csv.DictReader(buffer)
    
    # Track imports
    total_imported = 0
    errors = []
    
    # Process each row
    for row in reader:
        try:
            # Clean up field names and values
            exercise_data = {}
            for key, value in row.items():
                clean_key = key.strip().lower().replace(' ', '_')
                if clean_key in [
                    'name', 'target_muscle_group', 'short_youtube_demonstration',
                    'in_depth_youtube_explanation', 'difficulty_level', 'prime_mover_muscle',
                    'secondary_muscle', 'tertiary_muscle', 'primary_equipment',
                    'secondary_equipment', 'posture', 'single_or_double_arm',
                    'continuous_or_alternating_arms', 'grip', 'load_position_ending',
                    'continuous_or_alternating_legs', 'body_region', 'force_type',
                    'mechanics', 'laterality', 'primary_exercise_classification',
                    'movement_pattern_1', 'movement_pattern_2', 'movement_pattern_3',
                    'plane_of_motion_1', 'plane_of_motion_2', 'plane_of_motion_3'
                ]:
                    exercise_data[clean_key] = value.strip() if value.strip() else None
                elif clean_key in ['primary_items_count', 'secondary_items_count']:
                    exercise_data[clean_key] = int(value) if value.strip() else None
                elif clean_key in ['foot_elevation', 'combination_exercises']:
                    exercise_data[clean_key] = value.lower() in ['true', 'yes', '1'] if value.strip() else None
            
            # Ensure required fields are present
            if not exercise_data.get('name'):
                errors.append(f"Row {total_imported + 1}: Missing name")
                continue
                
            if not exercise_data.get('target_muscle_group'):
                errors.append(f"Row {total_imported + 1}: Missing target muscle group")
                continue
            
            # Check if exercise already exists
            existing_exercise = get_exercise_by_name(db, exercise_data['name'])
            if existing_exercise:
                errors.append(f"Row {total_imported + 1}: Exercise '{exercise_data['name']}' already exists")
                continue
            
            # Create the exercise
            db_exercise = Exercise(
                id=uuid.uuid4(),
                **exercise_data,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(db_exercise)
            db.commit()
            
            total_imported += 1
            
        except Exception as e:
            db.rollback()
            errors.append(f"Row {total_imported + 1}: {str(e)}")
    
    return {"total_imported": total_imported, "errors": errors}