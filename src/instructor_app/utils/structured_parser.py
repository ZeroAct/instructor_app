"""Structured document parser with Docling and PaddleOCR integration."""

import io
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import inspect

# Optional imports for PaddleOCR integration
try:
    import numpy as np
    from PIL import Image
    _IMAGING_AVAILABLE = True
except ImportError:
    _IMAGING_AVAILABLE = False
    np = None
    Image = None


def is_structured_parsing_enabled() -> bool:
    """Check if structured parsing feature is enabled via environment variable."""
    return os.getenv("ENABLE_STRUCTURED_PARSING", "true").lower() in ("true", "1", "yes")


class PaddleOCRAdapter:
    """Adapter to integrate PaddleOCR with Docling's OCR interface."""
    
    def __init__(self, paddleocr_instance):
        """Initialize adapter with PaddleOCR instance."""
        if not _IMAGING_AVAILABLE:
            raise ImportError(
                "numpy and Pillow are required for PaddleOCR integration. "
                "Install with: pip install numpy Pillow"
            )
        self.ocr = paddleocr_instance
        self._call_count = 0
    
    def __call__(self, image) -> List[Tuple[List[List[float]], Tuple[str, float]]]:
        """
        Perform OCR on image using PaddleOCR.
        
        Args:
            image: PIL Image object
            
        Returns:
            List of detection results in Docling-compatible format
        """
        self._call_count += 1
        
        try:
            # Convert PIL Image to numpy array for PaddleOCR
            img_array = np.array(image)
            
            # Perform OCR
            result = self.ocr.ocr(img_array, cls=True)
            
            # Debug logging
            if result and result[0]:
                text_count = len(result[0])
                print(f"[PaddleOCRAdapter] Call #{self._call_count}: Extracted {text_count} text regions from image {image.size}")
            else:
                print(f"[PaddleOCRAdapter] Call #{self._call_count}: No text detected in image {image.size}")
            
            # Transform PaddleOCR output to Docling-compatible format
            # PaddleOCR format: [[[box], (text, confidence)], ...]
            # Return format expected by Docling
            if result and result[0]:
                return result[0]
            return []
        except Exception as e:
            print(f"[PaddleOCRAdapter] Error during OCR: {e}")
            return []


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
        """Lazy load Docling converter with PaddleOCR integration."""
        if self._docling_converter is None:
            if not self._docling_available:
                raise ImportError(
                    "Docling is not installed. Install it with: pip install docling"
                )
            
            try:
                from docling.document_converter import DocumentConverter
                from docling.datamodel.base_models import InputFormat
                from docling.datamodel.pipeline_options import PdfPipelineOptions, OcrOptions
                # Backend import can vary across docling versions; try best-effort
                PyPdfiumDocumentBackend = None
                try:
                    from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend as _PdfiumBackend
                    PyPdfiumDocumentBackend = _PdfiumBackend
                except Exception:
                    try:
                        # Older or alternative path
                        from docling.backend.pdf_backend import PyPdfiumDocumentBackend as _PdfiumBackend  # type: ignore
                        PyPdfiumDocumentBackend = _PdfiumBackend
                    except Exception:
                        # If we can't import a backend explicitly, we'll rely on docling defaults
                        PyPdfiumDocumentBackend = None
                
                docling_config = self.config.get("structured_parsing", {}).get("docling", {})
                pipeline_opts = docling_config.get("pipeline_options", {})
                
                # Configure pipeline options
                pipeline_kwargs = {
                    "do_ocr": docling_config.get("do_ocr", True),
                    "do_table_structure": pipeline_opts.get("do_table_structure", True),
                }
                
                # Integrate PaddleOCR as OCR engine if configured
                ocr_enabled = docling_config.get("do_ocr", True)
                use_paddleocr = docling_config.get("ocr_engine") == "paddleocr" and self._paddleocr_available
                
                if ocr_enabled:
                    print(f"[StructuredParser] OCR enabled. Using PaddleOCR: {use_paddleocr}")
                
                if ocr_enabled and use_paddleocr:
                    try:
                        # Get PaddleOCR instance
                        ocr_instance = self._get_paddleocr()
                        print(f"[StructuredParser] PaddleOCR instance initialized")
                        
                        # Create PaddleOCR adapter for Docling
                        paddleocr_adapter = PaddleOCRAdapter(ocr_instance)
                        
                        # Configure OCR options with PaddleOCR
                        try:
                            from docling.datamodel.pipeline_options import OcrKind
                            
                            ocr_options = OcrOptions(
                                kind=OcrKind.CUSTOM,
                                custom_ocr_engine=paddleocr_adapter,
                            )
                            pipeline_kwargs["ocr_options"] = ocr_options
                            print(f"[StructuredParser] PaddleOCR adapter configured with OcrKind.CUSTOM")
                        except ImportError:
                            # Older Docling version - try alternative method
                            # Pass custom OCR engine directly if supported
                            pipeline_kwargs["ocr_engine"] = paddleocr_adapter
                            print(f"[StructuredParser] PaddleOCR adapter configured via ocr_engine parameter")
                            
                    except Exception as e:
                        # Fall back to default OCR if PaddleOCR integration fails
                        print(f"[StructuredParser] Warning: PaddleOCR integration failed, using default OCR: {e}")
                
                pipeline_options = PdfPipelineOptions(**pipeline_kwargs)

                # Build kwargs for DocumentConverter, guarding against API differences
                import inspect as _inspect
                dc_sig_params = set(_inspect.signature(DocumentConverter.__init__).parameters.keys())

                dc_kwargs = {}

                # allowed_formats
                if 'allowed_formats' in dc_sig_params:
                    dc_kwargs['allowed_formats'] = [
                        InputFormat.PDF,
                        InputFormat.IMAGE,
                        InputFormat.DOCX,
                        InputFormat.HTML,
                        InputFormat.PPTX,
                    ]

                # pipeline_options
                if 'pipeline_options' in dc_sig_params:
                    dc_kwargs['pipeline_options'] = pipeline_options

                # Backend parameter name varies by version; add only if backend import succeeded
                if PyPdfiumDocumentBackend is not None:
                    for candidate in ('pdf_backend', 'document_backend', 'backend', 'pdf_backend_class'):
                        if candidate in dc_sig_params:
                            dc_kwargs[candidate] = PyPdfiumDocumentBackend
                            break

                self._docling_converter = DocumentConverter(**dc_kwargs)
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
            **options: Additional parsing options (do_ocr, extract_tables, preserve_hierarchy)
            
        Returns:
            Dictionary with structured content and metadata
        """
        if not is_structured_parsing_enabled():
            raise ValueError("Structured parsing feature is disabled")
        
        # Log parsing request
        print(f"\n[StructuredParser] Parsing document: {filename}")
        print(f"[StructuredParser] Output format: {output_format}")
        print(f"[StructuredParser] Options: {options}")
        
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
        
        print(f"[StructuredParser] Temporary file created: {tmp_path}")
        
        try:
            # Convert document
            print(f"[StructuredParser] Starting document conversion...")
            result = converter.convert(tmp_path)
            print(f"[StructuredParser] Document conversion complete")
            
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
            
            print(f"[StructuredParser] Content exported to {output_format}")
            print(f"[StructuredParser] Content length: {len(str(formatted_content))}")
            
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
            print(f"[StructuredParser] Error during parsing: {e}")
            import traceback
            traceback.print_exc()
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
                    print(f"[StructuredParser] Cleaned up temporary file")
            except Exception:
                pass

    def parse_document_only(
        self,
        content: bytes,
        filename: str,
        **options
    ) -> Tuple[Any, Dict[str, Any]]:
        """
        Parse document and return the raw Docling document object for caching.
        This allows later export to any format without re-parsing.
        
        Args:
            content: Binary content of the file
            filename: Name of the file
            **options: Additional parsing options (do_ocr, extract_tables, preserve_hierarchy)
            
        Returns:
            Tuple of (parsed_document, metadata)
        """
        if not is_structured_parsing_enabled():
            raise ValueError("Structured parsing feature is disabled")
        
        print(f"\n[StructuredParser] Parsing document: {filename}")
        print(f"[StructuredParser] Options: {options}")
        
        # Get converter
        converter = self._get_docling_converter()
        
        # Save content to temporary file for Docling
        import tempfile
        ext = Path(filename).suffix.lower()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        print(f"[StructuredParser] Temporary file created: {tmp_path}")
        
        try:
            # Convert document
            print(f"[StructuredParser] Starting document conversion...")
            result = converter.convert(tmp_path)
            print(f"[StructuredParser] Document conversion complete")
            
            # Extract metadata
            metadata = {
                "filename": filename,
                "page_count": len(result.document.pages) if hasattr(result.document, 'pages') else None,
                "has_tables": self._has_tables(result.document),
                "structure_preserved": True,
            }
            
            return result.document, metadata
            
        finally:
            # Clean up temp file
            try:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                    print(f"[StructuredParser] Cleaned up temporary file")
            except Exception:
                pass
    
    def export_document(
        self,
        document: Any,
        output_format: str = "markdown"
    ) -> str:
        """
        Export a parsed Docling document to the specified format.
        
        Args:
            document: Parsed Docling document object
            output_format: Output format (markdown, json, html, text)
            
        Returns:
            Formatted content as string
        """
        print(f"[StructuredParser] Exporting to {output_format}...")
        
        # Validate output format
        supported_formats = self.config.get("structured_parsing", {}).get(
            "output_formats", ["markdown", "json", "html", "text"]
        )
        if output_format not in supported_formats:
            raise ValueError(
                f"Unsupported output format: {output_format}. "
                f"Supported: {', '.join(supported_formats)}"
            )
        
        # Extract structured content based on format
        if output_format == "markdown":
            formatted_content = document.export_to_markdown()
        elif output_format == "json":
            formatted_content = document.export_to_dict()
        elif output_format == "html":
            formatted_content = document.export_to_html()
        elif output_format == "text":
            formatted_content = document.export_to_text()
        else:
            formatted_content = document.export_to_markdown()
        
        print(f"[StructuredParser] Export complete. Content length: {len(str(formatted_content))}")
        
        return formatted_content
    
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
