# Instructor App

Web application for [Instructor](https://github.com/567-labs/instructor) - structured outputs from LLMs with dynamic schemas.

![Instructor App UI](https://github.com/user-attachments/assets/2225429b-5269-4c9a-a55d-ce6c51833e92)

## Features

- 🎯 **Dynamic Schema Definition**: Create and validate Pydantic schemas on the fly
- 🌊 **Streaming Support**: Real-time streaming output from LLM responses
- 📤 **Export Functionality**: Export results in JSON or Markdown format
- 🔌 **REST API**: Full-featured REST API for programmatic access
- 🤖 **MCP Support**: Model Context Protocol server for tool integration
- 🐳 **Docker Support**: Easy deployment with Docker and docker-compose
- 📦 **UV Environment**: Modern Python package management with UV
- ⚡ **Modern Frontend**: Next.js frontend with improved UX and step-by-step workflow

## Quick Start

### Using UV (Recommended)

```bash
# Install dependencies
uv pip install -e .

# Run the web server
python main.py

# Or run with uvicorn directly
uv run uvicorn src.instructor_app.api.main:app --reload
```

### Using Docker

```bash
# Build and run with docker-compose
docker-compose up --build

# Or build and run manually
docker build -t instructor-app .
docker run -p 8000:8000 -e OPENAI_API_KEY=your_key instructor-app
```

### Environment Variables

Create a `.env` file or set environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

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

For detailed usage instructions, examples, and API reference, see [USAGE.md](USAGE.md).

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
