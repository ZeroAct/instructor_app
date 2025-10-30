"""Export utilities for results."""

import json
from typing import Any, Dict

from pydantic import BaseModel


class ExportFormatter:
    """Formatter for exporting results in different formats."""

    @staticmethod
    def to_json(data: BaseModel | Dict[str, Any] | list[Any], pretty: bool = True) -> str:
        """Export data to JSON format."""
        if isinstance(data, BaseModel):
            return data.model_dump_json(indent=2 if pretty else None)
        return json.dumps(data, indent=2 if pretty else None)

    @staticmethod
    def to_markdown(data: BaseModel | Dict[str, Any] | list[Any], title: str = "Result") -> str:
        """Export data to Markdown format."""
        if isinstance(data, BaseModel):
            data_dict = data.model_dump()
        elif isinstance(data, list):
            data_dict = {"items": data}
        else:
            data_dict = data

        md_lines = [f"# {title}\n"]

        def format_value(value: Any, indent: int = 0) -> list[str]:
            """Recursively format values to markdown."""
            lines = []
            prefix = "  " * indent

            if isinstance(value, dict):
                for k, v in value.items():
                    if isinstance(v, (dict, list)):
                        lines.append(f"{prefix}- **{k}**:")
                        lines.extend(format_value(v, indent + 1))
                    else:
                        lines.append(f"{prefix}- **{k}**: {v}")
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, (dict, list)):
                        lines.extend(format_value(item, indent))
                    else:
                        lines.append(f"{prefix}- {item}")
            else:
                lines.append(f"{prefix}{value}")

            return lines

        md_lines.extend(format_value(data_dict))
        return "\n".join(md_lines)
