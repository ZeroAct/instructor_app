"""FastAPI application for Instructor App."""

from contextlib import asynccontextmanager
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from instructor_app.schemas.dynamic import DynamicSchemaBuilder
from instructor_app.utils.export import ExportFormatter
from instructor_app.utils.instructor_client import InstructorClient


class SchemaRequest(BaseModel):
    """Request model for schema definition."""

    name: str
    description: str = ""
    fields: List[Dict[str, Any]]


class CompletionRequest(BaseModel):
    """Request model for completion."""
    
    schema_def: SchemaRequest
    messages: List[Dict[str, str]]
    provider: str = "openai"
    model: str | None = None
    api_key: str | None = None
    max_tokens: int = 1000
    temperature: float = 0.7
    stream: bool = False


class ExportRequest(BaseModel):
    """Request model for export."""

    data: Dict[str, Any]
    format: str = "json"  # json or markdown
    title: str = "Result"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager."""
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="Instructor App",
    description="Web application for structured LLM outputs with dynamic schemas",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates
templates = Jinja2Templates(directory="src/instructor_app/templates")


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Render the main page."""
    return templates.TemplateResponse(request, "index.html")


@app.post("/api/schema/validate")
async def validate_schema(schema_request: SchemaRequest):
    """Validate a schema definition."""
    try:
        schema_dict = schema_request.model_dump()
        model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)
        return {
            "valid": True,
            "schema": DynamicSchemaBuilder.model_to_dict(model),
            "json_schema": model.model_json_schema(),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid schema: {str(e)}")


@app.post("/api/completion")
async def create_completion(request: CompletionRequest):
    """Create a completion with structured output."""
    try:
        # Build dynamic schema
        schema_dict = request.schema_def.model_dump()
        response_model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)

        # Initialize client
        client = InstructorClient(
            provider=request.provider,
            api_key=request.api_key,
            model=request.model,
        )

        if request.stream:
            # Return streaming response
            async def generate():
                async for partial in client.create_streaming_completion(
                    response_model=response_model,
                    messages=request.messages,
                    max_tokens=request.max_tokens,
                    temperature=request.temperature,
                ):
                    # Send partial results as JSON
                    yield f"data: {partial.model_dump_json()}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")
        else:
            # Return complete response
            result = await client.create_completion(
                response_model=response_model,
                messages=request.messages,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
            )
            return {"result": result.model_dump()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Completion error: {str(e)}")


@app.post("/api/export")
async def export_result(export_request: ExportRequest):
    """Export result in the specified format."""
    if export_request.format == "json":
        content = ExportFormatter.to_json(export_request.data)
        media_type = "application/json"
        filename = f"{export_request.title.replace(' ', '_')}.json"
    elif export_request.format == "markdown" or export_request.format == "md":
        content = ExportFormatter.to_markdown(export_request.data, export_request.title)
        media_type = "text/markdown"
        filename = f"{export_request.title.replace(' ', '_')}.md"
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'json' or 'markdown'")

    return {
        "content": content,
        "filename": filename,
        "media_type": media_type,
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
