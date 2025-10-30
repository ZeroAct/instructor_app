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
        fields: Optional[List[Dict[str, Any]]] = None,
    ):
        self.name = name
        self.field_type = field_type
        self.description = description
        self.required = required
        self.default = default
        self.fields = fields

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

        # Handle object type with nested fields
        if self.field_type.lower() == "object" and self.fields:
            # Create nested model from fields
            nested_schema = {
                "name": f"{self.name.capitalize()}Type",
                "description": self.description,
                "fields": self.fields
            }
            from instructor_app.schemas.dynamic import DynamicSchemaBuilder
            python_type = DynamicSchemaBuilder.create_model_from_dict(nested_schema)
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
        
        # Create field definitions (nested models are created inline)
        for field in fields:
            field_definitions[field.name] = field.to_pydantic_field()

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
                fields=field_data.get("fields"),
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
            nested_fields = None
            
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
                    nested_model_dict = DynamicSchemaBuilder.model_to_dict(actual_type)
                    nested_fields = nested_model_dict["fields"]
                    field_type = "object"
            except (TypeError, AttributeError):
                pass
            
            # Simplify type representation for basic types
            if field_type != "object":
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
            
            if nested_fields:
                field_dict["fields"] = nested_fields
            
            fields.append(field_dict)

        return {
            "name": model.__name__,
            "description": model.__doc__ or "",
            "fields": fields,
        }
