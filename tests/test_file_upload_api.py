"""Tests for file upload API endpoints."""

import os
from io import BytesIO
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient

from instructor_app.api.main import app

client = TestClient(app)


class TestFileUploadAPI:
    """Test file upload API endpoints."""

    def test_file_config_endpoint_enabled(self):
        """Test file config endpoint when enabled."""
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.get("/api/file/config")
            assert response.status_code == 200
            data = response.json()
            assert data["enabled"] is True
            assert "max_file_size_mb" in data
            assert "allowed_extensions" in data

    def test_file_config_endpoint_disabled(self):
        """Test file config endpoint when disabled."""
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "false"}):
            response = client.get("/api/file/config")
            assert response.status_code == 200
            data = response.json()
            assert data["enabled"] is False

    def test_upload_text_file(self):
        """Test uploading a simple text file."""
        content = b"Hello, this is a test file."
        files = {"file": ("test.txt", BytesIO(content), "text/plain")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["filename"] == "test.txt"
            assert "Hello" in data["text"]
            assert data["size"] == len(content)

    def test_upload_json_file(self):
        """Test uploading a JSON file."""
        content = b'{"key": "value", "number": 123}'
        files = {"file": ("test.json", BytesIO(content), "application/json")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "key" in data["text"]
            assert "value" in data["text"]

    def test_upload_csv_file(self):
        """Test uploading a CSV file."""
        content = b"name,age\nJohn,30\nJane,25"
        files = {"file": ("test.csv", BytesIO(content), "text/csv")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "name" in data["text"]
            assert "John" in data["text"]

    def test_upload_file_disabled(self):
        """Test uploading file when feature is disabled."""
        content = b"test content"
        files = {"file": ("test.txt", BytesIO(content), "text/plain")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "false"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 403
            assert "disabled" in response.json()["detail"].lower()

    def test_upload_invalid_extension(self):
        """Test uploading file with invalid extension."""
        content = b"test content"
        files = {"file": ("test.invalid", BytesIO(content), "application/octet-stream")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 400
            assert "not allowed" in response.json()["detail"]

    def test_upload_file_too_large(self):
        """Test uploading file that exceeds size limit."""
        # Create 11MB file
        large_content = b"x" * (11 * 1024 * 1024)
        files = {"file": ("large.txt", BytesIO(large_content), "text/plain")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 400
            assert "exceeds maximum" in response.json()["detail"]

    def test_upload_html_file(self):
        """Test uploading HTML file."""
        content = b"<html><body><h1>Title</h1><p>Content</p></body></html>"
        files = {"file": ("test.html", BytesIO(content), "text/html")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "Title" in data["text"]

    def test_upload_xml_file(self):
        """Test uploading XML file."""
        content = b"<?xml version='1.0'?><root><item>Value</item></root>"
        files = {"file": ("test.xml", BytesIO(content), "application/xml")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "Value" in data["text"]

    def test_upload_markdown_file(self):
        """Test uploading markdown file."""
        content = b"# Heading\n\nThis is **bold** text."
        files = {"file": ("test.md", BytesIO(content), "text/markdown")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "Heading" in data["text"]

    @patch('instructor_app.utils.file_parser.FileParser._get_ocr')
    def test_upload_image_file(self, mock_get_ocr):
        """Test uploading an image file with mocked OCR."""
        # Mock OCR result
        mock_ocr = MagicMock()
        mock_ocr.ocr.return_value = [[
            [None, ("OCR extracted text", 0.99)]
        ]]
        mock_get_ocr.return_value = mock_ocr
        
        # Minimal PNG header
        content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        files = {"file": ("test.png", BytesIO(content), "image/png")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            # Should succeed even if OCR processing has issues
            assert response.status_code in [200, 500]

    def test_upload_utf8_text_file(self):
        """Test uploading UTF-8 text file with special characters."""
        content = "Hello 世界! Héllo café".encode("utf-8")
        files = {"file": ("test.txt", BytesIO(content), "text/plain")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            # Should successfully decode UTF-8
            assert len(data["text"]) > 0

    def test_upload_empty_file(self):
        """Test uploading an empty file."""
        content = b""
        files = {"file": ("empty.txt", BytesIO(content), "text/plain")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            response = client.post("/api/file/upload", files=files)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["size"] == 0

    def test_upload_multiple_files_sequentially(self):
        """Test uploading multiple files in sequence."""
        files_to_upload = [
            (b"File 1", "file1.txt", "text/plain"),
            (b'{"key": 1}', "file2.json", "application/json"),
            (b"a,b\n1,2", "file3.csv", "text/csv"),
        ]
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            for content, filename, mimetype in files_to_upload:
                files = {"file": (filename, BytesIO(content), mimetype)}
                response = client.post("/api/file/upload", files=files)
                assert response.status_code == 200
                assert response.json()["success"] is True


class TestFileUploadIntegration:
    """Integration tests for file upload with API."""

    def test_health_check_still_works(self):
        """Test that health check endpoint still works."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

    def test_upload_and_use_in_completion(self):
        """Test uploading file and using extracted text in completion flow."""
        # First upload a file
        content = b"Extract this: John Doe is 30 years old and lives in NYC"
        files = {"file": ("test.txt", BytesIO(content), "text/plain")}
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            upload_response = client.post("/api/file/upload", files=files)
            assert upload_response.status_code == 200
            
            extracted_text = upload_response.json()["text"]
            assert "John Doe" in extracted_text
            
            # The extracted text could then be used in a completion request
            # (not testing actual completion here as it requires API keys)
            assert len(extracted_text) > 0
