"""Tests for export utilities."""

import json

from pydantic import BaseModel

from instructor_app.utils.export import ExportFormatter


class SampleModel(BaseModel):
    """Sample model for testing."""

    name: str
    age: int
    email: str


def test_export_to_json_from_model():
    """Test exporting Pydantic model to JSON."""
    model = SampleModel(name="John Doe", age=30, email="john@example.com")
    result = ExportFormatter.to_json(model)

    assert isinstance(result, str)
    data = json.loads(result)
    assert data["name"] == "John Doe"
    assert data["age"] == 30


def test_export_to_json_from_dict():
    """Test exporting dictionary to JSON."""
    data = {"name": "Jane", "score": 95.5}
    result = ExportFormatter.to_json(data)

    assert isinstance(result, str)
    parsed = json.loads(result)
    assert parsed["name"] == "Jane"
    assert parsed["score"] == 95.5


def test_export_to_json_not_pretty():
    """Test compact JSON export."""
    data = {"key": "value"}
    result = ExportFormatter.to_json(data, pretty=False)

    assert "\n" not in result
    assert "  " not in result


def test_export_to_markdown_from_model():
    """Test exporting Pydantic model to Markdown."""
    model = SampleModel(name="John Doe", age=30, email="john@example.com")
    result = ExportFormatter.to_markdown(model, title="User Profile")

    assert "# User Profile" in result
    assert "**name**: John Doe" in result
    assert "**age**: 30" in result
    assert "**email**: john@example.com" in result


def test_export_to_markdown_from_dict():
    """Test exporting dictionary to Markdown."""
    data = {"title": "Test Article", "author": "Jane Doe", "views": 1000}
    result = ExportFormatter.to_markdown(data, title="Article Info")

    assert "# Article Info" in result
    assert "**title**: Test Article" in result
    assert "**author**: Jane Doe" in result


def test_export_nested_dict_to_markdown():
    """Test exporting nested dictionary to Markdown."""
    data = {"user": {"name": "John", "age": 30}, "active": True}
    result = ExportFormatter.to_markdown(data)

    assert "# Result" in result
    assert "**user**:" in result
    assert "**name**: John" in result
    assert "**age**: 30" in result


def test_export_list_to_markdown():
    """Test exporting list data to Markdown."""
    data = {"tags": ["python", "testing", "api"], "count": 3}
    result = ExportFormatter.to_markdown(data)

    assert "**tags**:" in result
    assert "- python" in result
    assert "- testing" in result
    assert "- api" in result
