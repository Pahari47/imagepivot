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
    convert_image,
    get_extension_from_format,
)


def convert_image_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process image format conversion job.
    
    Expected params:
        - format: str (required, output format: jpeg, png, webp, svg, etc.)
        - conversionType: str (optional, 'to' or 'from', for logging purposes)
        - quality: int (optional, 1-100, default: 95, for JPEG/WebP)
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
    
    print(f"[CONVERT] Starting convert job: jobId={job_id}, orgId={org_id}")
    print(f"[CONVERT] Input: key={input_key}, mimeType={input_mime}")
    print(f"[CONVERT] Params: {params}")
    
    try:
        print(f"[CONVERT] Updating job status to PROCESSING: jobId={job_id}")
        post_job_status(job_id=job_id, status="PROCESSING", worker_id=worker_id)
        
        print(f"[CONVERT] Downloading input file: key={input_key}")
        temp_input_path, detected_mime = download_input_file(input_key, job_id)
        mime_type = input_mime or detected_mime
        print(f"[CONVERT] Downloaded to: {temp_input_path}, detected mimeType={detected_mime}")
        
        output_format = params.get("format")
        conversion_type = params.get("conversionType", "to")
        quality = params.get("quality", 95)
        
        if not output_format:
            raise ValueError("Format parameter is required for conversion")
        
        if quality is not None:
            quality = int(quality)
            if quality < 1 or quality > 100:
                raise ValueError("Quality must be between 1 and 100")
        
        output_format = output_format.upper()
        
        output_ext = get_extension_from_format(output_format)
        output_mime = f"image/{output_format.lower()}"
        
        temp_dir = get_temp_dir()
        temp_output_path = os.path.join(temp_dir, f"{job_id}_output{output_ext}")
        
        print(f"[CONVERT] Converting image: {temp_input_path} -> {temp_output_path}")
        print(f"[CONVERT] Conversion type: {conversion_type}, format: {output_format}, quality: {quality}")
        
        convert_image(
            input_path=temp_input_path,
            output_path=temp_output_path,
            output_format=output_format,
            quality=quality,
        )
        
        print(f"[CONVERT] Image converted successfully, uploading to R2...")
        output_key, output_size_bytes = upload_output_file(
            local_path=temp_output_path,
            org_id=org_id,
            job_id=job_id,
            mime_type=output_mime,
            output_extension=output_ext,
        )
        
        print(f"[CONVERT] Uploaded to R2: key={output_key}, size={output_size_bytes} bytes")
        print(f"[CONVERT] Updating job status to COMPLETED: jobId={job_id}")
        
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
        
        print(f"[CONVERT] Job {job_id} completed successfully")
        
        return {
            "jobId": job_id,
            "status": "COMPLETED",
            "outputKey": output_key,
        }
    except Exception as e:
        print(f"[CONVERT] ERROR: Job {job_id} failed: {e}")
        import traceback
        traceback.print_exc()
        
        try:
            print(f"[CONVERT] Updating job status to FAILED: jobId={job_id}")
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
        except Exception as callback_err:
            print(f"[CONVERT] ERROR: Failed to update job status: {callback_err}")
        raise
    finally:
        print(f"[CONVERT] Cleaning up temp files: {temp_input_path}, {temp_output_path}")
        cleanup_temp_files(temp_input_path, temp_output_path)

