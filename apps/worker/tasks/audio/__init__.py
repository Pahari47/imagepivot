from typing import Any, Dict

print("[ROUTE-MODULE] Importing trim_audio_task...", flush=True)
from tasks.audio.trim import trim_audio_task
print("[ROUTE-MODULE] trim_audio_task imported successfully", flush=True)
print("[ROUTE-MODULE] Importing convert_audio_task...", flush=True)
from tasks.audio.convert import convert_audio_task
print("[ROUTE-MODULE] convert_audio_task imported successfully", flush=True)


def route_audio_feature(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Route audio feature requests to appropriate handler based on featureSlug.
    """
    import sys
    
    feature_slug = payload.get("featureSlug", "")
    job_id = payload.get("jobId", "unknown")
    params = payload.get("params", {})
    
    print(f"[ROUTE] ========== ROUTING AUDIO FEATURE ==========", flush=True)
    print(f"[ROUTE] Job ID: {job_id}", flush=True)
    print(f"[ROUTE] Feature Slug: '{feature_slug}'", flush=True)
    print(f"[ROUTE] Params: {params}", flush=True)
    print(f"[ROUTE] Available handlers: trim, convert", flush=True)
    
    if feature_slug == "audio.trim":
        print(f"[ROUTE] Routing to trim_audio_task", flush=True)
        return trim_audio_task(payload)
    elif feature_slug == "audio.convert":
        print(f"[ROUTE] Routing to convert_audio_task", flush=True)
        return convert_audio_task(payload)
    else:
        error_msg = f"Unknown audio feature: {feature_slug}"
        print(f"[ROUTE] ========== ERROR ==========", flush=True)
        print(f"[ROUTE] {error_msg}", flush=True)
        print(f"[ROUTE] Received featureSlug: '{feature_slug}'", flush=True)
        print(f"[ROUTE] Payload keys: {list(payload.keys())}", flush=True)
        print(f"[ROUTE] ==========================", flush=True)
        raise ValueError(error_msg)

