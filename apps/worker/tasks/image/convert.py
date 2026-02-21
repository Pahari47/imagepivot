import os
import sys
from typing import Any, Dict

# Module-level logging to verify module is loaded
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
from services.image_processor import (
    convert_image,
    get_extension_from_format,
)

print("[CONVERT-MODULE] All imports completed successfully", flush=True)
sys.stdout.flush()


def convert_image_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process image format conversion job.
    
    Expected params:
        - format: str (required, output format: jpeg, png, webp, svg, etc.)
        - conversionType: str (optional, 'to' or 'from', for logging purposes)
        - quality: int (optional, 1-100, default: 95, for JPEG/WebP)
    """
    # CRITICAL: Print immediately at function entry to verify function is called
    # Use multiple methods to ensure output appears
    sys.stdout.write("[CONVERT] >>>>> FUNCTION ENTRY - convert_image_task CALLED <<<<<\n")
    sys.stdout.flush()
    sys.stderr.write("[CONVERT] >>>>> FUNCTION ENTRY - convert_image_task CALLED <<<<<\n")
    sys.stderr.flush()
    print("[CONVERT] >>>>> FUNCTION ENTRY - convert_image_task CALLED <<<<<", flush=True)
    
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
    print(f"[CONVERT] Params type: {type(params)}", flush=True)
    print(f"[CONVERT] Format value: {params.get('format')}", flush=True)
    print(f"[CONVERT] Format type: {type(params.get('format'))}", flush=True)
    print(f"[CONVERT] Full payload keys: {list(payload.keys())}", flush=True)
    
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
        print(f"[CONVERT]   - File exists: {os.path.exists(temp_input_path) if temp_input_path else False}", flush=True)
        if temp_input_path and os.path.exists(temp_input_path):
            file_size = os.path.getsize(temp_input_path)
            print(f"[CONVERT]   - File size: {file_size} bytes", flush=True)
        
        print(f"[CONVERT] Step 3: Parsing parameters", flush=True)
        output_format = params.get("format")
        conversion_type = params.get("conversionType", "to")
        quality = params.get("quality", 95)
        print(f"[CONVERT]   - Output format from params: {output_format}", flush=True)
        print(f"[CONVERT]   - Output format type: {type(output_format)}", flush=True)
        print(f"[CONVERT]   - Conversion type: {conversion_type}", flush=True)
        print(f"[CONVERT]   - Quality: {quality}", flush=True)
        print(f"[CONVERT]   - All params: {params}", flush=True)
        
        if not output_format:
            error_msg = "Format parameter is required for conversion"
            print(f"[CONVERT] ERROR: {error_msg}", flush=True)
            print(f"[CONVERT] Available params keys: {list(params.keys())}", flush=True)
            print(f"[CONVERT] Params values: {params}", flush=True)
            raise ValueError(error_msg)
        
        # Normalize format - handle both 'jpg' and 'jpeg' as 'JPEG'
        if output_format and isinstance(output_format, str):
            output_format_lower = output_format.lower()
            if output_format_lower in ['jpg', 'jpeg']:
                output_format = 'JPEG'
            else:
                output_format = output_format.upper()
        else:
            error_msg = f"Invalid format parameter: {output_format} (type: {type(output_format)})"
            print(f"[CONVERT] ERROR: {error_msg}", flush=True)
            raise ValueError(error_msg)
        
        if quality is not None:
            quality = int(quality)
            if quality < 1 or quality > 100:
                error_msg = f"Quality must be between 1 and 100, got: {quality}"
                print(f"[CONVERT] ERROR: {error_msg}", flush=True)
                raise ValueError(error_msg)
        
        output_format = output_format.upper()
        print(f"[CONVERT]   - Normalized output format: {output_format}", flush=True)
        
        output_ext = get_extension_from_format(output_format)
        output_mime = f"image/{output_format.lower()}"
        print(f"[CONVERT]   - Output extension: {output_ext}", flush=True)
        print(f"[CONVERT]   - Output MIME: {output_mime}", flush=True)
        
        temp_dir = get_temp_dir()
        temp_output_path = os.path.join(temp_dir, f"{job_id}_output{output_ext}")
        print(f"[CONVERT]   - Output path: {temp_output_path}", flush=True)
        
        print(f"[CONVERT] Step 4: Starting image conversion", flush=True)
        print(f"[CONVERT]   - Input: {temp_input_path}", flush=True)
        print(f"[CONVERT]   - Output: {temp_output_path}", flush=True)
        print(f"[CONVERT]   - Target format: {output_format}", flush=True)
        print(f"[CONVERT]   - Quality: {quality}", flush=True)
        
        convert_image(
            input_path=temp_input_path,
            output_path=temp_output_path,
            output_format=output_format,
            quality=quality,
        )
        
        print(f"[CONVERT] Step 4: Conversion complete", flush=True)
        print(f"[CONVERT]   - Output file exists: {os.path.exists(temp_output_path)}", flush=True)
        if os.path.exists(temp_output_path):
            output_file_size = os.path.getsize(temp_output_path)
            print(f"[CONVERT]   - Output file size: {output_file_size} bytes", flush=True)
        
        print(f"[CONVERT] Step 5: Uploading to R2", flush=True)
        output_key, output_size_bytes = upload_output_file(
            local_path=temp_output_path,
            org_id=org_id,
            job_id=job_id,
            mime_type=output_mime,
            output_extension=output_ext,
        )
        
        print(f"[CONVERT] Step 5: Upload complete", flush=True)
        print(f"[CONVERT]   - Output key: {output_key}", flush=True)
        print(f"[CONVERT]   - Output size: {output_size_bytes} bytes", flush=True)
        
        print(f"[CONVERT] Step 6: Updating job status to COMPLETED", flush=True)
        
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
        print(f"[CONVERT] ========== ERROR OCCURRED ==========", flush=True)
        print(f"[CONVERT] Job ID: {job_id}", flush=True)
        print(f"[CONVERT] Error Type: {type(e).__name__}", flush=True)
        print(f"[CONVERT] Error Message: {str(e)}", flush=True)
        import traceback
        print(f"[CONVERT] Full Traceback:", flush=True)
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()
        print(f"[CONVERT] =====================================", flush=True)
        
        try:
            print(f"[CONVERT] Attempting to update job status to FAILED", flush=True)
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
            print(f"[CONVERT] Job status updated to FAILED successfully", flush=True)
        except Exception as callback_err:
            print(f"[CONVERT] CRITICAL: Failed to update job status to FAILED", flush=True)
            print(f"[CONVERT] Callback error type: {type(callback_err).__name__}", flush=True)
            print(f"[CONVERT] Callback error message: {str(callback_err)}", flush=True)
            import traceback
            traceback.print_exc(file=sys.stdout)
            sys.stdout.flush()
        raise
    finally:
        print(f"[CONVERT] ========== CLEANUP ==========", flush=True)
        print(f"[CONVERT] Cleaning up temp files", flush=True)
        print(f"[CONVERT]   - Input: {temp_input_path}", flush=True)
        print(f"[CONVERT]   - Output: {temp_output_path}", flush=True)
        cleanup_temp_files(temp_input_path, temp_output_path)
        print(f"[CONVERT] Cleanup complete", flush=True)
        print(f"[CONVERT] ===========================", flush=True)

