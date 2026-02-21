from typing import Any, Dict

from celery_app import celery_app


@celery_app.task(name="jobs.process_job")
def process_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main job dispatcher that routes jobs to appropriate handlers based on mediaType.
    """
    import sys
    import os
    
    # Force stdout/stderr to be unbuffered so logs appear immediately
    sys.stdout.flush()
    sys.stderr.flush()
    
    job_id = payload.get("jobId", "unknown")
    media_type = payload.get("mediaType", "").upper()
    feature_slug = payload.get("featureSlug", "unknown")
    params = payload.get("params", {})
    
    print(f"[CELERY] ========== PROCESSING JOB ==========", flush=True)
    print(f"[CELERY] Job ID: {job_id}", flush=True)
    print(f"[CELERY] Media Type: {media_type}", flush=True)
    print(f"[CELERY] Feature Slug: {feature_slug}", flush=True)
    print(f"[CELERY] Params: {params}", flush=True)
    print(f"[CELERY] Full payload keys: {list(payload.keys())}", flush=True)
    print(f"[CELERY] ====================================", flush=True)
    
    try:
        if media_type == "IMAGE":
            print(f"[CELERY] Routing to image feature handler: {feature_slug}", flush=True)
            from tasks.image import route_image_feature
            result = route_image_feature(payload)
            print(f"[CELERY] Job {job_id} completed successfully", flush=True)
            return result
        elif media_type == "AUDIO":
            raise NotImplementedError("Audio features not yet implemented")
        elif media_type == "VIDEO":
            raise NotImplementedError("Video features not yet implemented")
        else:
            raise ValueError(f"Unknown media type: {media_type}")
    except Exception as e:
        print(f"[CELERY] ========== ERROR ==========", flush=True)
        print(f"[CELERY] Job ID: {job_id}", flush=True)
        print(f"[CELERY] Error Type: {type(e).__name__}", flush=True)
        print(f"[CELERY] Error Message: {str(e)}", flush=True)
        import traceback
        print(f"[CELERY] Full Traceback:", flush=True)
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()
        sys.stderr.flush()
        print(f"[CELERY] ==========================", flush=True)
        raise




