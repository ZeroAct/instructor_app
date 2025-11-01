"""Document caching system for parsed documents."""

import time
import uuid
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from threading import Lock


@dataclass
class CachedDocument:
    """Represents a cached parsed document."""
    doc_id: str
    filename: str
    parsed_content: Any  # Docling Document object
    formats: Dict[str, str] = field(default_factory=dict)  # Pre-exported formats
    created_at: float = field(default_factory=time.time)
    last_accessed: float = field(default_factory=time.time)
    ttl_seconds: int = 600  # 10 minutes default
    
    def is_expired(self) -> bool:
        """Check if document has expired."""
        return time.time() - self.created_at > self.ttl_seconds
    
    def touch(self):
        """Update last accessed time."""
        self.last_accessed = time.time()
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "doc_id": self.doc_id,
            "filename": self.filename,
            "formats": self.formats,
            "created_at": self.created_at,
            "expires_at": self.created_at + self.ttl_seconds,
            "time_remaining": max(0, self.ttl_seconds - (time.time() - self.created_at))
        }


class DocumentCache:
    """LRU cache for parsed documents with TTL support."""
    
    def __init__(self, max_size: int = 100, default_ttl: int = 600):
        """
        Initialize document cache.
        
        Args:
            max_size: Maximum number of documents to cache
            default_ttl: Default time-to-live in seconds
        """
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: OrderedDict[str, CachedDocument] = OrderedDict()
        self._lock = Lock()
    
    def generate_doc_id(self) -> str:
        """Generate a unique document ID."""
        return str(uuid.uuid4())
    
    def store(
        self, 
        filename: str,
        parsed_content: Any,
        formats: Optional[Dict[str, str]] = None,
        ttl: Optional[int] = None,
        doc_id: Optional[str] = None
    ) -> str:
        """
        Store a parsed document in cache.
        
        Args:
            filename: Original filename
            parsed_content: Parsed document object
            formats: Pre-exported formats (optional)
            ttl: Custom TTL in seconds (optional)
            doc_id: Custom document ID (optional)
            
        Returns:
            Document ID
        """
        with self._lock:
            # Cleanup expired documents first
            self._cleanup_expired()
            
            # Generate or use provided doc_id
            if doc_id is None:
                doc_id = self.generate_doc_id()
            
            # Create cached document
            cached_doc = CachedDocument(
                doc_id=doc_id,
                filename=filename,
                parsed_content=parsed_content,
                formats=formats or {},
                ttl_seconds=ttl or self.default_ttl
            )
            
            # Add to cache (evict LRU if needed)
            if len(self._cache) >= self.max_size and doc_id not in self._cache:
                # Remove least recently used (first item)
                self._cache.popitem(last=False)
            
            self._cache[doc_id] = cached_doc
            # Move to end (most recently used)
            self._cache.move_to_end(doc_id)
            
            return doc_id
    
    def get(self, doc_id: str) -> Optional[CachedDocument]:
        """
        Retrieve a cached document.
        
        Args:
            doc_id: Document ID
            
        Returns:
            CachedDocument if found and not expired, None otherwise
        """
        with self._lock:
            if doc_id not in self._cache:
                return None
            
            cached_doc = self._cache[doc_id]
            
            # Check if expired
            if cached_doc.is_expired():
                del self._cache[doc_id]
                return None
            
            # Update access time and move to end (most recently used)
            cached_doc.touch()
            self._cache.move_to_end(doc_id)
            
            return cached_doc
    
    def exists(self, doc_id: str) -> bool:
        """Check if document exists in cache and is not expired."""
        return self.get(doc_id) is not None
    
    def delete(self, doc_id: str) -> bool:
        """
        Delete a document from cache.
        
        Args:
            doc_id: Document ID
            
        Returns:
            True if deleted, False if not found
        """
        with self._lock:
            if doc_id in self._cache:
                del self._cache[doc_id]
                return True
            return False
    
    def update_formats(self, doc_id: str, formats: Dict[str, str]) -> bool:
        """
        Update the formats for a cached document.
        
        Args:
            doc_id: Document ID
            formats: Dictionary of format name to content
            
        Returns:
            True if updated, False if not found
        """
        cached_doc = self.get(doc_id)
        if cached_doc:
            with self._lock:
                cached_doc.formats.update(formats)
                return True
        return False
    
    def _cleanup_expired(self):
        """Remove expired documents from cache (internal, assumes lock held)."""
        expired_ids = [
            doc_id 
            for doc_id, doc in self._cache.items() 
            if doc.is_expired()
        ]
        for doc_id in expired_ids:
            del self._cache[doc_id]
    
    def cleanup_expired(self):
        """Remove expired documents from cache (public method)."""
        with self._lock:
            self._cleanup_expired()
    
    def clear(self):
        """Clear all documents from cache."""
        with self._lock:
            self._cache.clear()
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        with self._lock:
            self._cleanup_expired()
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "default_ttl": self.default_ttl,
                "documents": [doc.to_dict() for doc in self._cache.values()]
            }


# Global cache instance
_document_cache: Optional[DocumentCache] = None


def get_document_cache() -> DocumentCache:
    """Get or create the global document cache instance."""
    global _document_cache
    if _document_cache is None:
        # Read config for cache settings
        import os
        max_size = int(os.getenv("DOCUMENT_CACHE_SIZE", "100"))
        default_ttl = int(os.getenv("DOCUMENT_CACHE_TTL", "600"))
        _document_cache = DocumentCache(max_size=max_size, default_ttl=default_ttl)
    return _document_cache
