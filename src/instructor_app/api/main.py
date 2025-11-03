"""FastAPI application for Instructor App."""

from contextlib import asynccontextmanager
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from instructor_app.schemas.dynamic import DynamicSchemaBuilder
from instructor_app.utils.export import ExportFormatter
from instructor_app.utils.instructor_client import InstructorClient
from instructor_app.utils.file_parser import get_file_parser, is_file_upload_enabled
from instructor_app.utils.structured_parser import (
    get_structured_parser,
    is_structured_parsing_enabled
)


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
    stream: bool = False
    extract_list: bool = False  # Extract a list of objects instead of a single object
    
    class Config:
        extra = "allow"  # Allow extra fields for dynamic parameters


class ExportRequest(BaseModel):
    """Request model for export."""

    data: Dict[str, Any] | list[Any]
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
        base_model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)
        
        # Wrap in List if extract_list is enabled
        if request.extract_list:
            from typing import List as ListType
            response_model = ListType[base_model]
        else:
            response_model = base_model

        # Initialize client
        client = InstructorClient(
            provider=request.provider,
            api_key=request.api_key,
            model=request.model,
            base_url=getattr(request, 'base_url', None),
        )
        
        # Extract dynamic parameters (exclude the fields we handle separately)
        excluded_fields = {'schema_def', 'messages', 'provider', 'model', 'api_key', 'stream', 'extract_list', 'base_url'}
        dynamic_params = {k: v for k, v in request.model_dump().items() if k not in excluded_fields}

        if request.stream:
            # Return streaming response
            async def generate():
                async for partial in client.create_streaming_completion(
                    response_model=response_model,
                    messages=request.messages,
                    **dynamic_params,
                ):
                    # Send partial results as JSON
                    if request.extract_list:
                        # For lists, serialize as list
                        import json
                        yield f"data: {json.dumps([item.model_dump() for item in partial])}\n\n"
                    else:
                        yield f"data: {partial.model_dump_json()}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")
        else:
            # Return complete response
            result = await client.create_completion(
                response_model=response_model,
                messages=request.messages,
                **dynamic_params,
            )
            
            if request.extract_list:
                # For lists, convert to list of dicts
                return {"result": [item.model_dump() for item in result]}
            else:
                return {"result": result.model_dump()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Completion error: {str(e)}")


@app.post("/api/model/validate")
async def validate_model(request: CompletionRequest):
    """Validate model configuration by sending a test request."""
    try:
        # Build a simple test schema
        test_schema = {
            "name": "TestValidation",
            "description": "Test schema for model validation",
            "fields": [
                {"name": "status", "type": "str", "description": "Validation status", "required": True}
            ]
        }
        
        schema_dict = test_schema
        test_model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)
        
        # Initialize client
        client = InstructorClient(
            provider=request.provider,
            api_key=request.api_key,
            model=request.model,
            base_url=getattr(request, 'base_url', None),
        )
        
        # Extract dynamic parameters
        excluded_fields = {'schema_def', 'messages', 'provider', 'model', 'api_key', 'stream', 'extract_list', 'base_url'}
        dynamic_params = {k: v for k, v in request.model_dump().items() if k not in excluded_fields}
        
        # Test with a simple message
        test_messages = [{"role": "user", "content": "Return status as 'success'"}]
        
        # Try to create completion
        result = await client.create_completion(
            response_model=test_model,
            messages=test_messages,
            **dynamic_params,
        )
        
        return {
            "valid": True,
            "message": "Model configuration validated successfully",
            "provider": request.provider,
            "model": request.model or f"default ({client.model})",
        }
    
    except Exception as e:
        return {
            "valid": False,
            "message": f"Model validation failed: {str(e)}",
            "provider": request.provider,
            "model": request.model or "default",
        }


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


