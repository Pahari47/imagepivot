import os
import sys
from typing import Any, Dict

print("[CONVERT-MODULE] convert.py module is being loaded/executed", flush=True)
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
    convert_audio,
    get_audio_format_from_mime,
    get_extension_from_format,
)

print("[CONVERT-MODULE] All imports completed successfully", flush=True)
sys.stdout.flush()


def convert_audio_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process audio format conversion job.
    
    Expected params:
        - format: str (required, output format: mp3, wav, flac, aac, ogg, wma, alac, m4a)
        - quality: str (optional, for lossy formats: low, medium, high, custom, default: medium)
        - bitrate: int (optional, custom bitrate in kbps, only used when quality is custom)
    """
    sys.stdout.write("[CONVERT] >>>>> FUNCTION ENTRY - convert_audio_task CALLED <<<<<\n")
    sys.stdout.flush()
    sys.stderr.write("[CONVERT] >>>>> FUNCTION ENTRY - convert_audio_task CALLED <<<<<\n")
    sys.stderr.flush()
    print("[CONVERT] >>>>> FUNCTION ENTRY - convert_audio_task CALLED <<<<<", flush=True)
    
    job_id = payload.get("jobId")
    org_id = payload.get("orgId")
    input_obj = payload.get("input", {})
    input_key = input_obj.get("key")
    input_mime = input_obj.get("mimeType")
    params = payload.get("params", {})
    feature_slug = payload.get("featureSlug", "unknown")
    
    worker_id = os.getenv("WORKER_ID")
    
    print(f"[CONVERT] ========== STARTING CONVERT JOB ==========", flush=True)
    print(f"[CONVERT] Job ID: {job_id}", flush=True)
    print(f"[CONVERT] Org ID: {org_id}", flush=True)
    print(f"[CONVERT] Feature Slug: {feature_slug}", flush=True)
    print(f"[CONVERT] Input Key: {input_key}", flush=True)
    print(f"[CONVERT] Input MIME Type: {input_mime}", flush=True)
    print(f"[CONVERT] Params: {params}", flush=True)
    
    if not job_id or not org_id or not input_key:
        error_msg = f"Invalid payload: missing jobId={job_id}, orgId={org_id}, input.key={input_key}"
        print(f"[CONVERT] ERROR: {error_msg}", flush=True)
        raise ValueError(error_msg)
    
    temp_input_path = None
    temp_output_path = None
    
    try:
        print(f"[CONVERT] Step 1: Updating job status to PROCESSING", flush=True)
        post_job_status(job_id=job_id, status="PROCESSING", worker_id=worker_id)
        print(f"[CONVERT] Step 1: Status updated successfully", flush=True)
        
        print(f"[CONVERT] Step 2: Downloading input file from key: {input_key}", flush=True)
        temp_input_path, detected_mime = download_input_file(input_key, job_id)
        mime_type = input_mime or detected_mime
        print(f"[CONVERT] Step 2: Download complete", flush=True)
        print(f"[CONVERT]   - Local path: {temp_input_path}", flush=True)
        print(f"[CONVERT]   - Detected MIME: {detected_mime}", flush=True)
        print(f"[CONVERT]   - Using MIME: {mime_type}", flush=True)
        if temp_input_path and os.path.exists(temp_input_path):
            file_size = os.path.getsize(temp_input_path)
            print(f"[CONVERT]   - File size: {file_size} bytes", flush=True)
        
        print(f"[CONVERT] Step 3: Parsing parameters", flush=True)
        output_format = params.get("format")
        quality = params.get("quality", "medium")
        bitrate = params.get("bitrate")
        
        if not output_format:
            raise ValueError("format parameter is required")
        
        output_format = output_format.lower()
        
        # Validate quality and bitrate
        lossy_formats = ["mp3", "aac", "ogg"]
        is_lossy = output_format in lossy_formats
        
        if quality == "custom" and not bitrate:
            raise ValueError("bitrate is required when quality is custom")
        
        if quality == "custom" and bitrate:
            try:
                bitrate = int(bitrate)
                if bitrate < 64 or bitrate > 320:
                    raise ValueError("bitrate must be between 64 and 320 kbps")
            except (ValueError, TypeError):
                raise ValueError("bitrate must be a valid number between 64 and 320")
        
        print(f"[CONVERT]   - Output format: {output_format}", flush=True)
        print(f"[CONVERT]   - Quality: {quality}", flush=True)
        if bitrate:
            print(f"[CONVERT]   - Custom bitrate: {bitrate}k", flush=True)
        
        output_ext = get_extension_from_format(output_format)
        output_mime = f"audio/{output_format}"
        
        temp_dir = get_temp_dir()
        temp_output_path = os.path.join(temp_dir, f"{job_id}_output{output_ext}")
        
        print(f"[CONVERT] Step 4: Converting audio", flush=True)
        print(f"[CONVERT]   - Input: {temp_input_path}", flush=True)
        print(f"[CONVERT]   - Output: {temp_output_path}", flush=True)
        print(f"[CONVERT]   - Format: {output_format}", flush=True)
        
        convert_audio(
            input_path=temp_input_path,
            output_path=temp_output_path,
            output_format=output_format,
            quality=quality if is_lossy else None,
            bitrate=bitrate if quality == "custom" else None,
        )
        
        print(f"[CONVERT] Step 5: Audio converted successfully, uploading to R2...", flush=True)
        output_key, output_size_bytes = upload_output_file(
            local_path=temp_output_path,
            org_id=org_id,
            job_id=job_id,
            mime_type=output_mime,
            output_extension=output_ext,
        )
        
        print(f"[CONVERT] Uploaded to R2: key={output_key}, size={output_size_bytes} bytes", flush=True)
        print(f"[CONVERT] Step 6: Updating job status to COMPLETED: jobId={job_id}", flush=True)
        
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
        
        print(f"[CONVERT] Job {job_id} completed successfully", flush=True)
        
        return {
            "jobId": job_id,
            "status": "COMPLETED",
            "outputKey": output_key,
        }
    except Exception as e:
        print(f"[CONVERT] ========== ERROR ==========", flush=True)
        print(f"[CONVERT] Job ID: {job_id}", flush=True)
        print(f"[CONVERT] Error Type: {type(e).__name__}", flush=True)
        print(f"[CONVERT] Error Message: {str(e)}", flush=True)
        import traceback
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()
        sys.stderr.flush()
        print(f"[CONVERT] ==========================", flush=True)
        
        try:
            print(f"[CONVERT] Updating job status to FAILED: jobId={job_id}", flush=True)
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
        except Exception as callback_err:
            print(f"[CONVERT] ERROR: Failed to update job status: {callback_err}", flush=True)
        raise
    finally:
        print(f"[CONVERT] Cleaning up temp files: {temp_input_path}, {temp_output_path}", flush=True)
        cleanup_temp_files(temp_input_path, temp_output_path)




