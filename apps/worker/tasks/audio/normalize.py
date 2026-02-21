import os
import sys
from typing import Any, Dict

print("[NORMALIZE-MODULE] normalize.py module is being loaded/executed", flush=True)
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
    normalize_audio,
    get_extension_from_format,
    get_audio_format_from_mime,
)

print("[NORMALIZE-MODULE] All imports completed successfully", flush=True)
sys.stdout.flush()


def normalize_audio_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process audio normalization job.
    
    Expected params:
        - targetLevel: float (optional, target loudness in LUFS, default: -16.0)
        - format: str (optional, output format: mp3, wav, flac, aac, ogg, m4a)
    """
    sys.stdout.write("[NORMALIZE] >>>>> FUNCTION ENTRY - normalize_audio_task CALLED <<<<<\n")
    sys.stdout.flush()
    sys.stderr.write("[NORMALIZE] >>>>> FUNCTION ENTRY - normalize_audio_task CALLED <<<<<\n")
    sys.stderr.flush()
    print("[NORMALIZE] >>>>> FUNCTION ENTRY - normalize_audio_task CALLED <<<<<", flush=True)
    
    job_id = payload.get("jobId")
    org_id = payload.get("orgId")
    input_obj = payload.get("input", {})
    input_key = input_obj.get("key")
    input_mime = input_obj.get("mimeType")
    params = payload.get("params", {})
    feature_slug = payload.get("featureSlug", "unknown")
    
    worker_id = os.getenv("WORKER_ID")
    
    print(f"[NORMALIZE] ========== STARTING NORMALIZE JOB ==========", flush=True)
    print(f"[NORMALIZE] Job ID: {job_id}", flush=True)
    print(f"[NORMALIZE] Org ID: {org_id}", flush=True)
    print(f"[NORMALIZE] Feature Slug: {feature_slug}", flush=True)
    print(f"[NORMALIZE] Input Key: {input_key}", flush=True)
    print(f"[NORMALIZE] Input MIME Type: {input_mime}", flush=True)
    print(f"[NORMALIZE] Params: {params}", flush=True)
    print(f"[NORMALIZE] Full payload keys: {list(payload.keys())}", flush=True)
    
    if not job_id or not org_id or not input_key:
        error_msg = f"Invalid payload: missing jobId={job_id}, orgId={org_id}, input.key={input_key}"
        print(f"[NORMALIZE] ERROR: {error_msg}", flush=True)
        raise ValueError(error_msg)
    
    temp_input_path = None
    temp_output_path = None
    
    try:
        print(f"[NORMALIZE] Step 1: Updating job status to PROCESSING", flush=True)
        post_job_status(job_id=job_id, status="PROCESSING", worker_id=worker_id)
        print(f"[NORMALIZE] Step 1: Status updated successfully", flush=True)
        
        print(f"[NORMALIZE] Step 2: Downloading input file from key: {input_key}", flush=True)
        temp_input_path, detected_mime = download_input_file(input_key, job_id)
        mime_type = input_mime or detected_mime
        print(f"[NORMALIZE] Step 2: Download complete", flush=True)
        print(f"[NORMALIZE]   - Local path: {temp_input_path}", flush=True)
        print(f"[NORMALIZE]   - Detected MIME: {detected_mime}", flush=True)
        print(f"[NORMALIZE]   - Using MIME: {mime_type}", flush=True)
        if temp_input_path and os.path.exists(temp_input_path):
            file_size = os.path.getsize(temp_input_path)
            print(f"[NORMALIZE]   - File size: {file_size} bytes", flush=True)
        
        print(f"[NORMALIZE] Step 3: Parsing parameters", flush=True)
        target_level = params.get("targetLevel", -16.0)
        output_format = params.get("format")
        
        try:
            target_level = float(target_level)
            if target_level < -23.0 or target_level > -12.0:
                raise ValueError("targetLevel must be between -23.0 and -12.0 LUFS")
        except (ValueError, TypeError):
            raise ValueError("targetLevel must be a valid number between -23.0 and -12.0")
        
        if output_format:
            output_format = output_format.lower()
        
        print(f"[NORMALIZE]   - Target level: {target_level} LUFS", flush=True)
        if output_format:
            print(f"[NORMALIZE]   - Output format: {output_format}", flush=True)
        else:
            print(f"[NORMALIZE]   - Output format: original (keeping input format)", flush=True)
        
        # Determine output extension and MIME type
        if output_format:
            output_ext = get_extension_from_format(output_format)
            output_mime = f"audio/{output_format.lower()}"
        else:
            # Use input format
            input_ext = os.path.splitext(temp_input_path)[1].lower()
            output_ext = input_ext or ".mp3"
            output_mime = mime_type
        
        temp_dir = get_temp_dir()
        temp_output_path = os.path.join(temp_dir, f"{job_id}_output{output_ext}")
        
        print(f"[NORMALIZE] Step 4: Normalizing audio", flush=True)
        print(f"[NORMALIZE]   - Input: {temp_input_path}", flush=True)
        print(f"[NORMALIZE]   - Output: {temp_output_path}", flush=True)
        print(f"[NORMALIZE]   - Target level: {target_level} LUFS", flush=True)
        
        normalize_audio(
            input_path=temp_input_path,
            output_path=temp_output_path,
            target_level=target_level,
            output_format=output_format,
        )
        
        print(f"[NORMALIZE] Audio normalized successfully, uploading to R2...", flush=True)
        output_key, output_size_bytes = upload_output_file(
            local_path=temp_output_path,
            org_id=org_id,
            job_id=job_id,
            mime_type=output_mime,
            output_extension=output_ext,
        )
        
        print(f"[NORMALIZE] Uploaded to R2: key={output_key}, size={output_size_bytes} bytes", flush=True)
        print(f"[NORMALIZE] Updating job status to COMPLETED: jobId={job_id}", flush=True)
        
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
        
        print(f"[NORMALIZE] Job {job_id} completed successfully", flush=True)
        
        return {
            "jobId": job_id,
            "status": "COMPLETED",
            "outputKey": output_key,
        }
    except Exception as e:
        print(f"[NORMALIZE] ERROR: Job {job_id} failed: {e}", flush=True)
        import traceback
        traceback.print_exc(file=sys.stdout)
        
        try:
            print(f"[NORMALIZE] Updating job status to FAILED: jobId={job_id}", flush=True)
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
        except Exception as callback_err:
            print(f"[NORMALIZE] ERROR: Failed to update job status: {callback_err}", flush=True)
        raise
    finally:
        print(f"[NORMALIZE] Cleaning up temp files: {temp_input_path}, {temp_output_path}", flush=True)
        cleanup_temp_files(temp_input_path, temp_output_path)


