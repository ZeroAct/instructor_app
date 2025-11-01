# File Upload Feature Documentation

## Overview

The file upload feature enables users to upload various document types and automatically extract text content using PaddleOCR and other parsing libraries. This feature seamlessly integrates with the existing extraction workflow.

## Features

### Supported File Formats

- **Images**: JPG, JPEG, PNG, BMP, GIF, TIFF, WEBP
  - Uses PaddleOCR for text extraction
- **Documents**: PDF, DOC, DOCX
  - PDF: Extracts text using PyPDF2
  - DOCX: Extracts text using python-docx
- **Spreadsheets**: XLS, XLSX, CSV
  - Excel: Extracts all sheets with openpyxl
  - CSV: Parses tabular data
- **Text Files**: TXT, JSON, XML, HTML, Markdown, RTF
  - Direct text extraction with encoding detection

### Environment Toggle

The feature can be enabled/disabled via environment variable:

```bash
# Enable (default)
ENABLE_FILE_UPLOAD=true

# Disable
ENABLE_FILE_UPLOAD=false
```

## Installation

### Basic Installation

```bash
pip install -e .
```

### With File Upload Support

```bash
pip install -e ".[file-upload]"
```

This installs:
- `paddleocr>=2.7.0` - OCR engine for images
- `PyPDF2>=3.0.0` - PDF text extraction
- `python-docx>=1.0.0` - Word document parsing
- `openpyxl>=3.1.0` - Excel file parsing

## Configuration

Configuration is stored in `config.json` at the project root:

```json
{
  "file_upload": {
    "enabled": true,
    "max_file_size_mb": 10,
    "allowed_extensions": [
      ".txt", ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", 
      ".bmp", ".gif", ".tiff", ".csv", ".xlsx", ".xls", ".json", 
      ".xml", ".html", ".md", ".rtf"
    ]
  },
  "ocr": {
    "backend": "paddleocr",
    "paddleocr": {
      "use_angle_cls": true,
      "lang": "en",
      "use_gpu": false,
      "show_log": false,
      "det_model_dir": null,
      "rec_model_dir": null,
      "cls_model_dir": null
    },
    "fallback_to_text": true,
    "image_extensions": [".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff", ".webp"]
  },
  "text_extraction": {
    "encoding": "utf-8",
    "fallback_encodings": ["latin-1", "cp1252", "iso-8859-1"]
  },
  "pdf_processing": {
    "extract_images": true,
    "ocr_images": true,
    "use_layout_analysis": false
  }
}
```

### Configuration Options

#### File Upload Settings
- `enabled`: Whether file upload is enabled in config
- `max_file_size_mb`: Maximum file size in megabytes
- `allowed_extensions`: List of allowed file extensions

#### OCR Settings
- `backend`: OCR backend to use (currently only "paddleocr")
- `paddleocr`: PaddleOCR-specific configuration
  - `use_angle_cls`: Enable text angle classification
  - `lang`: Language for OCR (e.g., "en", "ch", "fr")
  - `use_gpu`: Whether to use GPU acceleration (Note: Not available in PaddleOCR 3.3.1+)
  - `show_log`: Show PaddleOCR logging
  - Model directories (optional, uses default if null)
  
  **Important**: The parser automatically validates and filters parameters based on your PaddleOCR version. If a parameter is not supported by your version (like `use_gpu` in 3.3.1+), it will be automatically skipped. This ensures compatibility across different PaddleOCR versions.
  
- `fallback_to_text`: Fallback to text extraction if OCR fails
- `image_extensions`: List of image extensions to process with OCR

#### Text Extraction Settings
- `encoding`: Primary encoding for text files
- `fallback_encodings`: List of fallback encodings to try

#### PDF Processing Settings
- `extract_images`: Whether to extract images from PDFs
- `ocr_images`: Whether to OCR images in PDFs
- `use_layout_analysis`: Use layout analysis for complex PDFs

## API Usage

### Upload File Endpoint

```bash
POST /api/file/upload
```

**Request**: Multipart form data with file

```bash
curl -X POST http://localhost:8000/api/file/upload \
  -F "file=@document.pdf"
```

**Response**:
```json
{
  "success": true,
  "filename": "document.pdf",
  "text": "Extracted text content...",
  "size": 12345
}
```

**Error Responses**:
- `403`: Feature disabled
- `400`: Invalid extension or file too large
- `500`: Parsing error

### Get Configuration Endpoint

```bash
GET /api/file/config
```

**Response**:
```json
{
  "enabled": true,
  "max_file_size_mb": 10,
  "allowed_extensions": [".txt", ".pdf", ...],
  "ocr_available": true
}
```

## Frontend Usage

### File Upload Component

The `FileUpload` component provides drag-and-drop functionality:

