# Contributing to Instructor App

Thank you for your interest in contributing to Instructor App! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/instructor_app.git
   cd instructor_app
   ```
3. Set up the development environment:
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uv pip install -e ".[dev]"
   ```

## Development Workflow

### 1. Create a Branch

Create a branch for your feature or bugfix:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bugfix-name
```

### 2. Make Changes

- Write clean, readable code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 3. Run Tests

Before committing, ensure all tests pass:

```bash
pytest
```

### 4. Lint Your Code

Run the linter to check for style issues:

```bash
ruff check src/ tests/
```

Fix any issues automatically:

```bash
ruff check --fix src/ tests/
```

### 5. Commit Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "Add feature: description of what you added"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### Python Code

- Follow PEP 8 style guidelines
- Use type hints for function parameters and return values
- Maximum line length: 100 characters
- Use descriptive variable and function names

Example:
```python
def create_model_from_dict(schema_dict: Dict[str, Any]) -> Type[BaseModel]:
    """Create a Pydantic model from a dictionary definition.
    
    Args:
        schema_dict: Dictionary containing schema definition
        
    Returns:
        A dynamically created Pydantic model
    """
    # Implementation...
```

### Docstrings

Use Google-style docstrings:

```python
def example_function(param1: str, param2: int) -> bool:
    """Short description of function.
    
    Longer description if needed.
    
    Args:
        param1: Description of param1
        param2: Description of param2
        
    Returns:
        Description of return value
        
    Raises:
        ValueError: When validation fails
    """
```

### Testing

- Write tests for all new features
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern
- Use pytest fixtures when appropriate

Example:
```python
def test_create_model_from_dict():
    """Test creating a Pydantic model from dictionary."""
    # Arrange
    schema_dict = {
        "name": "TestModel",
        "fields": [{"name": "field1", "type": "str"}]
    }
    
    # Act
    model = DynamicSchemaBuilder.create_model_from_dict(schema_dict)
    
    # Assert
    assert model.__name__ == "TestModel"
    assert "field1" in model.model_fields
```

## Project Structure

```
instructor_app/
├── src/
│   └── instructor_app/
│       ├── api/              # REST API endpoints
│       │   ├── __init__.py
│       │   └── main.py       # FastAPI application
│       ├── mcp/              # MCP server
│       │   ├── __init__.py
│       │   └── server.py     # MCP server implementation
│       ├── schemas/          # Schema definitions
│       │   ├── __init__.py
│       │   └── dynamic.py    # Dynamic schema builder
│       ├── utils/            # Utility modules
│       │   ├── __init__.py
│       │   ├── export.py     # Export utilities
│       │   └── instructor_client.py  # Instructor client wrapper
│       ├── templates/        # HTML templates
│       │   └── index.html
│       └── __init__.py
├── tests/                    # Test suite
│   ├── __init__.py
│   ├── test_api.py
│   ├── test_dynamic_schema.py
│   └── test_export.py
├── main.py                   # Application entry point
├── pyproject.toml           # Project configuration
├── Dockerfile               # Docker configuration
└── docker-compose.yml       # Docker Compose configuration
```

## Adding New Features

### Adding a New API Endpoint

1. Add the endpoint to `src/instructor_app/api/main.py`
2. Add corresponding tests to `tests/test_api.py`
3. Update the README and USAGE.md with documentation
4. Update the HTML template if UI changes are needed

### Adding a New Schema Type

1. Add the type to `SchemaField.to_pydantic_field()` in `src/instructor_app/schemas/dynamic.py`
2. Add tests for the new type
3. Update the HTML template dropdown
4. Document the new type in USAGE.md

### Adding a New Export Format

1. Add the format method to `ExportFormatter` in `src/instructor_app/utils/export.py`
2. Add tests for the new format
3. Update the API endpoint to support the new format
4. Add a button to the HTML template
5. Document the new format in USAGE.md

## Testing

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_api.py

# Run specific test
pytest tests/test_api.py::test_health_endpoint

# Run with coverage
pytest --cov=src/instructor_app --cov-report=html
```

### Writing Tests

Tests should cover:
- Happy path scenarios
- Edge cases
- Error conditions
- Input validation

Use fixtures for common setup:

```python
@pytest.fixture
def sample_schema():
    return {
        "name": "TestModel",
        "fields": [{"name": "field1", "type": "str"}]
    }

def test_with_fixture(sample_schema):
    model = DynamicSchemaBuilder.create_model_from_dict(sample_schema)
    assert model is not None
```

## Documentation

### Updating Documentation

When adding features, update:

1. **README.md**: Overview and quick start
2. **USAGE.md**: Detailed usage instructions and examples
3. **Docstrings**: In-code documentation
4. **API Documentation**: Endpoint descriptions in main.py

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams for complex features
- Keep examples simple and practical

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass
- [ ] Code is linted (ruff check passes)
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### PR Description

Include in your PR description:
- What changes were made
- Why these changes were needed
- How to test the changes
- Any breaking changes
- Screenshots (for UI changes)

Example:
```markdown
## Changes
- Added support for nested schemas
- Updated validation logic

## Why
Users requested the ability to define nested object structures

## Testing
1. Run `pytest`
2. Test the new nested schema feature via UI
3. Verify API endpoint works with nested schemas

## Screenshots
[Include screenshots if UI changed]
```

## Code Review Process

1. A maintainer will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited in the release notes

## Getting Help

- Open an issue for bugs or feature requests
- Join discussions in existing issues
- Tag maintainers if you need help

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- The repository's contributor list
- Release notes
- Special mentions for significant contributions

Thank you for contributing to Instructor App!
