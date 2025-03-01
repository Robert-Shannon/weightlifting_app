from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
import uuid
from datetime import datetime
from typing import List, Optional

from src.models.workout import (
    WorkoutSession, 
    WorkoutSessionExercise, 
    WorkoutSet,
    WorkoutTemplate,
    WorkoutTemplateExercise,
    WorkoutTemplateSet,
    WorkoutSessionTemplate
)
from src.models.exercise import Exercise
from src.schemas.session import (
    SessionCreate, 
    SessionUpdate, 
    SessionComplete,
    SessionExerciseCreate,
    SessionExerciseUpdate,
    SessionSetCreate,
    SessionSetUpdate,
    SessionSetRest,
    SupersetCreate
)

def get_sessions(db: Session, user_id: str, skip: int = 0, limit: int = 100, 
                template_id: Optional[str] = None, start_date: Optional[datetime] = None, 
                end_date: Optional[datetime] = None):
    """
    Get a list of workout sessions for a user with optional filtering
    """
    query = db.query(WorkoutSession).filter(WorkoutSession.user_id == user_id)
    
    # Apply filters if provided
    if template_id:
        query = query.join(WorkoutSessionTemplate).filter(
            WorkoutSessionTemplate.workout_template_id == template_id
        )
    
    if start_date:
        query = query.filter(WorkoutSession.started_at >= start_date)
    
    if end_date:
        query = query.filter(WorkoutSession.started_at <= end_date)
    
    # Order by most recent first
    query = query.order_by(WorkoutSession.started_at.desc())
    
    # Apply pagination
    return query.offset(skip).limit(limit).all()

def get_session_by_id(db: Session, session_id: str, user_id: str):
    """
    Get a workout session by its ID
    """
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID {session_id} not found"
        )
    
    return session

def get_session_with_exercises(db: Session, session_id: str, user_id: str):
    """
    Get a workout session with all its exercises and sets
    """
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == user_id
    ).options(
        joinedload(WorkoutSession.exercises)
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID {session_id} not found"
        )
    
    # Load sets for each exercise
    for exercise in session.exercises:
        exercise.sets = db.query(WorkoutSet).filter(
            WorkoutSet.workout_session_exercise_id == exercise.id
        ).order_by(WorkoutSet.set_number).all()
        
        # Load exercise details
        exercise_details = db.query(Exercise).filter(
            Exercise.id == exercise.exercise_id
        ).first()
        
        if exercise_details:
            exercise.exercise_name = exercise_details.name
            exercise.target_muscle_group = exercise_details.target_muscle_group
    
    return session

def create_session(db: Session, user_id: str, session_data: SessionCreate):
    """
    Create a new workout session
    """
    # Create the session
    now = datetime.utcnow()
    session_id = uuid.uuid4()
    
    db_session = WorkoutSession(
        id=session_id,
        user_id=user_id,
        name=session_data.name,
        notes=session_data.notes,
        started_at=now,
        created_at=now,
        updated_at=now
    )
    
    db.add(db_session)
    db.commit()
    
    # If template IDs are provided, add exercises from templates
    if session_data.template_ids:
        for template_id in session_data.template_ids:
            # Link session to template
            db_session_template = WorkoutSessionTemplate(
                id=uuid.uuid4(),
                workout_session_id=session_id,
                workout_template_id=template_id
            )
            db.add(db_session_template)
            
            # Get template exercises
            template_exercises = db.query(WorkoutTemplateExercise).filter(
                WorkoutTemplateExercise.workout_template_id == template_id
            ).order_by(WorkoutTemplateExercise.order).all()
            
            # Add exercises to session
            for template_exercise in template_exercises:
                session_exercise = WorkoutSessionExercise(
                    id=uuid.uuid4(),
                    workout_session_id=session_id,
                    exercise_id=template_exercise.exercise_id,
                    order=template_exercise.order,
                    workout_template_exercise_id=template_exercise.id,
                    notes=template_exercise.notes,
                    superset_group_id=template_exercise.superset_group_id,
                    superset_order=template_exercise.superset_order,
                    created_at=now,
                    updated_at=now
                )
                db.add(session_exercise)
                db.flush()  # Flush to get the session_exercise.id
                
                # Get template sets
                template_sets = db.query(WorkoutTemplateSet).filter(
                    WorkoutTemplateSet.workout_template_exercise_id == template_exercise.id
                ).order_by(WorkoutTemplateSet.set_number).all()
                
                # Add sets to session exercise
                for template_set in template_sets:
                    session_set = WorkoutSet(
                        id=uuid.uuid4(),
                        workout_session_exercise_id=session_exercise.id,
                        set_number=template_set.set_number,
                        reps_completed=0,  # Will be filled in later when the set is logged
                        weight=template_set.target_weight,
                        is_warmup=template_set.is_warmup,
                        tempo=template_set.tempo,
                        workout_template_set_id=template_set.id,
                        created_at=now,
                        updated_at=now
                    )
                    db.add(session_set)
        
        db.commit()
    
    # Refresh the session with exercises
    return get_session_with_exercises(db, str(session_id), user_id)

