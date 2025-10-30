"""Tests for dynamic schema builder."""


from instructor_app.schemas.dynamic import DynamicSchemaBuilder, SchemaField


def test_schema_field_creation():
    """Test creating a schema field."""
    field = SchemaField(name="test_field", field_type="str", description="A test field")
    assert field.name == "test_field"
    assert field.field_type == "str"
    assert field.description == "A test field"
    assert field.required is True


def test_schema_field_to_pydantic():
    """Test converting schema field to Pydantic field."""
    field = SchemaField(name="age", field_type="int", description="Person's age")
    python_type, field_info = field.to_pydantic_field()
    assert python_type is int


def test_create_model_from_fields():
    """Test creating a Pydantic model from fields."""
    fields = [
        SchemaField(name="name", field_type="str", description="User name"),
        SchemaField(name="age", field_type="int", description="User age"),
    ]

    model = DynamicSchemaBuilder.create_model_from_fields("User", fields, "A user model")

    assert model.__name__ == "User"
    assert "name" in model.model_fields
    assert "age" in model.model_fields

    # Test instantiation
    instance = model(name="John", age=30)
    assert instance.name == "John"
    assert instance.age == 30


def test_create_model_from_dict():
    """Test creating a Pydantic model from dictionary."""
    schema_dict = {
        "name": "Product",
        "description": "A product model",
        "fields": [
            {"name": "title", "type": "str", "description": "Product title", "required": True},
            {"name": "price", "type": "float", "description": "Product price", "required": True},
            {"name": "in_stock", "type": "bool", "description": "Is in stock", "required": False},
        ],
    }

    model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)

    assert model.__name__ == "Product"
    assert len(model.model_fields) == 3

    # Test instantiation
    instance = model(title="Laptop", price=999.99, in_stock=True)
    assert instance.title == "Laptop"
    assert instance.price == 999.99
    assert instance.in_stock is True


def test_model_to_dict():
    """Test converting a Pydantic model to dictionary."""
    fields = [
        SchemaField(name="email", field_type="str", description="User email"),
        SchemaField(name="active", field_type="bool", description="Is active"),
    ]

    model = DynamicSchemaBuilder.create_model_from_fields("Account", fields)
    result = DynamicSchemaBuilder.model_to_dict(model)

    assert result["name"] == "Account"
    assert len(result["fields"]) == 2
    assert result["fields"][0]["name"] == "email"
    assert result["fields"][1]["name"] == "active"


def test_optional_field():
    """Test creating optional fields."""
    field = SchemaField(name="nickname", field_type="str", required=False, default="Anonymous")

    python_type, field_info = field.to_pydantic_field()
    assert field_info.default == "Anonymous"
