import os
import tempfile
from typing import Tuple
from pathlib import Path

from r2_storage import download_file, upload_file, head_object


def get_temp_dir() -> str:
    """Get temporary directory for processing files."""
    temp_dir = os.getenv("TEMP_DIR", tempfile.gettempdir())
    os.makedirs(temp_dir, exist_ok=True)
    return temp_dir


def download_input_file(input_key: str, job_id: str) -> Tuple[str, str]:
    """
    Download input file from R2 to temporary location.
    
    Returns:
        Tuple of (local_path, mime_type)
    """
    temp_dir = get_temp_dir()
    input_ext = Path(input_key).suffix or ".tmp"
    local_path = os.path.join(temp_dir, f"{job_id}_input{input_ext}")
    
    download_file(input_key, local_path)
    
    _, mime_type = head_object(input_key)
    
    return local_path, mime_type or "application/octet-stream"


def upload_output_file(
    local_path: str,
    org_id: str,
    job_id: str,
    mime_type: str,
    output_extension: str = None,
) -> Tuple[str, int]:
    """
    Upload processed file to R2.
    
    Returns:
        Tuple of (output_key, size_bytes)
    """
    if output_extension is None:
        output_extension = Path(local_path).suffix or ".tmp"
    
    output_key = f"outputs/{org_id}/{job_id}/output{output_extension}"
    
    upload_file(local_path, output_key, content_type=mime_type)
    
    size_bytes, _ = head_object(output_key)
    
    return output_key, size_bytes


def cleanup_temp_files(*file_paths: str) -> None:
    """Remove temporary files."""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass

