"""Tests for list extraction functionality."""

from typing import List

from instructor_app.schemas.dynamic import DynamicSchemaBuilder


def test_list_extraction_basic():
    """Test extracting a list of objects."""
    schema_dict = {
        "name": "Person",
        "description": "A person's information",
        "fields": [
            {"name": "name", "type": "str", "description": "Person's name", "required": True},
            {"name": "age", "type": "int", "description": "Person's age", "required": True},
        ],
    }

    # Create base model
    base_model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)
    assert base_model.__name__ == "Person"

    # Wrap in List
    list_model = List[base_model]

    # Test instantiation
    people = [
        base_model(name="Alice", age=30),
        base_model(name="Bob", age=25),
        base_model(name="Charlie", age=35),
    ]

    assert len(people) == 3
    assert people[0].name == "Alice"
    assert people[1].age == 25
    assert people[2].name == "Charlie"


def test_list_extraction_with_nested():
    """Test extracting a list with nested schemas."""
    schema_dict = {
        "name": "Company",
        "description": "A company",
        "fields": [
            {"name": "name", "type": "str", "required": True},
            {
                "name": "location",
                "type": "nested",
                "required": True,
                "nested_schema": {
                    "name": "Location",
                    "fields": [
                        {"name": "city", "type": "str", "required": True},
                        {"name": "country", "type": "str", "required": True},
                    ],
                },
            },
        ],
    }

    # Create base model with nested schema
    base_model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)
    assert base_model.__name__ == "Company"

    # Wrap in List
    list_model = List[base_model]

    # Test instantiation
    companies = [
        base_model(name="Acme Corp", location={"city": "New York", "country": "USA"}),
        base_model(name="Tech Inc", location={"city": "London", "country": "UK"}),
    ]

    assert len(companies) == 2
    assert companies[0].name == "Acme Corp"
    assert companies[0].location.city == "New York"
    assert companies[1].location.country == "UK"


def test_list_extraction_optional_fields():
    """Test extracting a list with optional fields."""
    schema_dict = {
        "name": "Product",
        "fields": [
            {"name": "name", "type": "str", "required": True},
            {"name": "price", "type": "float", "required": True},
            {"name": "in_stock", "type": "bool", "required": False},
        ],
    }

    base_model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)
    list_model = List[base_model]

    # Test with and without optional field
    products = [
        base_model(name="Widget", price=9.99, in_stock=True),
        base_model(name="Gadget", price=19.99, in_stock=None),
    ]

    assert len(products) == 2
    assert products[0].in_stock is True
    assert products[1].in_stock is None
