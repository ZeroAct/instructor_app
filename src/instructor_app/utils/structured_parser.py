"""Structured document parser with Docling and PaddleOCR integration."""

import io
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, List
import inspect


def is_structured_parsing_enabled() -> bool:
    """Check if structured parsing feature is enabled via environment variable."""
    return os.getenv("ENABLE_STRUCTURED_PARSING", "true").lower() in ("true", "1", "yes")


class StructuredDocumentParser:
    """Structured document parser with table and hierarchy preservation."""

    def __init__(self, config_path: str = "config.json"):
        """Initialize structured parser with configuration."""
        self.config = self._load_config(config_path)
        self._docling_converter = None
        self._paddleocr = None
        
        # Check available libraries
        self._docling_available = False
        self._paddleocr_available = False
        self._check_dependencies()

    def _load_config(self, config_path: str) -> dict:
        """Load configuration from JSON file."""
        possible_paths = [
            config_path,
            os.path.join(os.getcwd(), config_path),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", config_path),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, "r") as f:
                    return json.load(f)
        
        # Return default config if file not found
        return {
            "structured_parsing": {
                "enabled": True,
                "backend": "docling",
                "output_formats": ["markdown", "json", "html", "text"],
                "default_format": "markdown",
                "docling": {
                    "do_ocr": True,
                    "ocr_engine": "paddleocr",
                    "extract_tables": True,
                    "preserve_hierarchy": True,
                },
                "paddleocr": {
                    "use_angle_cls": True,
                    "lang": "en",
                    "show_log": False,
                }
            }
        }

    def _check_dependencies(self):
        """Check which optional dependencies are available."""
        try:
            import docling  # noqa
            self._docling_available = True
        except ImportError:
            pass
        
        try:
            from paddleocr import PaddleOCR  # noqa
            self._paddleocr_available = True
        except ImportError:
            pass

    def _get_paddleocr(self):
        """Lazy load PaddleOCR with dynamic parameter validation."""
        if self._paddleocr is None and self._paddleocr_available:
            try:
                from paddleocr import PaddleOCR
                
                ocr_config = self.config.get("structured_parsing", {}).get("paddleocr", {})
                
                # Get valid parameters for PaddleOCR.__init__
                sig = inspect.signature(PaddleOCR.__init__)
                valid_params = set(sig.parameters.keys()) - {'self'}
                
                # Build kwargs with only valid parameters
                kwargs = {}
                param_mapping = {
                    'use_angle_cls': ('use_angle_cls', True),
                    'lang': ('lang', 'en'),
                    'use_gpu': ('use_gpu', False),
                    'show_log': ('show_log', False),
                    'det_model_dir': ('det_model_dir', None),
                    'rec_model_dir': ('rec_model_dir', None),
                    'cls_model_dir': ('cls_model_dir', None),
                }
                
                for param_name, (config_key, default_value) in param_mapping.items():
                    if param_name in valid_params:
                        value = ocr_config.get(config_key, default_value)
                        if value is not None:
                            kwargs[param_name] = value
                
                self._paddleocr = PaddleOCR(**kwargs)
            except Exception as e:
                raise ImportError(f"Failed to initialize PaddleOCR: {str(e)}")
        
        return self._paddleocr

    def _get_docling_converter(self):
        """Lazy load Docling converter."""
        if self._docling_converter is None:
            if not self._docling_available:
                raise ImportError(
                    "Docling is not installed. Install it with: pip install docling"
                )
            
            try:
                from docling.document_converter import DocumentConverter
                from docling.datamodel.base_models import InputFormat
                from docling.datamodel.pipeline_options import PdfPipelineOptions
                from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
                
                docling_config = self.config.get("structured_parsing", {}).get("docling", {})
                pipeline_opts = docling_config.get("pipeline_options", {})
                
                # Configure pipeline options
                pipeline_options = PdfPipelineOptions(
                    do_ocr=docling_config.get("do_ocr", True),
                    do_table_structure=pipeline_opts.get("do_table_structure", True),
                )
                
                # If PaddleOCR is configured, set it as OCR engine
                if docling_config.get("ocr_engine") == "paddleocr" and self._paddleocr_available:
                    try:
                        # Get PaddleOCR instance
                        ocr_instance = self._get_paddleocr()
                        # Note: Docling's OCR integration might need adapter
                        # This is a placeholder for the integration
                    except Exception:
                        pass  # Fall back to default OCR
                
                self._docling_converter = DocumentConverter(
                    allowed_formats=[
                        InputFormat.PDF,
                        InputFormat.IMAGE,
                        InputFormat.DOCX,
                        InputFormat.HTML,
                        InputFormat.PPTX,
                    ],
                    pdf_backend=PyPdfiumDocumentBackend,
                    pipeline_options=pipeline_options,
                )
            except Exception as e:
                raise ImportError(f"Failed to initialize Docling: {str(e)}")
        
        return self._docling_converter

    def parse_document(
        self, 
        content: bytes, 
        filename: str, 
        output_format: str = "markdown",
        **options
    ) -> Dict[str, Any]:
        """
        Parse document with structure preservation.
        
        Args:
            content: Binary content of the file
            filename: Name of the file
            output_format: Output format (markdown, json, html, text)
            **options: Additional parsing options
            
        Returns:
            Dictionary with structured content and metadata
        """
        if not is_structured_parsing_enabled():
            raise ValueError("Structured parsing feature is disabled")
        
        # Validate output format
        supported_formats = self.config.get("structured_parsing", {}).get(
            "output_formats", ["markdown", "json", "html", "text"]
        )
        if output_format not in supported_formats:
            raise ValueError(
                f"Unsupported output format: {output_format}. "
                f"Supported: {', '.join(supported_formats)}"
            )
        
        # Get converter
        converter = self._get_docling_converter()
        
        # Save content to temporary file for Docling
        import tempfile
        ext = Path(filename).suffix.lower()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            # Convert document
            result = converter.convert(tmp_path)
            
            # Extract structured content based on format
            if output_format == "markdown":
                formatted_content = result.document.export_to_markdown()
            elif output_format == "json":
                formatted_content = result.document.export_to_dict()
            elif output_format == "html":
                formatted_content = result.document.export_to_html()
            elif output_format == "text":
                formatted_content = result.document.export_to_text()
            else:
                formatted_content = result.document.export_to_markdown()
            
            # Extract metadata
            metadata = {
                "filename": filename,
                "format": output_format,
                "page_count": len(result.document.pages) if hasattr(result.document, 'pages') else None,
                "has_tables": self._has_tables(result.document),
                "structure_preserved": True,
            }
            
            return {
                "success": True,
                "content": formatted_content,
                "metadata": metadata,
                "format": output_format,
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to parse document: {str(e)}",
                "format": output_format,
            }
        finally:
            # Clean up temp file
            try:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
            except Exception:
                pass

    def _has_tables(self, document) -> bool:
        """Check if document contains tables."""
        try:
            if hasattr(document, 'tables'):
                return len(document.tables) > 0
            # Alternative check through pages
            if hasattr(document, 'pages'):
                for page in document.pages:
                    if hasattr(page, 'tables') and page.tables:
                        return True
            return False
        except Exception:
            return False

    def get_supported_formats(self) -> List[str]:
        """Get list of supported output formats."""
        return self.config.get("structured_parsing", {}).get(
            "output_formats", ["markdown", "json", "html", "text"]
        )

    def get_config_params(self) -> Dict[str, Any]:
        """Get current configuration parameters."""
        return self.config.get("structured_parsing", {})


# Singleton instance
_parser_instance: Optional[StructuredDocumentParser] = None


def get_structured_parser() -> StructuredDocumentParser:
    """Get or create structured parser singleton."""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = StructuredDocumentParser()
    return _parser_instance
