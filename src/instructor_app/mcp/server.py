"""MCP (Model Context Protocol) server for Instructor App."""

import asyncio
import json
from typing import Any, Dict, List

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

from instructor_app.schemas.dynamic import DynamicSchemaBuilder
from instructor_app.utils.export import ExportFormatter
from instructor_app.utils.instructor_client import InstructorClient


class InstructorMCPServer:
    """MCP server for Instructor functionality."""

    def __init__(self):
        self.server = Server("instructor-app")
        self.setup_handlers()

    def setup_handlers(self):
        """Setup MCP handlers."""

        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            """List available tools."""
            return [
                Tool(
                    name="create_schema",
                    description="Create a dynamic Pydantic schema from a JSON definition",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Schema name"},
                            "description": {"type": "string", "description": "Schema description"},
                            "fields": {
                                "type": "array",
                                "description": "List of fields",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "name": {"type": "string"},
                                        "type": {"type": "string"},
                                        "description": {"type": "string"},
                                        "required": {"type": "boolean"},
                                    },
                                    "required": ["name", "type"],
                                },
                            },
                        },
                        "required": ["name", "fields"],
                    },
                ),
                Tool(
                    name="run_completion",
                    description="Run a completion with a dynamic schema and get structured output",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "schema": {
                                "type": "object",
                                "description": "Schema definition",
                                "properties": {
                                    "name": {"type": "string"},
                                    "fields": {"type": "array"},
                                },
                            },
                            "prompt": {"type": "string", "description": "Prompt for the LLM"},
                            "provider": {
                                "type": "string",
                                "description": "LLM provider (openai)",
                                "enum": ["openai"],
                            },
                            "model": {"type": "string", "description": "Model name (optional)"},
                        },
                        "required": ["schema", "prompt"],
                    },
                ),
                Tool(
                    name="export_result",
                    description="Export result to JSON or Markdown format",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "data": {"type": "object", "description": "Data to export"},
                            "format": {
                                "type": "string",
                                "description": "Export format",
                                "enum": ["json", "markdown"],
                            },
                            "title": {"type": "string", "description": "Title for markdown export"},
                        },
                        "required": ["data", "format"],
                    },
                ),
            ]

        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
            """Handle tool calls."""
            try:
                if name == "create_schema":
                    model = DynamicSchemaBuilder.create_model_from_dict(arguments)
                    schema_dict = DynamicSchemaBuilder.model_to_dict(model)
                    return [
                        TextContent(
                            type="text",
                            text=json.dumps(
                                {
                                    "status": "success",
                                    "schema": schema_dict,
                                    "json_schema": model.model_json_schema(),
                                },
                                indent=2,
                            ),
                        )
                    ]

                elif name == "run_completion":
                    schema_dict = arguments["schema"]
                    prompt = arguments["prompt"]
                    provider = arguments.get("provider", "openai")
                    model_name = arguments.get("model")

                    # Create response model
                    response_model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)

                    # Create client
                    client = InstructorClient(provider=provider, model=model_name)

                    # Run completion
                    result = await client.create_completion(
                        response_model=response_model,
                        messages=[{"role": "user", "content": prompt}],
                    )

                    return [
                        TextContent(
                            type="text",
                            text=json.dumps(
                                {"status": "success", "result": result.model_dump()}, indent=2
                            ),
                        )
                    ]

                elif name == "export_result":
                    data = arguments["data"]
                    format_type = arguments["format"]
                    title = arguments.get("title", "Result")

                    if format_type == "json":
                        content = ExportFormatter.to_json(data)
                    else:
                        content = ExportFormatter.to_markdown(data, title)

                    return [
                        TextContent(
                            type="text",
                            text=json.dumps(
                                {"status": "success", "content": content, "format": format_type},
                                indent=2,
                            ),
                        )
                    ]

                else:
                    return [
                        TextContent(
                            type="text",
                            text=json.dumps({"status": "error", "message": "Unknown tool"}),
                        )
                    ]

            except Exception as e:
                return [
                    TextContent(
                        type="text",
                        text=json.dumps({"status": "error", "message": str(e)}, indent=2),
                    )
                ]

    async def run(self):
        """Run the MCP server."""
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream, write_stream, self.server.create_initialization_options()
            )


async def main():
    """Main entry point for MCP server."""
    server = InstructorMCPServer()
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())
