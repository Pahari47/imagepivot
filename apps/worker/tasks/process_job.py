import os
from typing import Any, Dict

from celery_app import celery_app
from api_client import post_job_status
from r2_storage import copy_object, head_object


@celery_app.task(name="jobs.process_job")
def process_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Minimal processing pipeline:
    - mark PROCESSING
    - copy input object -> output object in R2 (placeholder for real processing)
    - mark COMPLETED (or FAILED)
    """
    job_id = payload.get("jobId")
    org_id = payload.get("orgId")
    input_obj = payload.get("input", {})
    input_key = input_obj.get("key")
    input_mime = input_obj.get("mimeType")

    worker_id = os.getenv("WORKER_ID")

    if not job_id or not org_id or not input_key:
        raise ValueError("Invalid payload: missing jobId/orgId/input.key")

    try:
        post_job_status(job_id=job_id, status="PROCESSING", worker_id=worker_id)

        # Placeholder output key. Real features should generate correct extension/name.
        output_key = f"outputs/{org_id}/{job_id}/output"

        # Prefer server-side copy (fast) vs download+upload.
        if not input_mime:
            _, input_mime = head_object(input_key)

        output_size_bytes = copy_object(src_key=input_key, dest_key=output_key, content_type=input_mime)

        post_job_status(
            job_id=job_id,
            status="COMPLETED",
            worker_id=worker_id,
            output={
                "key": output_key,
                "mimeType": input_mime or "application/octet-stream",
                "sizeBytes": output_size_bytes,
            },
        )

        return {"jobId": job_id, "status": "COMPLETED", "outputKey": output_key}
    except Exception as e:
        try:
            post_job_status(job_id=job_id, status="FAILED", error=str(e), worker_id=worker_id)
        except Exception:
            # If API callback fails, still raise original error for Celery visibility.
            pass
        raise




