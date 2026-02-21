import os
import sys
from typing import Any, Dict

print("[TRIM-MODULE] trim.py module is being loaded/executed", flush=True)
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
    trim_audio,
    get_audio_format_from_mime,
    get_extension_from_format,
)

print("[TRIM-MODULE] All imports completed successfully", flush=True)
sys.stdout.flush()


def trim_audio_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process audio trim job.
    
    Expected params:
        - startTime: float (required, start time in seconds)
        - endTime: float (required, end time in seconds)
        - format: str (optional, output format: mp3, wav, aac, m4a, etc.)
    """
    sys.stdout.write("[TRIM] >>>>> FUNCTION ENTRY - trim_audio_task CALLED <<<<<\n")
    sys.stdout.flush()
    sys.stderr.write("[TRIM] >>>>> FUNCTION ENTRY - trim_audio_task CALLED <<<<<\n")
    sys.stderr.flush()
    print("[TRIM] >>>>> FUNCTION ENTRY - trim_audio_task CALLED <<<<<", flush=True)
    
    job_id = payload.get("jobId")
    org_id = payload.get("orgId")
    input_obj = payload.get("input", {})
    input_key = input_obj.get("key")
    input_mime = input_obj.get("mimeType")
    params = payload.get("params", {})
    feature_slug = payload.get("featureSlug", "unknown")
    
    worker_id = os.getenv("WORKER_ID")
    
    print(f"[TRIM] ========== STARTING TRIM JOB ==========", flush=True)
    print(f"[TRIM] Job ID: {job_id}", flush=True)
    print(f"[TRIM] Org ID: {org_id}", flush=True)
    print(f"[TRIM] Feature Slug: {feature_slug}", flush=True)
    print(f"[TRIM] Input Key: {input_key}", flush=True)
    print(f"[TRIM] Input MIME Type: {input_mime}", flush=True)
    print(f"[TRIM] Params: {params}", flush=True)
    
    if not job_id or not org_id or not input_key:
        error_msg = f"Invalid payload: missing jobId={job_id}, orgId={org_id}, input.key={input_key}"
        print(f"[TRIM] ERROR: {error_msg}", flush=True)
        raise ValueError(error_msg)
    
    temp_input_path = None
    temp_output_path = None
    
    try:
        print(f"[TRIM] Step 1: Updating job status to PROCESSING", flush=True)
        post_job_status(job_id=job_id, status="PROCESSING", worker_id=worker_id)
        print(f"[TRIM] Step 1: Status updated successfully", flush=True)
        
        print(f"[TRIM] Step 2: Downloading input file from key: {input_key}", flush=True)
        temp_input_path, detected_mime = download_input_file(input_key, job_id)
        mime_type = input_mime or detected_mime
        print(f"[TRIM] Step 2: Download complete", flush=True)
        print(f"[TRIM]   - Local path: {temp_input_path}", flush=True)
        print(f"[TRIM]   - Detected MIME: {detected_mime}", flush=True)
        print(f"[TRIM]   - Using MIME: {mime_type}", flush=True)
        print(f"[TRIM]   - File exists: {os.path.exists(temp_input_path) if temp_input_path else False}", flush=True)
        if temp_input_path and os.path.exists(temp_input_path):
            file_size = os.path.getsize(temp_input_path)
            print(f"[TRIM]   - File size: {file_size} bytes", flush=True)
        
        print(f"[TRIM] Step 3: Parsing parameters", flush=True)
        start_time = params.get("startTime")
        end_time = params.get("endTime")
        output_format = params.get("format")
        
        if start_time is None:
            raise ValueError("startTime parameter is required")
        if end_time is None:
            raise ValueError("endTime parameter is required")
        
        try:
            start_time = float(start_time)
            end_time = float(end_time)
        except (ValueError, TypeError) as e:
            raise ValueError(f"startTime and endTime must be valid numbers: {e}")
        
        if start_time < 0:
            raise ValueError("startTime must be >= 0")
        if end_time <= start_time:
            raise ValueError("endTime must be greater than startTime")
        
        print(f"[TRIM]   - Start time: {start_time}s", flush=True)
        print(f"[TRIM]   - End time: {end_time}s", flush=True)
        print(f"[TRIM]   - Output format: {output_format or 'auto'}", flush=True)
        
        if output_format:
            output_format = output_format.lower()
        else:
            output_format = get_audio_format_from_mime(mime_type)
        
        output_ext = get_extension_from_format(output_format)
        output_mime = f"audio/{output_format}"
        
        temp_dir = get_temp_dir()
        temp_output_path = os.path.join(temp_dir, f"{job_id}_output{output_ext}")
        
        print(f"[TRIM] Step 4: Trimming audio", flush=True)
        print(f"[TRIM]   - Input: {temp_input_path}", flush=True)
        print(f"[TRIM]   - Output: {temp_output_path}", flush=True)
        print(f"[TRIM]   - Start: {start_time}s, End: {end_time}s", flush=True)
        print(f"[TRIM]   - Format: {output_format}", flush=True)
        
        trim_audio(
            input_path=temp_input_path,
            output_path=temp_output_path,
            start_time=start_time,
            end_time=end_time,
            output_format=output_format,
        )
        
        print(f"[TRIM] Step 5: Audio trimmed successfully, uploading to R2...", flush=True)
        output_key, output_size_bytes = upload_output_file(
            local_path=temp_output_path,
            org_id=org_id,
            job_id=job_id,
            mime_type=output_mime,
            output_extension=output_ext,
        )
        
        print(f"[TRIM] Uploaded to R2: key={output_key}, size={output_size_bytes} bytes", flush=True)
        print(f"[TRIM] Step 6: Updating job status to COMPLETED: jobId={job_id}", flush=True)
        
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
        
        print(f"[TRIM] Job {job_id} completed successfully", flush=True)
        
        return {
            "jobId": job_id,
            "status": "COMPLETED",
            "outputKey": output_key,
        }
    except Exception as e:
        print(f"[TRIM] ========== ERROR ==========", flush=True)
        print(f"[TRIM] Job ID: {job_id}", flush=True)
        print(f"[TRIM] Error Type: {type(e).__name__}", flush=True)
        print(f"[TRIM] Error Message: {str(e)}", flush=True)
        import traceback
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()
        sys.stderr.flush()
        print(f"[TRIM] ==========================", flush=True)
        
        try:
            print(f"[TRIM] Updating job status to FAILED: jobId={job_id}", flush=True)
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
        except Exception as callback_err:
            print(f"[TRIM] ERROR: Failed to update job status: {callback_err}", flush=True)
        raise
    finally:
        print(f"[TRIM] Cleaning up temp files: {temp_input_path}, {temp_output_path}", flush=True)
        cleanup_temp_files(temp_input_path, temp_output_path)

