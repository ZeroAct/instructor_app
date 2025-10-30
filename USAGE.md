# Usage Guide

This guide provides detailed instructions for using the Instructor App.

## Table of Contents

- [Getting Started](#getting-started)
- [Web Interface](#web-interface)
- [REST API](#rest-api)
- [MCP Server](#mcp-server)
- [Examples](#examples)

## Getting Started

### Installation

1. **Using UV (Recommended)**
   ```bash
   # Install UV if you haven't already
   pip install uv
   
   # Clone the repository
   git clone https://github.com/ZeroAct/instructor_app.git
   cd instructor_app
   
   # Create virtual environment and install dependencies
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uv pip install -e .
   ```

2. **Using Docker**
   ```bash
   # Build the image
   docker build -t instructor-app .
   
   # Run the container
   docker run -p 8000:8000 \
     -e OPENAI_API_KEY=your_key \
     instructor-app
   ```

3. **Using Docker Compose**
   ```bash
   # Create .env file with your API keys
   cp .env.example .env
   # Edit .env and add your keys
   
   # Start the application
   docker-compose up
   ```

### Configuration

Set environment variables for API keys:

```bash
export OPENAI_API_KEY=your_openai_api_key
export ANTHROPIC_API_KEY=your_anthropic_api_key
```

Or create a `.env` file:

```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Web Interface

### Accessing the UI

1. Start the server:
   ```bash
   python main.py
   ```

2. Open your browser to `http://localhost:8000`

### Using the UI

#### 1. Define Your Schema

- **Schema Name**: Give your schema a descriptive name (e.g., "UserProfile")
- **Schema Description**: Describe what your schema represents
- **Fields**: Add fields with:
  - Name: Field identifier (e.g., "email", "age")
  - Type: String, Integer, Float, Boolean, or List
  - Description: What the field contains
  - Required: Check if the field is mandatory

#### 2. Validate Schema

Click "Validate Schema" to ensure your schema definition is correct. The system will:
- Check for syntax errors
- Generate the Pydantic model
- Display the JSON schema

#### 3. Configure Settings

- **Provider**: Choose between OpenAI or Anthropic
- **API Key**: Optional - leave empty to use environment variable
- **Model**: Optional - leave empty for default model
- **Prompt**: Enter your prompt that describes the data to extract
- **Enable Streaming**: Check to see results stream in real-time

#### 4. Run Completion

Click "▶️ Run Completion" to:
- Send your prompt to the LLM
- Extract structured data based on your schema
- Display results in the Results panel

#### 5. Export Results

After getting results, you can:
- **Export JSON**: Download results as a JSON file
- **Export Markdown**: Download results as a Markdown file

## REST API

### Base URL

```
http://localhost:8000
```

### Endpoints

#### 1. Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy"
}
```

#### 2. Validate Schema

```bash
POST /api/schema/validate
Content-Type: application/json

{
  "name": "UserProfile",
  "description": "A user profile",
  "fields": [
    {
      "name": "name",
      "type": "str",
      "description": "User's full name",
      "required": true
    },
    {
      "name": "age",
      "type": "int",
      "description": "User's age",
      "required": true
    },
    {
      "name": "email",
      "type": "str",
      "description": "User's email",
      "required": false
    }
  ]
}
```

Response:
```json
{
  "valid": true,
  "schema": { ... },
  "json_schema": { ... }
}
```

#### 3. Run Completion

**Non-Streaming:**
```bash
POST /api/completion
Content-Type: application/json

{
  "schema_def": {
    "name": "UserProfile",
    "fields": [
      {
        "name": "name",
        "type": "str",
        "required": true
      },
      {
        "name": "age",
        "type": "int",
        "required": true
      }
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
}
```

Response:
```json
{
  "result": {
    "name": "John Doe",
    "age": 30
  }
}
```

**Streaming:**
```bash
POST /api/completion
Content-Type: application/json

{
  "schema_def": { ... },
  "messages": [ ... ],
  "stream": true
}
```

Response (Server-Sent Events):
```
data: {"name": "John", "age": null}

data: {"name": "John Doe", "age": 30}
```

#### 4. Export Results

```bash
POST /api/export
Content-Type: application/json

{
  "data": {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com"
  },
  "format": "json",  // or "markdown"
  "title": "User Profile"
}
```

Response:
```json
{
  "content": "...",
  "filename": "User_Profile.json",
  "media_type": "application/json"
}
```

## MCP Server

### Starting the MCP Server

```bash
python main.py mcp
```

### Available Tools

#### 1. create_schema

Create a dynamic Pydantic schema:

```json
{
  "name": "ProductInfo",
  "description": "Product information",
  "fields": [
    {
      "name": "title",
      "type": "str",
      "description": "Product title",
      "required": true
    },
    {
      "name": "price",
      "type": "float",
      "description": "Product price",
      "required": true
    }
  ]
}
```

#### 2. run_completion

Run a completion with structured output:

```json
{
  "schema": {
    "name": "ProductInfo",
    "fields": [ ... ]
  },
  "prompt": "Extract product info: MacBook Pro costs $1999",
  "provider": "openai"
}
```

#### 3. export_result

Export results to a specific format:

```json
{
  "data": {
    "title": "MacBook Pro",
    "price": 1999.0
  },
  "format": "markdown",
  "title": "Product Info"
}
```

## Examples

### Example 1: Extract User Information

**Schema:**
```json
{
  "name": "UserProfile",
  "fields": [
    {"name": "name", "type": "str", "required": true},
    {"name": "age", "type": "int", "required": true},
    {"name": "occupation", "type": "str", "required": true},
    {"name": "location", "type": "str", "required": true}
  ]
}
```

**Prompt:**
```
Extract user information from: "John Doe is a 30 year old software engineer living in San Francisco."
```

**Result:**
```json
{
  "name": "John Doe",
  "age": 30,
  "occupation": "software engineer",
  "location": "San Francisco"
}
```

### Example 2: Extract Product Reviews

**Schema:**
```json
{
  "name": "ProductReview",
  "fields": [
    {"name": "product_name", "type": "str", "required": true},
    {"name": "rating", "type": "int", "required": true},
    {"name": "pros", "type": "list", "required": true},
    {"name": "cons", "type": "list", "required": true},
    {"name": "recommended", "type": "bool", "required": true}
  ]
}
```

**Prompt:**
```
Extract review: "The iPhone 15 Pro is amazing. I love the camera and battery life. The only downside is the price. Rating: 4/5. I would recommend it."
```

**Result:**
```json
{
  "product_name": "iPhone 15 Pro",
  "rating": 4,
  "pros": ["camera", "battery life"],
  "cons": ["price"],
  "recommended": true
}
```

### Example 3: Extract Meeting Notes

**Schema:**
```json
{
  "name": "MeetingNotes",
  "fields": [
    {"name": "date", "type": "str", "required": true},
    {"name": "attendees", "type": "list", "required": true},
    {"name": "topics", "type": "list", "required": true},
    {"name": "action_items", "type": "list", "required": true},
    {"name": "next_meeting", "type": "str", "required": false}
  ]
}
```

**Prompt:**
```
Extract from meeting notes: "Meeting on Oct 30, 2025. Attendees: John, Jane, Bob. Discussed Q4 planning and budget. Action items: John to prepare report, Jane to schedule follow-up. Next meeting: Nov 6."
```

**Result:**
```json
{
  "date": "Oct 30, 2025",
  "attendees": ["John", "Jane", "Bob"],
  "topics": ["Q4 planning", "budget"],
  "action_items": [
    "John to prepare report",
    "Jane to schedule follow-up"
  ],
  "next_meeting": "Nov 6"
}
```

## Tips and Best Practices

1. **Schema Design**
   - Keep field names descriptive and consistent
   - Use appropriate types for your data
   - Mark fields as optional when they might not always be present

2. **Prompts**
   - Be specific about what you want to extract
   - Provide context in your prompts
   - Include examples when dealing with complex data

3. **Streaming**
   - Enable streaming for long responses
   - Useful for real-time feedback
   - Reduces perceived latency

4. **Error Handling**
   - Always validate your schema before running completions
   - Check API responses for errors
   - Provide fallback values for optional fields

5. **Performance**
   - Cache validated schemas when possible
   - Use appropriate model sizes for your use case
   - Consider batch processing for multiple items

## Troubleshooting

### Server Won't Start

- Check if port 8000 is already in use
- Verify all dependencies are installed
- Check for syntax errors in configuration

### API Key Errors

- Ensure API keys are set in environment variables
- Verify API keys are valid and have credits
- Check if the provider (OpenAI/Anthropic) is accessible

### Schema Validation Fails

- Check field names don't contain special characters
- Verify field types are supported
- Ensure required fields are marked correctly

### Completion Returns Unexpected Results

- Review your prompt for clarity
- Check if the schema matches your expectations
- Try different models or providers
- Adjust temperature settings if needed

## Support

For issues and questions:
- GitHub Issues: https://github.com/ZeroAct/instructor_app/issues
- Documentation: See README.md
