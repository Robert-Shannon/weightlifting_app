import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import os
from datetime import datetime, timedelta

from src.main import app
from src.core.database.session import get_db, Base
from src.models.user import User
from src.models.exercise import Exercise
from src.models.workout import (
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet,
    WorkoutTemplate,
    WorkoutTemplateExercise,
    WorkoutTemplateSet
)
from src.utils.auth import get_password_hash, create_access_token

# Setup test database with PostgreSQL (same as test_auth.py)
TEST_POSTGRES_URL = os.getenv(
    "TEST_DATABASE_URL", 
    "postgresql://robertshannon:postgres@localhost:5432/test_weightlifting_app"
)

engine = create_engine(TEST_POSTGRES_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Create the test database tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Create a new session for the test
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def client(db):
    # Override the get_db dependency to use our test database
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db):
    """Create a test user and get an auth token"""
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        name="Test User",
        email="test@example.com",
        password_hash=get_password_hash("password123")
    )
    db.add(user)
    db.commit()
    
    token = create_access_token(str(user_id))
    return {"user": user, "token": token}

@pytest.fixture
def test_exercise(db):
    """Create a test exercise"""
    exercise_id = uuid.uuid4()
    exercise = Exercise(
        id=exercise_id,
        name="Test Exercise",
        target_muscle_group="Chest",
        difficulty_level="Intermediate",
        primary_equipment="Barbell"
    )
    db.add(exercise)
    db.commit()
    
    return exercise

@pytest.fixture
def test_template(db, test_user, test_exercise):
    """Create a test workout template with exercises and sets"""
    # Create template
    template_id = uuid.uuid4()
    template = WorkoutTemplate(
        id=template_id,
        name="Test Template",
        description="A test workout template",
        user_id=test_user["user"].id
    )
    db.add(template)
    db.flush()
    
    # Add exercise to template
    template_exercise_id = uuid.uuid4()
    template_exercise = WorkoutTemplateExercise(
        id=template_exercise_id,
        workout_template_id=template_id,
        exercise_id=test_exercise.id,
        order=1
    )
    db.add(template_exercise)
    db.flush()
    
    # Add sets to template exercise
    for i in range(1, 4):
        template_set = WorkoutTemplateSet(
            id=uuid.uuid4(),
            workout_template_exercise_id=template_exercise_id,
            set_number=i,
            target_reps=10,
            target_weight=100.0,
            is_warmup=i == 1  # First set is warmup
        )
        db.add(template_set)
    
    db.commit()
    return template

