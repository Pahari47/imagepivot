from typing import Any, Dict

from celery_app import celery_app


@celery_app.task(name="jobs.process_job")
def process_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main job dispatcher that routes jobs to appropriate handlers based on mediaType.
    """
    job_id = payload.get("jobId", "unknown")
    media_type = payload.get("mediaType", "").upper()
    feature_slug = payload.get("featureSlug", "unknown")
    
    print(f"[CELERY] Processing job: jobId={job_id}, mediaType={media_type}, featureSlug={feature_slug}")
    print(f"[CELERY] Full payload keys: {list(payload.keys())}")
    
    try:
        if media_type == "IMAGE":
            print(f"[CELERY] Routing to image feature handler: {feature_slug}")
            from tasks.image import route_image_feature
            result = route_image_feature(payload)
            print(f"[CELERY] Job {job_id} completed successfully")
            return result
        elif media_type == "AUDIO":
            raise NotImplementedError("Audio features not yet implemented")
        elif media_type == "VIDEO":
            raise NotImplementedError("Video features not yet implemented")
        else:
            raise ValueError(f"Unknown media type: {media_type}")
    except Exception as e:
        print(f"[CELERY] ERROR: Job {job_id} failed: {e}")
        import traceback
        traceback.print_exc()
        raise




