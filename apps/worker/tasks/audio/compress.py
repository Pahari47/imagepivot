import os
import sys
from typing import Any, Dict

print("[COMPRESS-MODULE] compress.py module is being loaded/executed", flush=True)
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
    compress_audio,
    get_extension_from_format,
    get_audio_format_from_mime,
)

print("[COMPRESS-MODULE] All imports completed successfully", flush=True)
sys.stdout.flush()


def compress_audio_task(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process audio compression job.
    
    Expected params:
        - bitrate: int (required, target bitrate in kbps: 64-320)
        - vbr: bool (optional, use Variable Bitrate, default: false)
        - sampleRate: int (optional, target sample rate: 8000, 11025, 16000, 22050, 44100, 48000)
        - format: str (optional, output format: mp3, aac, ogg, m4a, default: mp3)
    """
    sys.stdout.write("[COMPRESS] >>>>> FUNCTION ENTRY - compress_audio_task CALLED <<<<<\n")
    sys.stdout.flush()
    sys.stderr.write("[COMPRESS] >>>>> FUNCTION ENTRY - compress_audio_task CALLED <<<<<\n")
    sys.stderr.flush()
    print("[COMPRESS] >>>>> FUNCTION ENTRY - compress_audio_task CALLED <<<<<", flush=True)
    
    job_id = payload.get("jobId")
    org_id = payload.get("orgId")
    input_obj = payload.get("input", {})
    input_key = input_obj.get("key")
    input_mime = input_obj.get("mimeType")
    params = payload.get("params", {})
    feature_slug = payload.get("featureSlug", "unknown")
    
    worker_id = os.getenv("WORKER_ID")
    
    print(f"[COMPRESS] ========== STARTING COMPRESS JOB ==========", flush=True)
    print(f"[COMPRESS] Job ID: {job_id}", flush=True)
    print(f"[COMPRESS] Org ID: {org_id}", flush=True)
    print(f"[COMPRESS] Feature Slug: {feature_slug}", flush=True)
    print(f"[COMPRESS] Input Key: {input_key}", flush=True)
    print(f"[COMPRESS] Input MIME Type: {input_mime}", flush=True)
    print(f"[COMPRESS] Params: {params}", flush=True)
    print(f"[COMPRESS] Full payload keys: {list(payload.keys())}", flush=True)
    
    if not job_id or not org_id or not input_key:
        error_msg = f"Invalid payload: missing jobId={job_id}, orgId={org_id}, input.key={input_key}"
        print(f"[COMPRESS] ERROR: {error_msg}", flush=True)
        raise ValueError(error_msg)
    
    temp_input_path = None
    temp_output_path = None
    
    try:
        print(f"[COMPRESS] Step 1: Updating job status to PROCESSING", flush=True)
        post_job_status(job_id=job_id, status="PROCESSING", worker_id=worker_id)
        print(f"[COMPRESS] Step 1: Status updated successfully", flush=True)
        
        print(f"[COMPRESS] Step 2: Downloading input file from key: {input_key}", flush=True)
        temp_input_path, detected_mime = download_input_file(input_key, job_id)
        mime_type = input_mime or detected_mime
        print(f"[COMPRESS] Step 2: Download complete", flush=True)
        print(f"[COMPRESS]   - Local path: {temp_input_path}", flush=True)
        print(f"[COMPRESS]   - Detected MIME: {detected_mime}", flush=True)
        print(f"[COMPRESS]   - Using MIME: {mime_type}", flush=True)
        if temp_input_path and os.path.exists(temp_input_path):
            file_size = os.path.getsize(temp_input_path)
            print(f"[COMPRESS]   - File size: {file_size} bytes", flush=True)
        
        print(f"[COMPRESS] Step 3: Parsing parameters", flush=True)
        bitrate = params.get("bitrate")
        vbr = params.get("vbr", False)
        sample_rate = params.get("sampleRate")
        output_format = params.get("format", "mp3")
        
        if not bitrate:
            raise ValueError("bitrate is required for audio compression")
        
        try:
            bitrate = int(bitrate)
            if bitrate < 64 or bitrate > 320:
                raise ValueError("bitrate must be between 64 and 320 kbps")
        except (ValueError, TypeError):
            raise ValueError("bitrate must be a valid number between 64 and 320")
        
        if sample_rate:
            try:
                sample_rate = int(sample_rate)
                valid_sample_rates = [8000, 11025, 16000, 22050, 44100, 48000]
                if sample_rate not in valid_sample_rates:
                    raise ValueError(f"sampleRate must be one of: {valid_sample_rates}")
            except (ValueError, TypeError):
                raise ValueError("sampleRate must be a valid number")
        
        print(f"[COMPRESS]   - Bitrate: {bitrate}k", flush=True)
        print(f"[COMPRESS]   - VBR: {vbr}", flush=True)
        if sample_rate:
            print(f"[COMPRESS]   - Sample rate: {sample_rate} Hz", flush=True)
        print(f"[COMPRESS]   - Output format: {output_format}", flush=True)
        
        output_ext = get_extension_from_format(output_format)
        output_mime = f"audio/{output_format.lower()}"
        
        temp_dir = get_temp_dir()
        temp_output_path = os.path.join(temp_dir, f"{job_id}_output{output_ext}")
        
        print(f"[COMPRESS] Step 4: Compressing audio", flush=True)
        print(f"[COMPRESS]   - Input: {temp_input_path}", flush=True)
        print(f"[COMPRESS]   - Output: {temp_output_path}", flush=True)
        print(f"[COMPRESS]   - Format: {output_format}", flush=True)
        
        compress_audio(
            input_path=temp_input_path,
            output_path=temp_output_path,
            bitrate=bitrate,
            vbr=vbr,
            sample_rate=sample_rate,
            output_format=output_format,
        )
        
        print(f"[COMPRESS] Audio compressed successfully, uploading to R2...", flush=True)
        output_key, output_size_bytes = upload_output_file(
            local_path=temp_output_path,
            org_id=org_id,
            job_id=job_id,
            mime_type=output_mime,
            output_extension=output_ext,
        )
        
        print(f"[COMPRESS] Uploaded to R2: key={output_key}, size={output_size_bytes} bytes", flush=True)
        print(f"[COMPRESS] Updating job status to COMPLETED: jobId={job_id}", flush=True)
        
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
        
        print(f"[COMPRESS] Job {job_id} completed successfully", flush=True)
        
        return {
            "jobId": job_id,
            "status": "COMPLETED",
            "outputKey": output_key,
        }
    except Exception as e:
        print(f"[COMPRESS] ERROR: Job {job_id} failed: {e}", flush=True)
        import traceback
        traceback.print_exc(file=sys.stdout)
        
        try:
            print(f"[COMPRESS] Updating job status to FAILED: jobId={job_id}", flush=True)
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
        except Exception as callback_err:
            print(f"[COMPRESS] ERROR: Failed to update job status: {callback_err}", flush=True)
        raise
    finally:
        print(f"[COMPRESS] Cleaning up temp files: {temp_input_path}, {temp_output_path}", flush=True)
        cleanup_temp_files(temp_input_path, temp_output_path)