def update_session(db: Session, session_id: str, user_id: str, session_data: SessionUpdate):
    """
    Update a workout session
    """
    # Get the session
    session = get_session_by_id(db, session_id, user_id)
    
    # Check if the session is already completed
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a completed session"
        )
    
    # Update fields
    if session_data.name is not None:
        session.name = session_data.name
    
    if session_data.notes is not None:
        session.notes = session_data.notes
    
    session.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(session)
    
    return session

def complete_session(db: Session, session_id: str, user_id: str, complete_data: SessionComplete = None):
    """
    Mark a session as completed
    """
    # Get the session
    session = get_session_by_id(db, session_id, user_id)
    
    # Check if the session is already completed
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is already completed"
        )
    
    # Set completion time
    now = datetime.utcnow()
    session.completed_at = complete_data.completed_at if complete_data and complete_data.completed_at else now
    
    # Calculate duration
    if session.started_at:
        session.active_duration = int((session.completed_at - session.started_at).total_seconds())
    
    session.updated_at = now
    
    # Calculate total volume and other metrics
    # This could be expanded based on your needs
    total_volume = 0
    total_rest_duration = 0
    
    exercises = db.query(WorkoutSessionExercise).filter(
        WorkoutSessionExercise.workout_session_id == session_id
    ).all()
    
    for exercise in exercises:
        sets = db.query(WorkoutSet).filter(
            WorkoutSet.workout_session_exercise_id == exercise.id
        ).all()
        
        for workout_set in sets:
            if workout_set.weight and workout_set.reps_completed:
                total_volume += workout_set.weight * workout_set.reps_completed
            
            if workout_set.actual_rest_time:
                total_rest_duration += workout_set.actual_rest_time
    
    session.total_rest_duration = total_rest_duration
    
    # You could add code here to calculate and store additional metrics
    # in the workout_session_metrics table
    
    db.commit()
    db.refresh(session)
    
    return get_session_with_exercises(db, session_id, user_id)

def add_exercise_to_session(db: Session, session_id: str, user_id: str, exercise_data: SessionExerciseCreate):
    """
    Add an exercise to an active session
    """
    # Get the session
    session = get_session_by_id(db, session_id, user_id)
    
    # Check if the session is already completed
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add exercises to a completed session"
        )
    
    # Verify the exercise exists
    exercise = db.query(Exercise).filter(Exercise.id == exercise_data.exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_data.exercise_id} not found"
        )
    
    # Create new session exercise
    now = datetime.utcnow()
    session_exercise = WorkoutSessionExercise(
        id=uuid.uuid4(),
        workout_session_id=session_id,
        exercise_id=exercise_data.exercise_id,
        order=exercise_data.order,
        notes=exercise_data.notes,
        created_at=now,
        updated_at=now
    )
    
    db.add(session_exercise)
    db.commit()
    db.refresh(session_exercise)
    
    # Load exercise details
    session_exercise.exercise_name = exercise.name
    session_exercise.target_muscle_group = exercise.target_muscle_group
    
    return session_exercise

