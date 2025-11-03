"""File storage service for managing uploaded files."""

import os
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Dict, Optional


@dataclass
class StoredFile:
    """Stored file metadata."""
    file_id: str
    filename: str
    filepath: Path
    size: int
    uploaded_at: float
    
    def is_expired(self, ttl: int) -> bool:
        """Check if file has expired."""
        return time.time() - self.uploaded_at > ttl
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "file_id": self.file_id,
            "filename": self.filename,
            "size": self.size,
            "uploaded_at": self.uploaded_at,
            "age_seconds": int(time.time() - self.uploaded_at),
        }


class FileStorageService:
    """Service for managing temporary file storage."""
    
    def __init__(self, temp_dir: str = "/tmp/instructor_uploads", ttl_seconds: int = 600):
        """
        Initialize file storage service.
        
        Args:
            temp_dir: Directory for temporary file storage
            ttl_seconds: Time-to-live for files in seconds (default: 10 minutes)
        """
        self.temp_dir = Path(temp_dir)
        self.ttl_seconds = ttl_seconds
        self.files: Dict[str, StoredFile] = {}
        self._lock = Lock()
        
        # Create temp directory if it doesn't exist
        self.temp_dir.mkdir(parents=True, exist_ok=True)
    
    def store(self, content: bytes, filename: str) -> str:
        """
        Store uploaded file and return file_id.
        
        Args:
            content: File content as bytes
            filename: Original filename
            
        Returns:
            file_id: Unique identifier for the stored file
        """
        file_id = str(uuid.uuid4())
        
        # Generate safe filepath
        suffix = Path(filename).suffix if filename else ""
        filepath = self.temp_dir / f"{file_id}{suffix}"
        
        # Write file
        with open(filepath, 'wb') as f:
            f.write(content)
        
        # Store metadata
        stored_file = StoredFile(
            file_id=file_id,
            filename=filename,
            filepath=filepath,
            size=len(content),
            uploaded_at=time.time()
        )
        
        with self._lock:
            self.files[file_id] = stored_file
        
        # Cleanup expired files
        self._cleanup_expired()
        
        return file_id
    
    def get(self, file_id: str) -> Optional[StoredFile]:
        """
        Get stored file metadata.
        
        Args:
            file_id: File identifier
            
        Returns:
            StoredFile if found and not expired, None otherwise
        """
        with self._lock:
            stored_file = self.files.get(file_id)
            
            if stored_file is None:
                return None
            
            if stored_file.is_expired(self.ttl_seconds):
                # File expired, remove it
                self._remove_file(file_id)
                return None
            
            return stored_file
    
    def read(self, file_id: str) -> Optional[bytes]:
        """
        Read file content.
        
        Args:
            file_id: File identifier
            
        Returns:
            File content as bytes if found, None otherwise
        """
        stored_file = self.get(file_id)
        if stored_file is None:
            return None
        
        try:
            with open(stored_file.filepath, 'rb') as f:
                return f.read()
        except FileNotFoundError:
            # File was deleted externally
            with self._lock:
                self.files.pop(file_id, None)
            return None
    
    def delete(self, file_id: str) -> bool:
        """
        Delete stored file.
        
        Args:
            file_id: File identifier
            
        Returns:
            True if deleted, False if not found
        """
        with self._lock:
            return self._remove_file(file_id)
    
    def _remove_file(self, file_id: str) -> bool:
        """Remove file (internal, assumes lock is held)."""
        stored_file = self.files.pop(file_id, None)
        if stored_file is None:
            return False
        
        # Delete physical file
        try:
            stored_file.filepath.unlink(missing_ok=True)
        except Exception:
            pass  # Ignore deletion errors
        
        return True
    
    def _cleanup_expired(self):
        """Remove expired files."""
        with self._lock:
            expired_ids = [
                file_id for file_id, stored_file in self.files.items()
                if stored_file.is_expired(self.ttl_seconds)
            ]
            
            for file_id in expired_ids:
                self._remove_file(file_id)
    
    def get_stats(self) -> dict:
        """Get storage statistics."""
        with self._lock:
            self._cleanup_expired()
            return {
                "total_files": len(self.files),
                "temp_dir": str(self.temp_dir),
                "ttl_seconds": self.ttl_seconds,
                "files": [f.to_dict() for f in self.files.values()]
            }


# Global file storage instance
_file_storage: Optional[FileStorageService] = None


def get_file_storage() -> FileStorageService:
    """Get or create global file storage instance."""
    global _file_storage
    if _file_storage is None:
        # Get config from file_parser config if available
        try:
            from instructor_app.utils.file_parser import get_file_parser
            parser = get_file_parser()
            config = parser.config.get("file_storage", {})
            temp_dir = config.get("temp_dir", "/tmp/instructor_uploads")
            ttl_seconds = config.get("ttl_seconds", 600)
        except Exception:
            temp_dir = "/tmp/instructor_uploads"
            ttl_seconds = 600
        
        _file_storage = FileStorageService(temp_dir=temp_dir, ttl_seconds=ttl_seconds)
    
    return _file_storage
