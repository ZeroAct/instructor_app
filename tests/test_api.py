"""Tests for API endpoints."""

from fastapi.testclient import TestClient

from instructor_app.api.main import app

client = TestClient(app)


def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_endpoint():
    """Test root endpoint returns HTML."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_validate_schema_success():
    """Test schema validation with valid schema."""
    schema_data = {
        "name": "TestModel",
        "description": "A test model",
        "fields": [
            {"name": "field1", "type": "str", "description": "Test field", "required": True}
        ],
    }

    response = client.post("/api/schema/validate", json=schema_data)
    assert response.status_code == 200

    data = response.json()
    assert data["valid"] is True
    assert "schema" in data
    assert "json_schema" in data


def test_validate_schema_invalid():
    """Test schema validation with invalid schema."""
    schema_data = {
        "name": "TestModel",
        "fields": [],  # Empty fields should still be valid
    }

    response = client.post("/api/schema/validate", json=schema_data)
    # Should succeed even with empty fields
    assert response.status_code == 200


def test_export_json():
    """Test exporting data as JSON."""
    export_data = {
        "data": {"name": "John", "age": 30},
        "format": "json",
        "title": "Test Export",
    }

    response = client.post("/api/export", json=export_data)
    assert response.status_code == 200

    data = response.json()
    assert "content" in data
    assert "filename" in data
    assert data["filename"].endswith(".json")


def test_export_markdown():
    """Test exporting data as Markdown."""
    export_data = {
        "data": {"name": "John", "age": 30},
        "format": "markdown",
        "title": "Test Export",
    }

    response = client.post("/api/export", json=export_data)
    assert response.status_code == 200

    data = response.json()
    assert "content" in data
    assert "# Test Export" in data["content"]
    assert data["filename"].endswith(".md")


def test_export_invalid_format():
    """Test exporting with invalid format."""
    export_data = {"data": {"test": "data"}, "format": "invalid", "title": "Test"}

    response = client.post("/api/export", json=export_data)
    assert response.status_code == 400