def start_exercise(db: Session, session_id: str, exercise_id: str, user_id: str):
    """
    Mark an exercise as started in a session
    """
    # Verify the session belongs to the user
    session = get_session_by_id(db, session_id, user_id)
    
    # Check if the session is already completed
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start exercises in a completed session"
        )
    
    # Get the session exercise
    session_exercise = db.query(WorkoutSessionExercise).filter(
        WorkoutSessionExercise.id == exercise_id,
        WorkoutSessionExercise.workout_session_id == session_id
    ).first()
    
    if not session_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found in session {session_id}"
        )
    
    # Set started_at if not already set
    if not session_exercise.started_at:
        now = datetime.utcnow()
        session_exercise.started_at = now
        session_exercise.updated_at = now
        
        db.commit()
        db.refresh(session_exercise)
    
    return session_exercise

def complete_exercise(db: Session, session_id: str, exercise_id: str, user_id: str):
    """
    Mark an exercise as completed in a session
    """
    # Verify the session belongs to the user
    session = get_session_by_id(db, session_id, user_id)
    
    # Check if the session is already completed
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot complete exercises in a completed session"
        )
    
    # Get the session exercise
    session_exercise = db.query(WorkoutSessionExercise).filter(
        WorkoutSessionExercise.id == exercise_id,
        WorkoutSessionExercise.workout_session_id == session_id
    ).first()
    
    if not session_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found in session {session_id}"
        )
    
    # Set completed_at and calculate duration
    now = datetime.utcnow()
    session_exercise.completed_at = now
    session_exercise.updated_at = now
    
    if session_exercise.started_at:
        session_exercise.active_duration = int((now - session_exercise.started_at).total_seconds())
    
    db.commit()
    db.refresh(session_exercise)
    
    return session_exercise

def log_set(db: Session, session_id: str, exercise_id: str, user_id: str, set_data: SessionSetCreate):
    """
    Log a completed set for an exercise in a session
    """
    # Verify the session belongs to the user
    session = get_session_by_id(db, session_id, user_id)
    
    # Check if the session is already completed
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot log sets in a completed session"
        )
    
    # Get the session exercise
    session_exercise = db.query(WorkoutSessionExercise).filter(
        WorkoutSessionExercise.id == exercise_id,
        WorkoutSessionExercise.workout_session_id == session_id
    ).first()
    
    if not session_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found in session {session_id}"
        )
    
    # Check if a set with this number already exists
    existing_set = db.query(WorkoutSet).filter(
        WorkoutSet.workout_session_exercise_id == exercise_id,
        WorkoutSet.set_number == set_data.set_number
    ).first()
    
    now = datetime.utcnow()
    
    if existing_set:
        # Update the existing set
        existing_set.reps_completed = set_data.reps_completed
        existing_set.weight = set_data.weight
        existing_set.is_warmup = set_data.is_warmup
        existing_set.rpe = set_data.rpe
        existing_set.notes = set_data.notes
        existing_set.completed_at = now
        existing_set.updated_at = now
        
        db.commit()
        db.refresh(existing_set)
        return existing_set
    else:
        # Create a new set
        new_set = WorkoutSet(
            id=uuid.uuid4(),
            workout_session_exercise_id=exercise_id,
            set_number=set_data.set_number,
            reps_completed=set_data.reps_completed,
            weight=set_data.weight,
            is_warmup=set_data.is_warmup,
            rpe=set_data.rpe,
            notes=set_data.notes,
            started_at=now,
            completed_at=now,
            created_at=now,
            updated_at=now
        )
        
        db.add(new_set)
        db.commit()
        db.refresh(new_set)
        return new_set

