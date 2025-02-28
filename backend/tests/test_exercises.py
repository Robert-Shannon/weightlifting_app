import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import os
import io

from src.main import app
from src.core.database.session import get_db, Base
from src.models.user import User
from src.models.exercise import Exercise
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

def test_read_exercises(client, db):
    """Test listing exercises"""
    # Add some test exercises
    exercises = [
        Exercise(
            id=uuid.uuid4(),
            name="Exercise 1",
            target_muscle_group="Chest",
            difficulty_level="Beginner"
        ),
        Exercise(
            id=uuid.uuid4(),
            name="Exercise 2",
            target_muscle_group="Back",
            difficulty_level="Intermediate"
        ),
        Exercise(
            id=uuid.uuid4(),
            name="Exercise 3",
            target_muscle_group="Legs",
            difficulty_level="Advanced"
        )
    ]
    
    for exercise in exercises:
        db.add(exercise)
    db.commit()
    
    response = client.get("/api/v1/exercises/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    
    # Test filtering
    response = client.get("/api/v1/exercises/?target_muscle_group=Chest")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Exercise 1"
    
    # Test pagination
    response = client.get("/api/v1/exercises/?skip=1&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Exercise 2"

def test_create_exercise(client, test_user):
    """Test creating a new exercise"""
    # Create an exercise
    exercise_data = {
        "name": "New Exercise",
        "target_muscle_group": "Shoulders",
        "difficulty_level": "Intermediate",
        "primary_equipment": "Dumbbell"
    }
    
    response = client.post(
        "/api/v1/exercises/",
        json=exercise_data,
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Exercise"
    assert data["target_muscle_group"] == "Shoulders"
    assert "id" in data
    
    # Try to create an exercise with the same name
    response = client.post(
        "/api/v1/exercises/",
        json=exercise_data,
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_read_exercise(client, test_exercise):
    """Test getting an exercise by ID"""
    # Get the exercise
    response = client.get(f"/api/v1/exercises/{test_exercise.id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Exercise"
    assert data["target_muscle_group"] == "Chest"
    
    # Try to get a non-existent exercise
    response = client.get(f"/api/v1/exercises/{uuid.uuid4()}")
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_update_exercise(client, test_exercise, test_user):
    """Test updating an exercise"""
    # Update the exercise
    update_data = {
        "name": "Updated Exercise",
        "difficulty_level": "Advanced"
    }
    
    response = client.put(
        f"/api/v1/exercises/{test_exercise.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Exercise"
    assert data["difficulty_level"] == "Advanced"
    assert data["target_muscle_group"] == "Chest"  # Unchanged field

def test_delete_exercise(client, test_exercise, test_user):
    """Test deleting an exercise"""
    # Delete the exercise
    response = client.delete(
        f"/api/v1/exercises/{test_exercise.id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Try to get the deleted exercise
    response = client.get(f"/api/v1/exercises/{test_exercise.id}")
    assert response.status_code == 404

def test_import_exercises(client, test_user):
    """Test importing exercises from CSV"""
    # Create a CSV file for testing
    csv_content = """name,target_muscle_group,difficulty_level,primary_equipment
Exercise A,Chest,Beginner,Barbell
Exercise B,Back,Intermediate,Dumbbell
Exercise C,Legs,Advanced,Machine
"""
    
    csv_file = io.BytesIO(csv_content.encode())
    csv_file.name = "test_exercises.csv"
    
    # Import the exercises
    response = client.post(
        "/api/v1/exercises/import",
        files={"file": ("test_exercises.csv", csv_file, "text/csv")},
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_imported"] == 3
    assert len(data["errors"]) == 0
    
    # Verify exercises were imported
    response = client.get("/api/v1/exercises/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    
    exercise_names = [exercise["name"] for exercise in data]
    assert "Exercise A" in exercise_names
    assert "Exercise B" in exercise_names
    assert "Exercise C" in exercise_names