@app.post("/api/file/upload")
async def upload_file_v2(file: UploadFile = File(...)):
    """
    Upload a file to temporary storage (Step 1).
    
    This endpoint only stores the file and returns a file_id.
    No parsing happens at this stage. Use /api/file/parse/{file_id} or 
    /api/file/parse-structured/{file_id} to parse the uploaded file.
    
    Returns:
        file_id: Unique identifier for the uploaded file
        filename: Original filename
        size: File size in bytes
    """
    if not is_file_upload_enabled():
        raise HTTPException(
            status_code=403,
            detail="File upload feature is disabled. Set ENABLE_FILE_UPLOAD=true to enable."
        )
    
    try:
        from instructor_app.utils.file_storage import get_file_storage
        
        # Read file content
        content = await file.read()
        
        # Store file
        file_storage = get_file_storage()
        file_id = file_storage.store(content, file.filename or "unknown")
        
        return {
            "success": True,
            "file_id": file_id,
            "filename": file.filename,
            "size": len(content),
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload error: {str(e)}")




@app.post("/api/file/parse/{file_id}")
async def parse_file_simple(file_id: str):
    """
    Parse uploaded file with simple text extraction (Step 2 - Simple).
    
    Args:
        file_id: File identifier returned from /api/file/upload
        
    Returns:
        success: bool
        text: Extracted text content
    """
    if not is_file_upload_enabled():
        raise HTTPException(
            status_code=403,
            detail="File upload feature is disabled. Set ENABLE_FILE_UPLOAD=true to enable."
        )
    
    try:
        from instructor_app.utils.file_storage import get_file_storage
        
        # Get file from storage
        file_storage = get_file_storage()
        content = file_storage.read(file_id)
        
        if content is None:
            raise HTTPException(status_code=404, detail="File not found or expired")
        
        # Get file metadata for filename
        stored_file = file_storage.get(file_id)
        filename = stored_file.filename if stored_file else "unknown"
        
        # Parse file
        parser = get_file_parser()
        extracted_text = parser.parse_file(content, filename)
        
        return {
            "success": True,
            "file_id": file_id,
            "text": extracted_text,
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File parsing error: {str(e)}")


@app.post("/api/file/parse-structured/{file_id}")
async def parse_file_structured(
    file_id: str,
    do_ocr: bool = None,
    extract_tables: bool = None,
    preserve_hierarchy: bool = None,
):
    """
    Parse uploaded file with structure preservation (Step 2 - Structured).
    
    Uses Docling with PaddleOCR for advanced document understanding.
    Parses once and caches all formats for instant export.
    
    Args:
        file_id: File identifier returned from /api/file/upload
        
    Query Parameters:
        do_ocr: Enable OCR for scanned documents. Default: from config
        extract_tables: Extract tables with structure. Default: from config  
        preserve_hierarchy: Maintain document hierarchy. Default: from config
    
    Returns:
        success: bool
        file_id: File identifier
        formats: Dict with all available formats (text, markdown, html, json)
    """
    if not is_structured_parsing_enabled():
        raise HTTPException(
            status_code=403,
            detail="Structured parsing feature is disabled. Set ENABLE_STRUCTURED_PARSING=true to enable."
        )
    
    try:
        from instructor_app.utils.file_storage import get_file_storage
        
        # Get file from storage
        file_storage = get_file_storage()
        content = file_storage.read(file_id)
        
        if content is None:
            raise HTTPException(status_code=404, detail="File not found or expired")
        
        # Get file metadata
        stored_file = file_storage.get(file_id)
        filename = stored_file.filename if stored_file else "unknown"
        
        # Build options from query parameters
        options = {}
        if do_ocr is not None:
            options['do_ocr'] = do_ocr
        if extract_tables is not None:
            options['extract_tables'] = extract_tables
        if preserve_hierarchy is not None:
            options['preserve_hierarchy'] = preserve_hierarchy
        
        # Parse file with all formats
        parser = get_structured_parser()
        formats = {}
        
        for output_format in ['text', 'markdown', 'html', 'json']:
            result = parser.parse_document(
                content, 
                filename,
                output_format=output_format,
                **options
            )
            
            if result.get("success"):
                formats[output_format] = result.get("content")
        
        if not formats:
            raise HTTPException(status_code=500, detail="Failed to parse document in any format")
        
        return {
            "success": True,
            "file_id": file_id,
            "formats": formats,
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Required library not available: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document parsing error: {str(e)}")


@app.get("/api/file/export/{file_id}")
async def export_file_format(file_id: str, format: str = "markdown"):
    """
    Export parsed file in specified format (Step 3).
    
    The file must be parsed first using /api/file/parse-structured/{file_id}.
    This endpoint provides instant format conversion without re-parsing.
    
    Args:
        file_id: File identifier
        format: Output format (text, markdown, html, json)
        
    Returns:
        success: bool
        content: Formatted content
        format: Output format
    """
    if not is_structured_parsing_enabled():
        raise HTTPException(
            status_code=403,
            detail="Structured parsing feature is disabled. Set ENABLE_STRUCTURED_PARSING=true to enable."
        )
    
    if format not in ['text', 'markdown', 'html', 'json']:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format '{format}'. Must be one of: text, markdown, html, json"
        )
    
    try:
        from instructor_app.utils.file_storage import get_file_storage
        
        # Get file from storage
        file_storage = get_file_storage()
        content = file_storage.read(file_id)
        
        if content is None:
            raise HTTPException(status_code=404, detail="File not found or expired")
        
        # Get file metadata
        stored_file = file_storage.get(file_id)
        filename = stored_file.filename if stored_file else "unknown"
        
        # Parse with requested format
        parser = get_structured_parser()
        result = parser.parse_document(
            content, 
            filename,
            output_format=format,
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        return {
            "success": True,
            "content": result.get("content"),
            "format": format,
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")

    """Get file upload configuration."""
    if not is_file_upload_enabled():
        return {
            "enabled": False,
            "message": "File upload feature is disabled"
        }
    
    try:
        parser = get_file_parser()
        
        # Check if PaddleOCR is available
        ocr_available = False
        try:
            from paddleocr import PaddleOCR  # noqa
            ocr_available = True
        except ImportError:
            pass
        
        return {
            "enabled": True,
            "max_file_size_mb": parser.config.get("file_upload", {}).get("max_file_size_mb", 10),
            "allowed_extensions": parser.config.get("file_upload", {}).get("allowed_extensions", []),
            "ocr_available": ocr_available,
        }
    except Exception:
        # Don't expose internal error details to external users
        return {
            "enabled": True,
            "message": "File upload enabled but configuration could not be loaded"
        }


# Legacy/duplicate endpoints removed - Use new RESTful API:
# - POST /api/file/upload -> file_id
# - POST /api/file/parse/{file_id} -> text
# - POST /api/file/parse-structured/{file_id} -> all formats
# - GET /api/file/export/{file_id}?format=X -> format conversion


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
