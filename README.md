# Instructor App
[Sample Page](http://52.79.210.112/ko)

Web application for [Instructor](https://github.com/567-labs/instructor) - structured outputs from LLMs with dynamic schemas.

![Instructor App UI](./instructor_app.png)

## Features

- 🎯 **Dynamic Schema Definition**: Create and validate Pydantic schemas on the fly
- 🌊 **Streaming Support**: Real-time streaming output from LLM responses
- 📤 **Export Functionality**: Export results in JSON or Markdown format
- 📁 **File Upload & OCR**: Upload documents with automatic text extraction
- 📊 **Structured Document Parsing**: Advanced document understanding with Docling
  - Preserve table structures
  - Maintain document hierarchy
  - Multiple output formats (Markdown, JSON, HTML)
  - PaddleOCR integration for superior OCR performance
- 🔌 **REST API**: Full-featured REST API for programmatic access
- 🤖 (Comming Soon) **MCP Support**: Model Context Protocol server for tool integration
- 🐳 **Docker Support**: Easy deployment with Docker and docker-compose
- 📦 **UV Environment**: Modern Python package management with UV
- ⚡ **Modern Frontend**: Next.js frontend with improved UX and step-by-step workflow

## Quick Start

### Using Docker (Recommended)

Run both frontend and backend with a single command:

```bash
# Production mode
docker-compose up --build

# Development mode with hot reload
docker-compose -f docker-compose.dev.yml up
```

Then access:
- **Frontend**: http://localhost:3000 (Modern Next.js UI)
- **Backend API**: http://localhost:8000 (Legacy HTML UI + API)

See [DOCKER.md](DOCKER.md) for detailed Docker instructions.

### Using UV

```bash
# Install dependencies
uv pip install -e .

# Optional: Install file upload dependencies
uv pip install -e ".[file-upload]"

# Optional: Install structured parsing dependencies (includes Docling)
uv pip install -e ".[structured-parsing]"

# Install all optional dependencies
uv pip install -e ".[all]"

# Run the web server
python main.py

# Or run with uvicorn directly
uv run uvicorn src.instructor_app.api.main:app --reload
```

### Environment Variables

Create a `.env` file or set environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# File Upload Feature (optional, defaults to true)
ENABLE_FILE_UPLOAD=true
```

## Deployment

### Deploy to AWS

Want to deploy this app to AWS cloud? We've got you covered with a comprehensive guide!

See [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) for step-by-step instructions on deploying to:
- **AWS App Runner** (easiest option for beginners)
- **Amazon ECS with Fargate** (production-grade with auto-scaling)
- **EC2 with Docker** (full control and cost optimization)
- **AWS Elastic Beanstalk** (quick multi-container deployment)

The guide includes everything you need even if you have no AWS experience.

### Local Docker Deployment

See [DOCKER.md](DOCKER.md) for running with Docker locally.

## Usage

### Modern Frontend (Recommended)

The new Next.js frontend provides an improved UX with step-by-step workflow:

1. **Start the backend**: Run `python main.py` (backend runs on port 8000)
2. **Start the frontend**: 
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Open browser**: Navigate to `http://localhost:3000`
4. **Follow the steps**:
   - Step 1: Define your schema (with import/export)
   - Step 2: Configure the model settings
   - Step 3: Enter your prompt
   - Step 4: View results (formatted or raw JSON)

See [frontend/README.md](frontend/README.md) for more details.

### Legacy Web Interface

The original single-page interface is still available at `http://localhost:8000`:

1. Open your browser to `http://localhost:8000`
2. Define your schema by adding fields
3. Configure the LLM provider and prompt
4. Run completion to get structured output
5. Export results as JSON or Markdown

### REST API

#### Validate Schema

```bash
curl -X POST http://localhost:8000/api/schema/validate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "UserProfile",
    "description": "A user profile",
    "fields": [
      {
        "name": "name",
        "type": "str",
        "description": "User name",
        "required": true
      },
      {
        "name": "age",
        "type": "int",
        "description": "User age",
        "required": true
      }
    ]
  }'
```

#### Run Completion

```bash
curl -X POST http://localhost:8000/api/completion \
  -H "Content-Type: application/json" \
  -d '{
    "schema": {
      "name": "UserProfile",
      "fields": [
        {"name": "name", "type": "str", "required": true},
        {"name": "age", "type": "int", "required": true}
      ]
    },
    "messages": [
      {
        "role": "user",
        "content": "Extract user info: John Doe is 30 years old"
      }
    ],
    "provider": "openai",
    "stream": false
  }'
```

#### Export Result

```bash
curl -X POST http://localhost:8000/api/export \
  -H "Content-Type: application/json" \
  -d '{
    "data": {"name": "John Doe", "age": 30},
    "format": "markdown",
    "title": "User Profile"
  }'
```

#### Upload File for Text Extraction (Simple)

```bash
# Upload a document and extract plain text
curl -X POST http://localhost:8000/api/file/upload \
  -F "file=@document.pdf"

# Get file upload configuration
curl http://localhost:8000/api/file/config
```

#### Upload File for Structured Parsing (Advanced)

```bash
# Upload document with structure preservation (tables, hierarchy)
curl -X POST "http://localhost:8000/api/file/upload-structured?output_format=markdown" \
  -F "file=@document.pdf"

# With custom parameters
curl -X POST "http://localhost:8000/api/file/upload-structured?output_format=json&do_ocr=true&extract_tables=true" \
  -F "file=@document.pdf"

# Get structured parsing configuration
curl http://localhost:8000/api/file/structured-config
```

**Supported output formats**:
- `markdown` - Markdown with preserved tables (default)
- `json` - Structured JSON with hierarchy
- `html` - HTML with semantic structure
- `text` - Plain text

**Query parameters**:
- `output_format`: Output format (markdown, json, html, text)
- `do_ocr`: Enable OCR for scanned documents (boolean)
- `extract_tables`: Extract tables with structure (boolean)
- `preserve_hierarchy`: Maintain document hierarchy (boolean)

The file upload features support:
- **Images**: JPG, PNG, BMP, GIF, TIFF (with OCR via PaddleOCR)
- **Documents**: PDF, DOC, DOCX (structured parsing preserves tables and hierarchy)
- **Spreadsheets**: XLS, XLSX, CSV
- **Text files**: TXT, JSON, XML, HTML, Markdown, RTF

Configuration options are available in `config.json` at the root of the project.

### MCP Server

Run the MCP server for tool integration:

```bash
python main.py mcp
```

Available MCP tools:
- `create_schema`: Create a dynamic Pydantic schema
- `run_completion`: Run completion with structured output
- `export_result`: Export results to JSON or Markdown

## Development

### Install Development Dependencies

```bash
uv pip install -e ".[dev]"
```

### Run Tests

```bash
pytest
```

### Code Formatting

```bash
ruff check --fix src/
ruff format src/
```

## Documentation

- [USAGE.md](USAGE.md) - Detailed usage instructions, examples, and API reference
- [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) - Frontend migration guide and architecture
- [frontend/README.md](frontend/README.md) - Frontend-specific documentation
- [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) - Complete guide for deploying to AWS cloud
- [DOCKER.md](DOCKER.md) - Docker setup and deployment instructions

## Architecture

```
instructor_app/
├── src/
│   └── instructor_app/
│       ├── api/           # REST API endpoints
│       ├── mcp/           # MCP server implementation
│       ├── schemas/       # Dynamic schema builder
│       ├── utils/         # Utilities (client, export)
│       └── templates/     # HTML templates
├── tests/                 # Test suite
├── main.py               # Entry point
├── Dockerfile            # Docker configuration
└── docker-compose.yml    # Docker Compose configuration
```

## License

MIT License - see LICENSE file for details.

## Credits

Built with:
- [Instructor](https://github.com/567-labs/instructor) - Structured outputs from LLMs
- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [Pydantic](https://docs.pydantic.dev/) - Data validation
- [UV](https://github.com/astral-sh/uv) - Python package manager
