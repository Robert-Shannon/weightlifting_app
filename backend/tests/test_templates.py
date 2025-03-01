import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import os
from datetime import datetime

from src.main import app
from src.core.database.session import get_db, Base
from src.models.user import User
from src.models.exercise import Exercise
from src.models.workout import (
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
def test_template(db, test_user):
    """Create a test workout template"""
    template_id = uuid.uuid4()
    template = WorkoutTemplate(
        id=template_id,
        name="Test Template",
        description="A test workout template",
        user_id=test_user["user"].id
    )
    db.add(template)
    db.commit()
    
    return template

@pytest.fixture
def test_template_exercise(db, test_template, test_exercise):
    """Create a test exercise in a workout template"""
    template_exercise_id = uuid.uuid4()
    template_exercise = WorkoutTemplateExercise(
        id=template_exercise_id,
        workout_template_id=test_template.id,
        exercise_id=test_exercise.id,
        order=1
    )
    db.add(template_exercise)
    db.commit()
    
    return template_exercise

def test_read_templates(client, db, test_user, test_template):
    """Test listing workout templates"""
    # Create a second template for testing
    second_template = WorkoutTemplate(
        id=uuid.uuid4(),
        name="Second Template",
        description="Another test workout template",
        user_id=test_user["user"].id
    )
    db.add(second_template)
    db.commit()
    
    # List all templates
    response = client.get(
        "/api/v1/templates/",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # Check template content
    assert data[0]["name"] in ["Test Template", "Second Template"]
    assert "exercise_count" in data[0]

def test_create_template(client, test_user):
    """Test creating a new workout template"""
    response = client.post(
        "/api/v1/templates/",
        json={
            "name": "New Template",
            "description": "A newly created template"
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Template"
    assert data["description"] == "A newly created template"
    assert "id" in data
    assert "exercises" in data
    assert len(data["exercises"]) == 0

def test_get_template(client, test_user, test_template, test_template_exercise):
    """Test getting a workout template by ID"""
    # Add a set to the template exercise
    template_set = WorkoutTemplateSet(
        id=uuid.uuid4(),
        workout_template_exercise_id=test_template_exercise.id,
        set_number=1,
        target_reps=10,
        target_weight=100.0,
        is_warmup=False
    )
    db = TestingSessionLocal()
    db.add(template_set)
    db.commit()
    
    # Get the template
    response = client.get(
        f"/api/v1/templates/{test_template.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_template.id)
    assert data["name"] == "Test Template"
    assert len(data["exercises"]) == 1
    assert len(data["exercises"][0]["sets"]) == 1

def test_update_template(client, test_user, test_template):
    """Test updating a workout template"""
    response = client.put(
        f"/api/v1/templates/{test_template.id}",
        json={
            "name": "Updated Template",
            "description": "Updated description"
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Template"
    assert data["description"] == "Updated description"

def test_delete_template(client, test_user, test_template):
    """Test deleting a workout template"""
    response = client.delete(
        f"/api/v1/templates/{test_template.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Verify the template is deleted by trying to get it
    response = client.get(
        f"/api/v1/templates/{test_template.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 404

def test_add_exercise_to_template(client, test_user, test_template, test_exercise):
    """Test adding an exercise to a template"""
    response = client.post(
        f"/api/v1/templates/{test_template.id}/exercises",
        json={
            "exercise_id": str(test_exercise.id),
            "order": 1,
            "notes": "Test notes"
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["exercise_id"] == str(test_exercise.id)
    assert data["order"] == 1
    assert data["notes"] == "Test notes"
    
    # Get the template to check the exercise was added
    response = client.get(
        f"/api/v1/templates/{test_template.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    assert len(response.json()["exercises"]) == 1

def test_update_exercise_in_template(client, test_user, test_template, test_template_exercise):
    """Test updating an exercise in a template"""
    response = client.put(
        f"/api/v1/templates/{test_template.id}/exercises/{test_template_exercise.id}",
        json={
            "order": 2,
            "notes": "Updated notes"
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["order"] == 2
    assert data["notes"] == "Updated notes"

def test_delete_exercise_from_template(client, test_user, test_template, test_template_exercise):
    """Test removing an exercise from a template"""
    response = client.delete(
        f"/api/v1/templates/{test_template.id}/exercises/{test_template_exercise.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Get the template to check the exercise was removed
    response = client.get(
        f"/api/v1/templates/{test_template.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    assert len(response.json()["exercises"]) == 0

def test_add_set_to_template_exercise(client, test_user, test_template, test_template_exercise):
    """Test adding a set to an exercise in a template"""
    response = client.post(
        f"/api/v1/templates/{test_template.id}/exercises/{test_template_exercise.id}/sets",
        json={
            "set_number": 1,
            "target_reps": 10,
            "target_weight": 100.0,
            "is_warmup": False,
            "target_rest_time": 60
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["set_number"] == 1
    assert data["target_reps"] == 10
    assert data["target_weight"] == 100.0
    assert data["is_warmup"] is False
    assert data["target_rest_time"] == 60

def test_update_set_in_template(client, db, test_user, test_template, test_template_exercise):
    """Test updating a set in a template"""
    # Add a set to update
    set_id = uuid.uuid4()
    template_set = WorkoutTemplateSet(
        id=set_id,
        workout_template_exercise_id=test_template_exercise.id,
        set_number=1,
        target_reps=10,
        target_weight=100.0,
        is_warmup=False
    )
    db.add(template_set)
    db.commit()
    
    response = client.put(
        f"/api/v1/templates/{test_template.id}/exercises/{test_template_exercise.id}/sets/{set_id}",
        json={
            "target_reps": 12,
            "target_weight": 110.0,
            "is_warmup": True
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["target_reps"] == 12
    assert data["target_weight"] == 110.0
    assert data["is_warmup"] is True

def test_delete_set_from_template(client, db, test_user, test_template, test_template_exercise):
    """Test removing a set from a template"""
    # Add a set to delete
    set_id = uuid.uuid4()
    template_set = WorkoutTemplateSet(
        id=set_id,
        workout_template_exercise_id=test_template_exercise.id,
        set_number=1,
        target_reps=10,
        target_weight=100.0,
        is_warmup=False
    )
    db.add(template_set)
    db.commit()
    
    response = client.delete(
        f"/api/v1/templates/{test_template.id}/exercises/{test_template_exercise.id}/sets/{set_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

def test_create_superset(client, db, test_user, test_template, test_exercise):
    """Test creating a superset in a template"""
    # Create two exercises for the superset
    exercise1 = db.query(WorkoutTemplateExercise).filter(
        WorkoutTemplateExercise.workout_template_id == test_template.id
    ).first()
    
    if not exercise1:
        # Add first exercise
        exercise1_id = uuid.uuid4()
        exercise1 = WorkoutTemplateExercise(
            id=exercise1_id,
            workout_template_id=test_template.id,
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
    
    template_exercise2_id = uuid.uuid4()
    template_exercise2 = WorkoutTemplateExercise(
        id=template_exercise2_id,
        workout_template_id=test_template.id,
        exercise_id=exercise2_id,
        order=2
    )
    db.add(template_exercise2)
    db.commit()
    
    # Create a superset
    response = client.post(
        f"/api/v1/templates/{test_template.id}/supersets",
        json={
            "exercise_ids": [str(exercise1.id), str(template_exercise2_id)],
            "orders": [1, 2]
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "superset_group_id" in data
    assert len(data["exercises"]) == 2

def test_another_user_access(client, db, test_user, test_template):
    """Test that another user cannot access templates they don't own"""
    # Create another user
    another_user_id = uuid.uuid4()
    another_user = User(
        id=another_user_id,
        name="Another User",
        email="another@example.com",
        password_hash=get_password_hash("password456")
    )
    db.add(another_user)
    db.commit()
    
    another_token = create_access_token(str(another_user_id))
    
    # Try to access the first user's template
    response = client.get(
        f"/api/v1/templates/{test_template.id}",
        headers={"Authorization": f"Bearer {another_token}"}
    )
    
    assert response.status_code == 404
    
    # Try to update the first user's template
    response = client.put(
        f"/api/v1/templates/{test_template.id}",
        json={"name": "Hacked Template"},
        headers={"Authorization": f"Bearer {another_token}"}
    )
    
    assert response.status_code == 404
    
    # Make sure the original user can still access it
    response = client.get(
        f"/api/v1/templates/{test_template.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    assert response.json()["name"] == "Test Template"

def test_invalid_ids(client, test_user, test_template):
    """Test behavior with invalid IDs"""
    # Invalid template ID
    random_id = uuid.uuid4()
    response = client.get(
        f"/api/v1/templates/{random_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    assert response.status_code == 404
    
    # Invalid exercise ID in template
    random_id = uuid.uuid4()
    response = client.put(
        f"/api/v1/templates/{test_template.id}/exercises/{random_id}",
        json={"order": 1},
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    assert response.status_code == 404
    
    # Invalid set ID in exercise
    random_id = uuid.uuid4()
    random_exercise_id = uuid.uuid4()
    response = client.put(
        f"/api/v1/templates/{test_template.id}/exercises/{random_exercise_id}/sets/{random_id}",
        json={"target_reps": 10},
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    assert response.status_code == 404