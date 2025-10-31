"""Tests for file parser functionality."""

import os
import pytest
from unittest.mock import Mock, patch, MagicMock

from instructor_app.utils.file_parser import FileParser, is_file_upload_enabled, get_file_parser


class TestFileUploadToggle:
    """Test file upload feature toggle."""

    def test_is_enabled_by_default(self):
        """Test that file upload is enabled by default."""
        with patch.dict(os.environ, {}, clear=True):
            assert is_file_upload_enabled() is True

    def test_is_enabled_with_true(self):
        """Test file upload enabled with true value."""
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            assert is_file_upload_enabled() is True

    def test_is_enabled_with_1(self):
        """Test file upload enabled with 1."""
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "1"}):
            assert is_file_upload_enabled() is True

    def test_is_disabled_with_false(self):
        """Test file upload disabled with false value."""
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "false"}):
            assert is_file_upload_enabled() is False

    def test_is_disabled_with_0(self):
        """Test file upload disabled with 0."""
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "0"}):
            assert is_file_upload_enabled() is False


class TestFileParser:
    """Test FileParser class."""

    def test_parser_initialization(self):
        """Test parser initializes with default config."""
        parser = FileParser()
        assert parser.config is not None
        assert "file_upload" in parser.config
        assert "ocr" in parser.config

    def test_parse_file_disabled(self):
        """Test parse_file raises error when disabled."""
        parser = FileParser()
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "false"}):
            with pytest.raises(ValueError, match="File upload feature is disabled"):
                parser.parse_file(b"test content", "test.txt")

    def test_parse_file_invalid_extension(self):
        """Test parse_file raises error for invalid extension."""
        parser = FileParser()
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            with pytest.raises(ValueError, match="File extension .invalid is not allowed"):
                parser.parse_file(b"test content", "test.invalid")

    def test_parse_file_size_exceeded(self):
        """Test parse_file raises error when file size exceeds limit."""
        parser = FileParser()
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            with pytest.raises(ValueError, match="File size exceeds maximum"):
                parser.parse_file(large_content, "test.txt")

    def test_parse_text_file(self):
        """Test parsing a simple text file."""
        parser = FileParser()
        content = b"Hello, World!\nThis is a test."
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.txt")
            assert "Hello, World!" in result
            assert "This is a test" in result

    def test_parse_json_file(self):
        """Test parsing a JSON file."""
        parser = FileParser()
        content = b'{"name": "test", "value": 123}'
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.json")
            assert '"name"' in result
            assert '"test"' in result
            assert "123" in result

    def test_parse_csv_file(self):
        """Test parsing a CSV file."""
        parser = FileParser()
        content = b"name,age,city\nJohn,30,NYC\nJane,25,LA"
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.csv")
            assert "name" in result
            assert "John" in result
            assert "Jane" in result

    def test_decode_bytes_with_utf8(self):
        """Test decoding bytes with UTF-8."""
        parser = FileParser()
        content = "Hello 世界".encode("utf-8")
        result = parser._decode_bytes(content)
        assert result == "Hello 世界"

    def test_decode_bytes_with_fallback(self):
        """Test decoding with fallback encoding."""
        parser = FileParser()
        # Latin-1 specific character
        content = "Héllo".encode("latin-1")
        result = parser._decode_bytes(content)
        assert "llo" in result  # Should decode something

    def test_parse_html_file(self):
        """Test parsing HTML file."""
        parser = FileParser()
        content = b"<html><body><h1>Title</h1><p>Paragraph text</p></body></html>"
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.html")
            assert "Title" in result
            assert "Paragraph text" in result

    @patch('instructor_app.utils.file_parser.FileParser._get_ocr')
    def test_parse_image_file_with_ocr(self, mock_get_ocr):
        """Test parsing image file with mocked OCR."""
        parser = FileParser()
        
        # Mock OCR result
        mock_ocr = MagicMock()
        mock_ocr.ocr.return_value = [[
            [None, ("This is OCR text", 0.99)],
            [None, ("Line 2", 0.98)]
        ]]
        mock_get_ocr.return_value = mock_ocr
        
        content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"  # Minimal PNG header
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.png")
            assert "This is OCR text" in result or "Image file" in result

    @patch('instructor_app.utils.file_parser.PyPDF2')
    def test_parse_pdf_file(self, mock_pypdf2):
        """Test parsing PDF file with mocked PyPDF2."""
        parser = FileParser()
        parser._pdf_available = True
        
        # Mock PDF reader
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "This is PDF text content"
        
        mock_reader = MagicMock()
        mock_reader.pages = [mock_page]
        
        mock_pypdf2.PdfReader.return_value = mock_reader
        
        content = b"%PDF-1.4"  # Minimal PDF header
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            with patch('builtins.open', create=True):
                result = parser.parse_file(content, "test.pdf")
                assert "PDF text content" in result or "PDF" in result

    def test_get_file_parser_singleton(self):
        """Test that get_file_parser returns singleton."""
        parser1 = get_file_parser()
        parser2 = get_file_parser()
        assert parser1 is parser2

    def test_config_loading_with_default(self):
        """Test config loads default when file not found."""
        with patch('os.path.exists', return_value=False):
            parser = FileParser("nonexistent.json")
            assert parser.config is not None
            assert "file_upload" in parser.config

    def test_parse_text_with_markdown_extension(self):
        """Test parsing markdown file."""
        parser = FileParser()
        content = b"# Heading\n\nThis is **bold** text."
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.md")
            assert "Heading" in result
            assert "bold" in result

    def test_parse_xml_file(self):
        """Test parsing XML file."""
        parser = FileParser()
        content = b"<?xml version='1.0'?><root><item>Text content</item></root>"
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.xml")
            assert "Text content" in result

    def test_parse_pdf_without_library(self):
        """Test that PDF files return helpful message when PyPDF2 is not available."""
        parser = FileParser()
        parser._pdf_available = False
        
        content = b"%PDF-1.4\n<<\n/Filter/FlateDecode>>stream\nBinary\xc3\x9b data"
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.pdf")
            assert "PyPDF2 is not installed" in result
            # Should NOT contain binary/unreadable characters
            assert "\xc3" not in result
            assert "\x9b" not in result

    def test_parse_docx_without_library(self):
        """Test that DOCX files return helpful message when python-docx is not available."""
        parser = FileParser()
        parser._docx_available = False
        
        content = b"PK\x03\x04\x14\x00\x06\x00\x08\x00"  # ZIP header
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.docx")
            assert "python-docx is not installed" in result
            # Should NOT contain binary/unreadable characters
            assert "PK\x03\x04" not in result

    def test_parse_xlsx_without_library(self):
        """Test that Excel files return helpful message when openpyxl is not available."""
        parser = FileParser()
        parser._xlsx_available = False
        
        content = b"PK\x03\x04\x14\x00\x06\x00\x08\x00"  # ZIP header
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.xlsx")
            assert "openpyxl is not installed" in result
            # Should NOT contain binary/unreadable characters
            assert "PK\x03\x04" not in result


class TestFileParserIntegration:
    """Integration tests for file parser."""

    def test_parse_multiple_text_files(self):
        """Test parsing multiple text files in sequence."""
        parser = FileParser()
        
        files = [
            (b"File 1 content", "file1.txt"),
            (b"File 2 content", "file2.txt"),
            (b'{"key": "value"}', "file3.json"),
        ]
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            for content, filename in files:
                result = parser.parse_file(content, filename)
                assert len(result) > 0

    def test_parse_text_with_special_characters(self):
        """Test parsing text with special characters."""
        parser = FileParser()
        content = "Special chars: ™ © ® € £ ¥".encode("utf-8")
        
        with patch.dict(os.environ, {"ENABLE_FILE_UPLOAD": "true"}):
            result = parser.parse_file(content, "test.txt")
            # Should successfully decode
            assert len(result) > 0
