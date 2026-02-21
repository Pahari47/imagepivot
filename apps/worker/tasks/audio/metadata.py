import os
import sys
from typing import Any, Dict, Optional
from pathlib import Path

print("[METADATA-MODULE] metadata.py module is being loaded/executed", flush=True)
sys.stdout.flush()
sys.stderr.flush()

from api_client import post_job_status
from services.file_handler import (
    download_input_file,
    upload_output_file,
    cleanup_temp_files,
    get_temp_dir,
)
from services.audio_processor import (
    edit_audio_metadata,
    get_extension_from_format,
    get_audio_format_from_mime,
)
from r2_storage import download_file, head_object

print("[METADATA-MODULE] All imports completed successfully", flush=True)
sys.stdout.flush()


def metadata_audio_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process audio metadata editing job.
    
    Expected params:
        - title: str (optional)
        - artist: str (optional)
        - album: str (optional)
        - year: int (optional, 1900-2100)
        - genre: str (optional)
        - trackNumber: int (optional, >= 1)
        - coverArt: str (optional, R2 file key for cover art image)
    """
    sys.stdout.write("[METADATA] >>>>> FUNCTION ENTRY - metadata_audio_task CALLED <<<<<\n")
    sys.stdout.flush()
    sys.stderr.write("[METADATA] >>>>> FUNCTION ENTRY - metadata_audio_task CALLED <<<<<\n")
    sys.stderr.flush()
    print("[METADATA] >>>>> FUNCTION ENTRY - metadata_audio_task CALLED <<<<<", flush=True)
    
    job_id = payload.get("jobId")
    org_id = payload.get("orgId")
    input_obj = payload.get("input", {})
    input_key = input_obj.get("key")
    input_mime = input_obj.get("mimeType")
    params = payload.get("params", {})
    feature_slug = payload.get("featureSlug", "unknown")
    
    worker_id = os.getenv("WORKER_ID")
    
    print(f"[METADATA] ========== STARTING METADATA JOB ==========", flush=True)
    print(f"[METADATA] Job ID: {job_id}", flush=True)
    print(f"[METADATA] Org ID: {org_id}", flush=True)
    print(f"[METADATA] Feature Slug: {feature_slug}", flush=True)
    print(f"[METADATA] Input Key: {input_key}", flush=True)
    print(f"[METADATA] Input MIME Type: {input_mime}", flush=True)
    print(f"[METADATA] Params: {params}", flush=True)
    
    if not job_id or not org_id or not input_key:
        error_msg = f"Invalid payload: missing jobId={job_id}, orgId={org_id}, input.key={input_key}"
        print(f"[METADATA] ERROR: {error_msg}", flush=True)
        raise ValueError(error_msg)
    
    temp_input_path = None
    temp_output_path = None
    temp_cover_art_path = None
    
    try:
        print(f"[METADATA] Step 1: Updating job status to PROCESSING", flush=True)
        post_job_status(job_id=job_id, status="PROCESSING", worker_id=worker_id)
        print(f"[METADATA] Step 1: Status updated successfully", flush=True)
        
        print(f"[METADATA] Step 2: Downloading input file from key: {input_key}", flush=True)
        temp_input_path, detected_mime = download_input_file(input_key, job_id)
        mime_type = input_mime or detected_mime
        print(f"[METADATA] Step 2: Download complete", flush=True)
        print(f"[METADATA]   - Local path: {temp_input_path}", flush=True)
        print(f"[METADATA]   - Detected MIME: {detected_mime}", flush=True)
        print(f"[METADATA]   - Using MIME: {mime_type}", flush=True)
        if temp_input_path and os.path.exists(temp_input_path):
            file_size = os.path.getsize(temp_input_path)
            print(f"[METADATA]   - File size: {file_size} bytes", flush=True)
        
        print(f"[METADATA] Step 3: Parsing parameters", flush=True)
        metadata = {}
        
        if params.get("title"):
            metadata["title"] = str(params["title"])
            print(f"[METADATA]   - Title: {metadata['title']}", flush=True)
        
        if params.get("artist"):
            metadata["artist"] = str(params["artist"])
            print(f"[METADATA]   - Artist: {metadata['artist']}", flush=True)
        
        if params.get("album"):
            metadata["album"] = str(params["album"])
            print(f"[METADATA]   - Album: {metadata['album']}", flush=True)
        
        if params.get("year"):
            try:
                year = int(params["year"])
                if year < 1900 or year > 2100:
                    raise ValueError("year must be between 1900 and 2100")
                metadata["year"] = year
                print(f"[METADATA]   - Year: {year}", flush=True)
            except (ValueError, TypeError):
                raise ValueError("year must be a valid number between 1900 and 2100")
        
        if params.get("genre"):
            metadata["genre"] = str(params["genre"])
            print(f"[METADATA]   - Genre: {metadata['genre']}", flush=True)
        
        if params.get("trackNumber"):
            try:
                track_num = int(params["trackNumber"])
                if track_num < 1:
                    raise ValueError("trackNumber must be >= 1")
                metadata["trackNumber"] = track_num
                print(f"[METADATA]   - Track Number: {track_num}", flush=True)
            except (ValueError, TypeError):
                raise ValueError("trackNumber must be a valid number >= 1")
        
        cover_art_key = params.get("coverArt")
        
        # Check if we have any metadata to edit
        if not metadata and not cover_art_key:
            raise ValueError("At least one metadata field or cover art must be provided")
        
        # Download cover art if provided
        if cover_art_key:
            print(f"[METADATA] Step 4: Downloading cover art from key: {cover_art_key}", flush=True)
            temp_dir = get_temp_dir()
            cover_ext = Path(cover_art_key).suffix or ".jpg"
            temp_cover_art_path = os.path.join(temp_dir, f"{job_id}_cover{cover_ext}")
            
            try:
                download_file(cover_art_key, temp_cover_art_path)
                if os.path.exists(temp_cover_art_path):
                    cover_size = os.path.getsize(temp_cover_art_path)
                    print(f"[METADATA]   - Cover art downloaded: {temp_cover_art_path}, size: {cover_size} bytes", flush=True)
                else:
                    raise ValueError(f"Cover art file not found after download: {cover_art_key}")
            except Exception as e:
                raise ValueError(f"Failed to download cover art: {e}")
        
        # Determine output path (same format as input)
        input_ext = Path(temp_input_path).suffix.lower()
        output_ext = input_ext or ".mp3"
        output_mime = mime_type
        
        temp_dir = get_temp_dir()
        temp_output_path = os.path.join(temp_dir, f"{job_id}_output{output_ext}")
        
        print(f"[METADATA] Step 5: Editing metadata", flush=True)
        print(f"[METADATA]   - Input: {temp_input_path}", flush=True)
        print(f"[METADATA]   - Output: {temp_output_path}", flush=True)
        print(f"[METADATA]   - Metadata fields: {list(metadata.keys())}", flush=True)
        print(f"[METADATA]   - Cover art: {temp_cover_art_path if cover_art_key else 'None'}", flush=True)
        
        edit_audio_metadata(
            input_path=temp_input_path,
            output_path=temp_output_path,
            metadata=metadata,
            cover_art_path=temp_cover_art_path,
        )
        
        print(f"[METADATA] Metadata edited successfully, uploading to R2...", flush=True)
        output_key, output_size_bytes = upload_output_file(
            local_path=temp_output_path,
            org_id=org_id,
            job_id=job_id,
            mime_type=output_mime,
            output_extension=output_ext,
        )
        
        print(f"[METADATA] Uploaded to R2: key={output_key}, size={output_size_bytes} bytes", flush=True)
        print(f"[METADATA] Updating job status to COMPLETED: jobId={job_id}", flush=True)
        
        post_job_status(
            job_id=job_id,
            status="COMPLETED",
            worker_id=worker_id,
            output={
                "key": output_key,
                "mimeType": output_mime,
                "sizeBytes": output_size_bytes,
            },
        )
        
        print(f"[METADATA] Job {job_id} completed successfully", flush=True)
        
        return {
            "jobId": job_id,
            "status": "COMPLETED",
            "outputKey": output_key,
        }
    except Exception as e:
        print(f"[METADATA] ERROR: Job {job_id} failed: {e}", flush=True)
        import traceback
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()
        
        try:
            print(f"[METADATA] Updating job status to FAILED: jobId={job_id}", flush=True)
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
        except Exception as callback_err:
            print(f"[METADATA] ERROR: Failed to update job status: {callback_err}", flush=True)
        raise
    finally:
        print(f"[METADATA] Cleaning up temp files: {temp_input_path}, {temp_output_path}, {temp_cover_art_path}", flush=True)
        cleanup_temp_files(temp_input_path, temp_output_path, temp_cover_art_path)

