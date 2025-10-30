"""Dynamic schema builder for Pydantic models."""

from typing import Any, Dict, List, Optional, Type

from pydantic import BaseModel, Field, create_model


class SchemaField:
    """Represents a field in a dynamic schema."""

    def __init__(
        self,
        name: str,
        field_type: str,
        description: str = "",
        required: bool = True,
        default: Any = None,
        nested_schema: Optional[Dict[str, Any]] = None,
    ):
        self.name = name
        self.field_type = field_type
        self.description = description
        self.required = required
        self.default = default
        self.nested_schema = nested_schema

    def to_pydantic_field(self, nested_models: Optional[Dict[str, Type[BaseModel]]] = None) -> tuple:
        """Convert to Pydantic field format."""
        type_mapping = {
            "str": str,
            "string": str,
            "int": int,
            "integer": int,
            "float": float,
            "bool": bool,
            "boolean": bool,
            "list": List[str],
            "dict": Dict[str, Any],
        }

        # Handle nested schema type
        if self.field_type.lower() == "nested" and self.nested_schema:
            # Get or create the nested model
            if nested_models and self.nested_schema.get("name") in nested_models:
                python_type = nested_models[self.nested_schema["name"]]
            else:
                # Create nested model on the fly
                from instructor_app.schemas.dynamic import DynamicSchemaBuilder
                python_type = DynamicSchemaBuilder.create_model_from_dict(self.nested_schema)
        else:
            python_type = type_mapping.get(self.field_type.lower(), str)

        if not self.required:
            python_type = Optional[python_type]

        field_kwargs = {"description": self.description}
        if self.default is not None:
            field_kwargs["default"] = self.default
        elif not self.required:
            field_kwargs["default"] = None

        return (python_type, Field(**field_kwargs))


class DynamicSchemaBuilder:
    """Builder for creating dynamic Pydantic models."""

    @staticmethod
    def create_model_from_fields(
        model_name: str, fields: List[SchemaField], model_description: str = ""
    ) -> Type[BaseModel]:
        """Create a Pydantic model from a list of fields."""
        field_definitions = {}
        nested_models = {}
        
        # First pass: create all nested models
        for field in fields:
            if field.field_type.lower() == "nested" and field.nested_schema:
                nested_model = DynamicSchemaBuilder.create_model_from_dict(field.nested_schema)
                nested_models[field.nested_schema["name"]] = nested_model
        
        # Second pass: create field definitions
        for field in fields:
            field_definitions[field.name] = field.to_pydantic_field(nested_models)

        model = create_model(model_name, **field_definitions)
        if model_description:
            model.__doc__ = model_description

        return model

    @staticmethod
    def create_model_from_dict(schema_dict: Dict[str, Any]) -> Type[BaseModel]:
        """Create a Pydantic model from a dictionary definition."""
        model_name = schema_dict.get("name", "DynamicModel")
        model_description = schema_dict.get("description", "")
        fields_data = schema_dict.get("fields", [])

        fields = []
        for field_data in fields_data:
            field = SchemaField(
                name=field_data["name"],
                field_type=field_data.get("type", "str"),
                description=field_data.get("description", ""),
                required=field_data.get("required", True),
                default=field_data.get("default"),
                nested_schema=field_data.get("nested_schema"),
            )
            fields.append(field)

        return DynamicSchemaBuilder.create_model_from_fields(
            model_name, fields, model_description
        )

    @staticmethod
    def model_to_dict(model: Type[BaseModel]) -> Dict[str, Any]:
        """Convert a Pydantic model to a dictionary representation."""
        fields = []

        for field_name, field_info in model.model_fields.items():
            field_type = str(field_info.annotation)
            nested_schema = None
            
            # Check if it's a nested BaseModel
            try:
                # Get the actual type (handling Optional)
                actual_type = field_info.annotation
                if hasattr(actual_type, "__origin__"):  # Optional or Union
                    args = getattr(actual_type, "__args__", ())
                    for arg in args:
                        if isinstance(arg, type) and issubclass(arg, BaseModel):
                            actual_type = arg
                            break
                
                if isinstance(actual_type, type) and issubclass(actual_type, BaseModel):
                    # It's a nested model - recursively convert it
                    nested_schema = DynamicSchemaBuilder.model_to_dict(actual_type)
                    field_type = "nested"
            except (TypeError, AttributeError):
                pass
            
            # Simplify type representation for basic types
            if field_type != "nested":
                if "str" in field_type:
                    field_type = "str"
                elif "int" in field_type:
                    field_type = "int"
                elif "float" in field_type:
                    field_type = "float"
                elif "bool" in field_type:
                    field_type = "bool"
                elif "list" in field_type.lower():
                    field_type = "list"
                elif "dict" in field_type.lower():
                    field_type = "dict"

            field_dict = {
                "name": field_name,
                "type": field_type,
                "description": field_info.description or "",
                "required": field_info.is_required(),
                "default": field_info.default if field_info.default is not None else None,
            }
            
            if nested_schema:
                field_dict["nested_schema"] = nested_schema
            
            fields.append(field_dict)

        return {
            "name": model.__name__,
            "description": model.__doc__ or "",
            "fields": fields,
        }