```tsx
import FileUpload from '@/components/FileUpload';

<FileUpload 
  onFileUploaded={(text, filename) => {
    // Handle uploaded text
    console.log(`File ${filename} uploaded with ${text.length} characters`);
  }}
  disabled={false}
/>
```

### Integration with Prompt Step

The file upload is integrated into the Prompt Step:

1. Click "Upload File" button to show file upload area
2. Drag and drop a file or click to browse
3. File is automatically uploaded and text is extracted
4. Extracted text is inserted into the prompt field
5. Continue with normal extraction workflow

## Programmatic Usage

### Python Example

```python
from instructor_app.utils.file_parser import FileParser

# Initialize parser
parser = FileParser()

# Parse a file
with open('document.pdf', 'rb') as f:
    content = f.read()
    text = parser.parse_file(content, 'document.pdf')
    print(text)
```

### Environment Control

```python
import os
from instructor_app.utils.file_parser import is_file_upload_enabled

# Check if enabled
if is_file_upload_enabled():
    print("File upload is enabled")

# Disable temporarily
os.environ['ENABLE_FILE_UPLOAD'] = 'false'
```

## Error Handling

The file parser handles various error cases:

1. **Unsupported Format**: Returns error if extension not allowed
2. **File Too Large**: Rejects files exceeding size limit
3. **OCR Failure**: Falls back to text extraction if configured
4. **Encoding Issues**: Tries multiple encodings automatically
5. **Corrupted Files**: Returns descriptive error message

## Extensibility

### Adding New File Format Support

To add support for a new file format:

1. Add extension to `allowed_extensions` in config.json
2. Add parsing method in `file_parser.py`:

```python
def _parse_new_format(self, content: bytes) -> str:
    """Parse new file format."""
    try:
        # Your parsing logic here
        return extracted_text
    except Exception as e:
        if self.config.get("ocr", {}).get("fallback_to_text", True):
            return self._parse_text(content)
        raise
```

3. Add routing in `parse_file()` method:

```python
elif ext == ".newext":
    return self._parse_new_format(file_content)
```

### Custom OCR Backend

To add a custom OCR backend:

1. Update config.json with new backend settings
2. Implement OCR wrapper in file_parser.py
3. Update `_get_ocr()` method to support new backend

## Performance Considerations

- **OCR Processing**: Image OCR can be slow, especially for large images
- **GPU Acceleration**: Enable `use_gpu: true` in config for faster OCR
- **File Size Limits**: Adjust `max_file_size_mb` based on server resources
- **Caching**: Parser instance is cached as singleton for efficiency

## Security Considerations

- File size limits prevent DoS attacks
- Extension whitelist prevents arbitrary file execution
- Files are processed in memory, not saved to disk
- Temporary files (for OCR) are cleaned up automatically

## Troubleshooting

### PaddleOCR Version Compatibility

**Error**: `[Image file - OCR failed: Unknown argument: use_gpu]`

**Cause**: PaddleOCR 3.3.1+ removed the `use_gpu` parameter and changed how GPU acceleration is configured.

**Solution**: The file parser automatically detects and filters invalid parameters. If you see this error:

1. Update to the latest version of the code (commit with parameter validation)
2. The parser uses Python's `inspect` module to validate parameters before passing them to PaddleOCR
3. Invalid parameters are automatically skipped

**Manual Fix** (if needed):
- Remove or comment out `use_gpu` from `config.json` if you're manually editing
- Or set it to `null` to skip it

```json
{
  "ocr": {
    "paddleocr": {
      "use_angle_cls": true,
      "lang": "en",
      // "use_gpu": false,  // Commented out for 3.3.1+
      "show_log": false
    }
  }
}
```

### PaddleOCR Not Working

```bash
# Install with pip
pip install paddleocr

# Or install from source
pip install paddlepaddle
pip install paddleocr
```

### PDF Parsing Issues

```bash
# Install PyPDF2
pip install PyPDF2

# For better PDF support, consider:
pip install pdfplumber
```

### Memory Issues with Large Files

1. Reduce `max_file_size_mb` in config.json
2. Enable streaming for large files (future enhancement)
3. Increase server memory allocation

## Future Enhancements

Planned features for future updates:

- [ ] Streaming upload for large files
- [ ] Batch file processing
- [ ] More OCR backends (Tesseract, Cloud Vision API)
- [ ] Advanced PDF layout analysis
- [ ] Image preprocessing options
- [ ] Result caching
- [ ] Progress indicators for long operations
- [ ] File preview before upload
- [ ] Support for compressed archives (ZIP, RAR)

## Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run file upload tests only
pytest tests/test_file_parser.py tests/test_file_upload_api.py

# Run with coverage
pytest --cov=src/instructor_app/utils/file_parser tests/
```

## License

Same as the main project (MIT License).
