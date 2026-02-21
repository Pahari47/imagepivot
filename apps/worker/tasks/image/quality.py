import os
import sys
from typing import Any, Dict

from api_client import post_job_status
from services.file_handler import (
    download_input_file,
    upload_output_file,
    cleanup_temp_files,
    get_temp_dir,
)
from services.image_processor import (
    adjust_quality,
    get_image_format_from_mime,
    get_extension_from_format,
)


def quality_control_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process image quality control job.
    
    Expected params:
        - quality: int (required, 1-100, target quality level)
        - format: str (optional, output format: jpeg, png, webp, etc.)
        - optimize: bool (optional, default: true, enable optimization)
    """
    job_id = payload.get("jobId")
    org_id = payload.get("orgId")
    input_obj = payload.get("input", {})
    input_key = input_obj.get("key")
    input_mime = input_obj.get("mimeType")
    params = payload.get("params", {})
    
    worker_id = os.getenv("WORKER_ID")
    
    print(f"[QUALITY] Starting quality control job: jobId={job_id}, orgId={org_id}", flush=True)
    print(f"[QUALITY] Input: key={input_key}, mimeType={input_mime}", flush=True)
    print(f"[QUALITY] Params: {params}", flush=True)
    
    if not job_id or not org_id or not input_key:
        error_msg = "Invalid payload: missing jobId/orgId/input.key"
        print(f"[QUALITY] ERROR: {error_msg}", flush=True)
        raise ValueError(error_msg)
    
    temp_input_path = None
    temp_output_path = None
    
    try:
        print(f"[QUALITY] Updating job status to PROCESSING: jobId={job_id}", flush=True)
        post_job_status(job_id=job_id, status="PROCESSING", worker_id=worker_id)
        
        print(f"[QUALITY] Downloading input file: key={input_key}", flush=True)
        temp_input_path, detected_mime = download_input_file(input_key, job_id)
        mime_type = input_mime or detected_mime
        print(f"[QUALITY] Downloaded to: {temp_input_path}, detected mimeType={detected_mime}", flush=True)
        
        quality = params.get("quality")
        output_format = params.get("format")
        optimize = params.get("optimize", True)
        
        if quality is None:
            raise ValueError("Quality parameter is required")
        
        quality = int(quality)
        if quality < 1 or quality > 100:
            raise ValueError("Quality must be between 1 and 100")
        
        if output_format:
            output_format = output_format.upper()
        else:
            output_format = get_image_format_from_mime(mime_type)
        
        output_ext = get_extension_from_format(output_format)
        output_mime = f"image/{output_format.lower()}"
        
        temp_dir = get_temp_dir()
        temp_output_path = os.path.join(temp_dir, f"{job_id}_output{output_ext}")
        
        print(f"[QUALITY] Adjusting image quality: {temp_input_path} -> {temp_output_path}", flush=True)
        print(f"[QUALITY] Quality: {quality}, format: {output_format}, optimize: {optimize}", flush=True)
        
        adjust_quality(
            input_path=temp_input_path,
            output_path=temp_output_path,
            quality=quality,
            output_format=output_format,
            optimize=optimize,
        )
        
        print(f"[QUALITY] Image quality adjusted successfully, uploading to R2...", flush=True)
        output_key, output_size_bytes = upload_output_file(
            local_path=temp_output_path,
            org_id=org_id,
            job_id=job_id,
            mime_type=output_mime,
            output_extension=output_ext,
        )
        
        print(f"[QUALITY] Uploaded to R2: key={output_key}, size={output_size_bytes} bytes", flush=True)
        print(f"[QUALITY] Updating job status to COMPLETED: jobId={job_id}", flush=True)
        
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
        
        print(f"[QUALITY] Job {job_id} completed successfully", flush=True)
        
        return {
            "jobId": job_id,
            "status": "COMPLETED",
            "outputKey": output_key,
        }
    except Exception as e:
        print(f"[QUALITY] ERROR: Job {job_id} failed: {e}", flush=True)
        import traceback
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()
        
        try:
            print(f"[QUALITY] Updating job status to FAILED: jobId={job_id}", flush=True)
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
        except Exception as callback_err:
            print(f"[QUALITY] ERROR: Failed to update job status: {callback_err}", flush=True)
        raise
    finally:
        print(f"[QUALITY] Cleaning up temp files: {temp_input_path}, {temp_output_path}", flush=True)
        cleanup_temp_files(temp_input_path, temp_output_path)




