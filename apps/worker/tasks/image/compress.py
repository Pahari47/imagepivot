import os
from typing import Any, Dict

from api_client import post_job_status
from services.file_handler import (
    download_input_file,
    upload_output_file,
    cleanup_temp_files,
    get_temp_dir,
)
from services.image_processor import (
    compress_image,
    get_image_format_from_mime,
    get_extension_from_format,
)


def compress_image_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process image compress job.
    
    Expected params:
        - quality: int (optional, 1-100, default: 85, for JPEG/WebP)
        - format: str (optional, output format: jpeg, png, webp, etc.)
        - optimize: bool (default: true)
    """
    job_id = payload.get("jobId")
    org_id = payload.get("orgId")
    input_obj = payload.get("input", {})
    input_key = input_obj.get("key")
    input_mime = input_obj.get("mimeType")
    params = payload.get("params", {})
    
    worker_id = os.getenv("WORKER_ID")
    
    if not job_id or not org_id or not input_key:
        raise ValueError("Invalid payload: missing jobId/orgId/input.key")
    
    temp_input_path = None
    temp_output_path = None
    
    print(f"[COMPRESS] Starting compress job: jobId={job_id}, orgId={org_id}")
    print(f"[COMPRESS] Input: key={input_key}, mimeType={input_mime}")
    print(f"[COMPRESS] Params: {params}")
    
    try:
        print(f"[COMPRESS] Updating job status to PROCESSING: jobId={job_id}")
        post_job_status(job_id=job_id, status="PROCESSING", worker_id=worker_id)
        
        print(f"[COMPRESS] Downloading input file: key={input_key}")
        temp_input_path, detected_mime = download_input_file(input_key, job_id)
        mime_type = input_mime or detected_mime
        print(f"[COMPRESS] Downloaded to: {temp_input_path}, detected mimeType={detected_mime}")
        
        quality = params.get("quality", 85)
        output_format = params.get("format")
        optimize = params.get("optimize", True)
        
        if quality is not None:
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
        
        print(f"[COMPRESS] Compressing image: {temp_input_path} -> {temp_output_path}")
        print(f"[COMPRESS] Quality: {quality}, format: {output_format}, optimize: {optimize}")
        
        compress_image(
            input_path=temp_input_path,
            output_path=temp_output_path,
            quality=quality,
            output_format=output_format,
            optimize=optimize,
        )
        
        print(f"[COMPRESS] Image compressed successfully, uploading to R2...")
        output_key, output_size_bytes = upload_output_file(
            local_path=temp_output_path,
            org_id=org_id,
            job_id=job_id,
            mime_type=output_mime,
            output_extension=output_ext,
        )
        
        print(f"[COMPRESS] Uploaded to R2: key={output_key}, size={output_size_bytes} bytes")
        print(f"[COMPRESS] Updating job status to COMPLETED: jobId={job_id}")
        
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
        
        print(f"[COMPRESS] Job {job_id} completed successfully")
        
        return {
            "jobId": job_id,
            "status": "COMPLETED",
            "outputKey": output_key,
        }
    except Exception as e:
        print(f"[COMPRESS] ERROR: Job {job_id} failed: {e}")
        import traceback
        traceback.print_exc()
        
        try:
            print(f"[COMPRESS] Updating job status to FAILED: jobId={job_id}")
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
        except Exception as callback_err:
            print(f"[COMPRESS] ERROR: Failed to update job status: {callback_err}")
        raise
    finally:
        print(f"[COMPRESS] Cleaning up temp files: {temp_input_path}, {temp_output_path}")
        cleanup_temp_files(temp_input_path, temp_output_path)

