"""Tests for nested schema functionality."""

from instructor_app.schemas.dynamic import DynamicSchemaBuilder, SchemaField


def test_nested_schema_creation():
    """Test creating a nested schema."""
    schema_dict = {
        "name": "UserProfile",
        "description": "A user profile",
        "fields": [
            {"name": "name", "type": "str", "description": "User name", "required": True},
            {
                "name": "address",
                "type": "nested",
                "description": "User address",
                "required": True,
                "nested_schema": {
                    "name": "Address",
                    "description": "Address information",
                    "fields": [
                        {
                            "name": "street",
                            "type": "str",
                            "description": "Street address",
                            "required": True,
                        },
                        {
                            "name": "city",
                            "type": "str",
                            "description": "City",
                            "required": True,
                        },
                        {
                            "name": "zip_code",
                            "type": "int",
                            "description": "Zip code",
                            "required": False,
                        },
                    ],
                },
            },
        ],
    }

    model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)

    assert model.__name__ == "UserProfile"
    assert "name" in model.model_fields
    assert "address" in model.model_fields

    # Test instantiation
    instance = model(
        name="John Doe",
        address={"street": "123 Main St", "city": "San Francisco", "zip_code": 94102},
    )
    assert instance.name == "John Doe"
    assert instance.address.street == "123 Main St"
    assert instance.address.city == "San Francisco"
    assert instance.address.zip_code == 94102


def test_nested_schema_optional():
    """Test creating an optional nested schema."""
    schema_dict = {
        "name": "Person",
        "fields": [
            {"name": "name", "type": "str", "required": True},
            {
                "name": "contact",
                "type": "nested",
                "required": False,
                "nested_schema": {
                    "name": "Contact",
                    "fields": [
                        {"name": "email", "type": "str", "required": True},
                        {"name": "phone", "type": "str", "required": False},
                    ],
                },
            },
        ],
    }

    model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)

    # Test with nested data
    instance1 = model(name="Alice", contact={"email": "alice@example.com"})
    assert instance1.name == "Alice"
    assert instance1.contact.email == "alice@example.com"

    # Test without nested data
    instance2 = model(name="Bob", contact=None)
    assert instance2.name == "Bob"
    assert instance2.contact is None


def test_model_to_dict_with_nested():
    """Test converting a model with nested schema back to dict."""
    schema_dict = {
        "name": "Company",
        "fields": [
            {"name": "company_name", "type": "str", "required": True},
            {
                "name": "headquarters",
                "type": "nested",
                "required": True,
                "nested_schema": {
                    "name": "Location",
                    "fields": [
                        {"name": "country", "type": "str", "required": True},
                        {"name": "city", "type": "str", "required": True},
                    ],
                },
            },
        ],
    }

    model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)
    result = DynamicSchemaBuilder.model_to_dict(model)

    assert result["name"] == "Company"
    assert len(result["fields"]) == 2
    assert result["fields"][1]["type"] == "nested"
    assert "nested_schema" in result["fields"][1]
    assert result["fields"][1]["nested_schema"]["name"] == "Location"
    assert len(result["fields"][1]["nested_schema"]["fields"]) == 2
