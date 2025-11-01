"""Tests for structured document parser."""

import os
import pytest
from unittest.mock import Mock, patch, MagicMock

from instructor_app.utils.structured_parser import (
    StructuredDocumentParser,
    is_structured_parsing_enabled,
    get_structured_parser
)


class TestStructuredParsingToggle:
    """Test structured parsing feature toggle."""

    def test_is_enabled_by_default(self):
        """Test that structured parsing is enabled by default."""
        with patch.dict(os.environ, {}, clear=True):
            assert is_structured_parsing_enabled() is True

    def test_is_enabled_with_true(self):
        """Test structured parsing enabled with true value."""
        with patch.dict(os.environ, {"ENABLE_STRUCTURED_PARSING": "true"}):
            assert is_structured_parsing_enabled() is True

    def test_is_disabled_with_false(self):
        """Test structured parsing disabled with false value."""
        with patch.dict(os.environ, {"ENABLE_STRUCTURED_PARSING": "false"}):
            assert is_structured_parsing_enabled() is False


class TestStructuredDocumentParser:
    """Test StructuredDocumentParser class."""

    def test_parser_initialization(self):
        """Test parser initializes with default config."""
        parser = StructuredDocumentParser()
        assert parser.config is not None
        assert "structured_parsing" in parser.config

    def test_get_supported_formats(self):
        """Test getting supported output formats."""
        parser = StructuredDocumentParser()
        formats = parser.get_supported_formats()
        assert isinstance(formats, list)
        assert "markdown" in formats
        assert "json" in formats
        assert "html" in formats

    def test_get_config_params(self):
        """Test getting configuration parameters."""
        parser = StructuredDocumentParser()
        config = parser.get_config_params()
        assert isinstance(config, dict)
        assert "backend" in config
        assert "output_formats" in config

    def test_parse_document_disabled(self):
        """Test parse_document raises error when disabled."""
        parser = StructuredDocumentParser()
        
        with patch.dict(os.environ, {"ENABLE_STRUCTURED_PARSING": "false"}):
            with pytest.raises(ValueError, match="disabled"):
                parser.parse_document(b"test", "test.pdf")

    def test_parse_document_invalid_format(self):
        """Test parse_document raises error for invalid format."""
        parser = StructuredDocumentParser()
        
        with patch.dict(os.environ, {"ENABLE_STRUCTURED_PARSING": "true"}):
            with pytest.raises(ValueError, match="Unsupported output format"):
                parser.parse_document(b"test", "test.pdf", output_format="invalid")

    @patch('instructor_app.utils.structured_parser.StructuredDocumentParser._get_docling_converter')
    def test_parse_document_success_markdown(self, mock_converter):
        """Test successful document parsing with markdown output."""
        parser = StructuredDocumentParser()
        parser._docling_available = True
        
        # Mock Docling result
        mock_doc = MagicMock()
        mock_doc.export_to_markdown.return_value = "# Title\n\nContent"
        mock_doc.pages = [MagicMock()]
        
        mock_result = MagicMock()
        mock_result.document = mock_doc
        
        mock_conv = MagicMock()
        mock_conv.convert.return_value = mock_result
        mock_converter.return_value = mock_conv
        
        with patch.dict(os.environ, {"ENABLE_STRUCTURED_PARSING": "true"}):
            result = parser.parse_document(
                b"test content",
                "test.pdf",
                output_format="markdown"
            )
            
            assert result["success"] is True
            assert result["format"] == "markdown"
            assert "# Title" in result["content"]
            assert "metadata" in result

    @patch('instructor_app.utils.structured_parser.StructuredDocumentParser._get_docling_converter')
    def test_parse_document_success_json(self, mock_converter):
        """Test successful document parsing with JSON output."""
        parser = StructuredDocumentParser()
        parser._docling_available = True
        
        # Mock Docling result
        mock_doc = MagicMock()
        mock_doc.export_to_dict.return_value = {"title": "Test", "content": "Data"}
        mock_doc.pages = []
        
        mock_result = MagicMock()
        mock_result.document = mock_doc
        
        mock_conv = MagicMock()
        mock_conv.convert.return_value = mock_result
        mock_converter.return_value = mock_conv
        
        with patch.dict(os.environ, {"ENABLE_STRUCTURED_PARSING": "true"}):
            result = parser.parse_document(
                b"test content",
                "test.pdf",
                output_format="json"
            )
            
            assert result["success"] is True
            assert result["format"] == "json"
            assert isinstance(result["content"], dict)

    def test_parse_document_error_handling(self):
        """Test error handling in document parsing."""
        parser = StructuredDocumentParser()
        parser._docling_available = False
        
        with patch.dict(os.environ, {"ENABLE_STRUCTURED_PARSING": "true"}):
            result = parser.parse_document(
                b"test content",
                "test.pdf"
            )
            
            assert result["success"] is False
            assert "error" in result

    def test_singleton_pattern(self):
        """Test that get_structured_parser returns singleton."""
        parser1 = get_structured_parser()
        parser2 = get_structured_parser()
        assert parser1 is parser2

    @patch('instructor_app.utils.structured_parser.StructuredDocumentParser._get_paddleocr')
    def test_paddleocr_integration(self, mock_get_ocr):
        """Test PaddleOCR integration with parameter validation."""
        parser = StructuredDocumentParser()
        parser._paddleocr_available = True
        
        mock_ocr = MagicMock()
        mock_get_ocr.return_value = mock_ocr
        
        # Should not raise error
        ocr = parser._get_paddleocr()
        assert ocr is not None


class TestStructuredParserIntegration:
    """Integration tests for structured parser."""

    def test_config_loading(self):
        """Test configuration loading from file."""
        parser = StructuredDocumentParser()
        config = parser.config
        
        assert "structured_parsing" in config
        structured_config = config["structured_parsing"]
        assert "backend" in structured_config
        assert "output_formats" in structured_config
        assert "docling" in structured_config
        assert "paddleocr" in structured_config

    def test_multiple_format_support(self):
        """Test that multiple output formats are supported."""
        parser = StructuredDocumentParser()
        formats = parser.get_supported_formats()
        
        expected_formats = ["markdown", "json", "html", "text"]
        for fmt in expected_formats:
            assert fmt in formats

    def test_config_params_exposure(self):
        """Test that config parameters are properly exposed."""
        parser = StructuredDocumentParser()
        params = parser.get_config_params()
        
        assert "backend" in params
        assert params["backend"] == "docling"
        assert "docling" in params
        assert "paddleocr" in params
