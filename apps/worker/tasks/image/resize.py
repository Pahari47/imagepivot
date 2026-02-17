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
    resize_image,
    get_image_format_from_mime,
    get_extension_from_format,
)


def resize_image_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process image resize job.
    
    Expected params:
        - width: int (optional, target width in pixels)
        - height: int (optional, target height in pixels)
        - maintainAspect: bool (default: true)
        - format: str (optional, output format: jpeg, png, webp, etc.)
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
    
    print(f"[RESIZE] Starting resize job: jobId={job_id}, orgId={org_id}")
    print(f"[RESIZE] Input: key={input_key}, mimeType={input_mime}")
    print(f"[RESIZE] Params: {params}")
    
    try:
        print(f"[RESIZE] Updating job status to PROCESSING: jobId={job_id}")
        post_job_status(job_id=job_id, status="PROCESSING", worker_id=worker_id)
        
        print(f"[RESIZE] Downloading input file: key={input_key}")
        temp_input_path, detected_mime = download_input_file(input_key, job_id)
        mime_type = input_mime or detected_mime
        print(f"[RESIZE] Downloaded to: {temp_input_path}, detected mimeType={detected_mime}")
        
        width = params.get("width")
        height = params.get("height")
        maintain_aspect = params.get("maintainAspect", True)
        output_format = params.get("format")
        quality = params.get("quality", 95)
        
        if width is None and height is None:
            raise ValueError("At least one of width or height must be specified in params")
        
        if width is not None:
            width = int(width)
        if height is not None:
            height = int(height)
        
        if output_format:
            output_format = output_format.upper()
        else:
            output_format = get_image_format_from_mime(mime_type)
        
        output_ext = get_extension_from_format(output_format)
        output_mime = f"image/{output_format.lower()}"
        
        temp_dir = get_temp_dir()
        temp_output_path = os.path.join(temp_dir, f"{job_id}_output{output_ext}")
        
        print(f"[RESIZE] Resizing image: {temp_input_path} -> {temp_output_path}")
        print(f"[RESIZE] Dimensions: width={width}, height={height}, maintainAspect={maintain_aspect}")
        print(f"[RESIZE] Format: {output_format}, quality={quality}")
        
        resize_image(
            input_path=temp_input_path,
            output_path=temp_output_path,
            width=width,
            height=height,
            maintain_aspect=maintain_aspect,
            output_format=output_format,
            quality=quality,
        )
        
        print(f"[RESIZE] Image resized successfully, uploading to R2...")
        output_key, output_size_bytes = upload_output_file(
            local_path=temp_output_path,
            org_id=org_id,
            job_id=job_id,
            mime_type=output_mime,
            output_extension=output_ext,
        )
        
        print(f"[RESIZE] Uploaded to R2: key={output_key}, size={output_size_bytes} bytes")
        print(f"[RESIZE] Updating job status to COMPLETED: jobId={job_id}")
        
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
        
        print(f"[RESIZE] Job {job_id} completed successfully")
        
        return {
            "jobId": job_id,
            "status": "COMPLETED",
            "outputKey": output_key,
        }
    except Exception as e:
        print(f"[RESIZE] ERROR: Job {job_id} failed: {e}")
        import traceback
        traceback.print_exc()
        
        try:
            print(f"[RESIZE] Updating job status to FAILED: jobId={job_id}")
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
        except Exception as callback_err:
            print(f"[RESIZE] ERROR: Failed to update job status: {callback_err}")
        raise
    finally:
        print(f"[RESIZE] Cleaning up temp files: {temp_input_path}, {temp_output_path}")
        cleanup_temp_files(temp_input_path, temp_output_path)