@pytest.fixture
def test_session(db, test_user):
    """Create a test workout session"""
    session_id = uuid.uuid4()
    session = WorkoutSession(
        id=session_id,
        user_id=test_user["user"].id,
        name="Test Workout Session",
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    
    return session

@pytest.fixture
def test_session_exercise(db, test_session, test_exercise):
    """Create a test exercise in a workout session"""
    session_exercise_id = uuid.uuid4()
    session_exercise = WorkoutSessionExercise(
        id=session_exercise_id,
        workout_session_id=test_session.id,
        exercise_id=test_exercise.id,
        order=1
    )
    db.add(session_exercise)
    db.commit()
    
    return session_exercise

def test_read_sessions(client, db, test_user):
    """Test listing workout sessions"""
    # Create sessions with specific dates for more reliable testing
    today = datetime.utcnow()
    yesterday = today - timedelta(days=1)
    
    # Today's session
    today_session = WorkoutSession(
        id=uuid.uuid4(),
        user_id=test_user["user"].id,
        name="Today Session",
        started_at=today
    )
    db.add(today_session)
    
    # Yesterday's session
    yesterday_session = WorkoutSession(
        id=uuid.uuid4(),
        user_id=test_user["user"].id,
        name="Yesterday Session",
        started_at=yesterday
    )
    db.add(yesterday_session)
    db.commit()
    
    # List all sessions
    response = client.get(
        "/api/v1/sessions/",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # Test filtering by today's date
    today_date = today.date().isoformat()
    response = client.get(
        f"/api/v1/sessions/?start_date={today_date}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1  # Only today's session
    assert data[0]["name"] == "Today Session"
    
    # Test filtering by yesterday's date
    yesterday_date = yesterday.date().isoformat()
    response = client.get(
        f"/api/v1/sessions/?start_date={yesterday_date}&end_date={yesterday_date}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1  # Only yesterday's session
    assert data[0]["name"] == "Yesterday Session"

def test_create_session(client, test_user, test_template):
    """Test creating a new workout session"""
    # Create a session without template
    response = client.post(
        "/api/v1/sessions/",
        json={
            "name": "New Workout Session",
            "notes": "Testing session creation"
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Workout Session"
    assert data["notes"] == "Testing session creation"
    assert "started_at" in data
    assert data["exercises"] == []
    
    # Create a session with template
    response = client.post(
        "/api/v1/sessions/",
        json={
            "name": "Template Workout Session",
            "template_ids": [str(test_template.id)]
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Template Workout Session"
    assert len(data["exercises"]) == 1
    assert len(data["exercises"][0]["sets"]) == 3

def test_get_session(client, test_user, test_session, test_session_exercise):
    """Test getting a workout session by ID"""
    # Add a set to the session exercise
    workout_set = WorkoutSet(
        id=uuid.uuid4(),
        workout_session_exercise_id=test_session_exercise.id,
        set_number=1,
        reps_completed=10,
        weight=100.0
    )
    db = TestingSessionLocal()
    db.add(workout_set)
    db.commit()
    
    # Get the session
    response = client.get(
        f"/api/v1/sessions/{test_session.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_session.id)
    assert data["name"] == "Test Workout Session"
    assert len(data["exercises"]) == 1
    assert len(data["exercises"][0]["sets"]) == 1

def test_update_session(client, test_user, test_session):
    """Test updating a workout session"""
    # Update the session
    response = client.put(
        f"/api/v1/sessions/{test_session.id}",
        json={
            "name": "Updated Workout Session",
            "notes": "Updated notes"
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Workout Session"
    assert data["notes"] == "Updated notes"

def test_complete_session(client, test_user, test_session):
    """Test completing a workout session"""
    # Complete the session
    response = client.post(
        f"/api/v1/sessions/{test_session.id}/complete",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["completed_at"] is not None
    
    # Try to update completed session
    response = client.put(
        f"/api/v1/sessions/{test_session.id}",
        json={"name": "This should fail"},
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 400
    assert "completed" in response.json()["detail"]

def test_add_exercise_to_session(client, test_user, test_session, test_exercise):
    """Test adding an exercise to a session"""
    # Add an exercise
    response = client.post(
        f"/api/v1/sessions/{test_session.id}/exercises",
        json={
            "exercise_id": str(test_exercise.id),
            "order": 1,
            "notes": "Test exercise notes"
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["exercise_id"] == str(test_exercise.id)
    assert data["order"] == 1
    assert data["notes"] == "Test exercise notes"
    
    # Get the session to check the exercise was added
    response = client.get(
        f"/api/v1/sessions/{test_session.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    assert len(response.json()["exercises"]) == 1

def test_start_and_complete_exercise(client, test_user, test_session, test_session_exercise):
    """Test starting and completing an exercise"""
    # Start the exercise
    response = client.post(
        f"/api/v1/sessions/{test_session.id}/exercises/{test_session_exercise.id}/start",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["started_at"] is not None
    
    # Complete the exercise
    response = client.post(
        f"/api/v1/sessions/{test_session.id}/exercises/{test_session_exercise.id}/complete",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["completed_at"] is not None
    assert data["active_duration"] is not None

def test_log_and_update_set(client, test_user, test_session, test_session_exercise):
    """Test logging and updating a set"""
    # Log a set
    response = client.post(
        f"/api/v1/sessions/{test_session.id}/exercises/{test_session_exercise.id}/sets",
        json={
            "set_number": 1,
            "reps_completed": 10,
            "weight": 100.0,
            "is_warmup": False
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["set_number"] == 1
    assert data["reps_completed"] == 10
    assert data["weight"] == 100.0
    
    set_id = data["id"]
    
    # Update the set
    response = client.put(
        f"/api/v1/sessions/{test_session.id}/exercises/{test_session_exercise.id}/sets/{set_id}",
        json={
            "reps_completed": 12,
            "weight": 110.0,
            "rpe": 8
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["reps_completed"] == 12
    assert data["weight"] == 110.0
    assert data["rpe"] == 8

def test_rest_timer(client, test_user, test_session, test_session_exercise):
    """Test rest timer functionality"""
    # First, log a set
    set_response = client.post(
        f"/api/v1/sessions/{test_session.id}/exercises/{test_session_exercise.id}/sets",
        json={
            "set_number": 1,
            "reps_completed": 10,
            "weight": 100.0
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    set_id = set_response.json()["id"]
    
    # Start rest timer
    response = client.post(
        f"/api/v1/sessions/{test_session.id}/exercises/{test_session_exercise.id}/sets/{set_id}/rest",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["rest_start_time"] is not None
    
    # End rest timer
    response = client.put(
        f"/api/v1/sessions/{test_session.id}/exercises/{test_session_exercise.id}/sets/{set_id}/rest",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["rest_end_time"] is not None
    assert data["actual_rest_time"] is not None
    assert data["actual_rest_time"] >= 0

def test_create_superset(client, db, test_user, test_session, test_exercise):
    """Test creating a superset"""
    # Create two exercises for the superset
    exercise1 = db.query(WorkoutSessionExercise).filter(
        WorkoutSessionExercise.workout_session_id == test_session.id
    ).first()
    
    if not exercise1:
        # Add first exercise
        exercise1_id = uuid.uuid4()
        exercise1 = WorkoutSessionExercise(
            id=exercise1_id,
            workout_session_id=test_session.id,
            exercise_id=test_exercise.id,
            order=1
        )
        db.add(exercise1)
        db.flush()
    
    # Add a second exercise
    exercise2_id = uuid.uuid4()
    exercise2 = Exercise(
        id=exercise2_id,
        name="Second Exercise",
        target_muscle_group="Back"
    )
    db.add(exercise2)
    db.flush()
    
    session_exercise2_id = uuid.uuid4()
    session_exercise2 = WorkoutSessionExercise(
        id=session_exercise2_id,
        workout_session_id=test_session.id,
        exercise_id=exercise2_id,
        order=2
    )
    db.add(session_exercise2)
    db.commit()
    
    # Create a superset
    response = client.post(
        f"/api/v1/sessions/{test_session.id}/supersets",
        json={
            "exercise_ids": [str(exercise1.id), str(session_exercise2_id)],
            "orders": [1, 2]
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "superset_group_id" in data
    assert len(data["exercises"]) == 2
    assert data["exercises"][0]["superset_order"] == 1
    assert data["exercises"][1]["superset_order"] == 2
    
    # Both exercises should have the same superset_group_id
    assert data["exercises"][0]["superset_group_id"] == data["exercises"][1]["superset_group_id"]