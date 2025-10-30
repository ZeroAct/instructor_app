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
    ):
        self.name = name
        self.field_type = field_type
        self.description = description
        self.required = required
        self.default = default

    def to_pydantic_field(self) -> tuple:
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
            # Simplify type representation
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

            fields.append(
                {
                    "name": field_name,
                    "type": field_type,
                    "description": field_info.description or "",
                    "required": field_info.is_required(),
                    "default": field_info.default if field_info.default is not None else None,
                }
            )

        return {
            "name": model.__name__,
            "description": model.__doc__ or "",
            "fields": fields,
        }