def update_set(db: Session, session_id: str, exercise_id: str, set_id: str, user_id: str, set_data: SessionSetUpdate):
    """
    Update a logged set
    """
    # Verify the session belongs to the user
    session = get_session_by_id(db, session_id, user_id)
    
    # Check if the session is already completed
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update sets in a completed session"
        )
    
    # Get the session exercise
    session_exercise = db.query(WorkoutSessionExercise).filter(
        WorkoutSessionExercise.id == exercise_id,
        WorkoutSessionExercise.workout_session_id == session_id
    ).first()
    
    if not session_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found in session {session_id}"
        )
    
    # Get the set
    workout_set = db.query(WorkoutSet).filter(
        WorkoutSet.id == set_id,
        WorkoutSet.workout_session_exercise_id == exercise_id
    ).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Set with ID {set_id} not found for exercise {exercise_id}"
        )
    
    # Update fields
    if set_data.reps_completed is not None:
        workout_set.reps_completed = set_data.reps_completed
    
    if set_data.weight is not None:
        workout_set.weight = set_data.weight
    
    if set_data.is_warmup is not None:
        workout_set.is_warmup = set_data.is_warmup
    
    if set_data.rpe is not None:
        workout_set.rpe = set_data.rpe
    
    if set_data.notes is not None:
        workout_set.notes = set_data.notes
    
    workout_set.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(workout_set)
    
    return workout_set

def start_rest(db: Session, session_id: str, exercise_id: str, set_id: str, user_id: str):
    """
    Start rest timer after a set
    """
    # Verify the session belongs to the user
    session = get_session_by_id(db, session_id, user_id)
    
    # Check if the session is already completed
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start rest timer in a completed session"
        )
    
    # Get the set
    workout_set = db.query(WorkoutSet).filter(
        WorkoutSet.id == set_id
    ).join(WorkoutSessionExercise).filter(
        WorkoutSessionExercise.id == exercise_id,
        WorkoutSessionExercise.workout_session_id == session_id
    ).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Set with ID {set_id} not found for exercise {exercise_id} in session {session_id}"
        )
    
    # Set rest start time
    now = datetime.utcnow()
    workout_set.rest_start_time = now
    workout_set.updated_at = now
    
    db.commit()
    db.refresh(workout_set)
    
    return workout_set

def end_rest(db: Session, session_id: str, exercise_id: str, set_id: str, user_id: str):
    """
    End rest timer after a set
    """
    # Verify the session belongs to the user
    session = get_session_by_id(db, session_id, user_id)
    
    # Check if the session is already completed
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot end rest timer in a completed session"
        )
    
    # Get the set
    workout_set = db.query(WorkoutSet).filter(
        WorkoutSet.id == set_id
    ).join(WorkoutSessionExercise).filter(
        WorkoutSessionExercise.id == exercise_id,
        WorkoutSessionExercise.workout_session_id == session_id
    ).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Set with ID {set_id} not found for exercise {exercise_id} in session {session_id}"
        )
    
    # Check if rest timer was started
    if not workout_set.rest_start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rest timer was not started for this set"
        )
    
    # Set rest end time and calculate duration
    now = datetime.utcnow()
    workout_set.rest_end_time = now
    workout_set.actual_rest_time = int((now - workout_set.rest_start_time).total_seconds())
    workout_set.updated_at = now
    
    db.commit()
    db.refresh(workout_set)
    
    return workout_set

def create_superset(db: Session, session_id: str, user_id: str, superset_data: SupersetCreate):
    """
    Create a superset group in a session
    """
    # Verify the session belongs to the user
    session = get_session_by_id(db, session_id, user_id)
    
    # Check if the session is already completed
    if session.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create supersets in a completed session"
        )
    
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
        # Get the session exercise
        session_exercise = db.query(WorkoutSessionExercise).filter(
            WorkoutSessionExercise.id == exercise_id,
            WorkoutSessionExercise.workout_session_id == session_id
        ).first()
        
        if not session_exercise:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exercise with ID {exercise_id} not found in session {session_id}"
            )
        
        # Update superset info
        session_exercise.superset_group_id = superset_group_id
        session_exercise.superset_order = superset_data.orders[i]
        session_exercise.updated_at = datetime.utcnow()
        
        db.add(session_exercise)
        
        # Add exercise details with attributes to the list
        updated_exercises.append({
            "id": str(exercise_id),
            "superset_group_id": superset_group_id,
            "superset_order": superset_data.orders[i]
        })
    
    db.commit()
    
    # Return response with exercise objects that include superset_order attribute
    return {"superset_group_id": superset_group_id, "exercises": updated_exercises}