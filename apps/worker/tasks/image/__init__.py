from typing import Any, Dict

print("[ROUTE-MODULE] Importing resize_image_task...", flush=True)
from tasks.image.resize import resize_image_task
print("[ROUTE-MODULE] Importing compress_image_task...", flush=True)
from tasks.image.compress import compress_image_task
print("[ROUTE-MODULE] Importing convert_image_task...", flush=True)
try:
    from tasks.image.convert import convert_image_task
    print("[ROUTE-MODULE] convert_image_task imported successfully", flush=True)
except Exception as import_err:
    print(f"[ROUTE-MODULE] ERROR importing convert_image_task: {import_err}", flush=True)
    import traceback
    traceback.print_exc()
    raise
print("[ROUTE-MODULE] Importing quality_control_task...", flush=True)
from tasks.image.quality import quality_control_task


def route_image_feature(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Route image feature requests to appropriate handler based on featureSlug.
    """
    import sys
    
    feature_slug = payload.get("featureSlug", "")
    job_id = payload.get("jobId", "unknown")
    params = payload.get("params", {})
    
    print(f"[ROUTE] ========== ROUTING IMAGE FEATURE ==========", flush=True)
    print(f"[ROUTE] Job ID: {job_id}", flush=True)
    print(f"[ROUTE] Feature Slug: '{feature_slug}'", flush=True)
    print(f"[ROUTE] Params: {params}", flush=True)
    print(f"[ROUTE] Available handlers: resize, compress, convert, convert-jpg, quality", flush=True)
    
    if feature_slug == "image.resize":
        print(f"[ROUTE] Routing to resize_image_task", flush=True)
        return resize_image_task(payload)
    elif feature_slug == "image.compress":
        print(f"[ROUTE] Routing to compress_image_task", flush=True)
        return compress_image_task(payload)
    elif feature_slug == "image.convert":
        print(f"[ROUTE] Routing to convert_image_task (PNG)", flush=True)
        return convert_image_task(payload)
    elif feature_slug == "image.convert-jpg":
        print(f"[ROUTE] Routing to convert_image_task (JPG)", flush=True)
        print(f"[ROUTE] About to call convert_image_task with payload keys: {list(payload.keys())}", flush=True)
        try:
            result = convert_image_task(payload)
            print(f"[ROUTE] convert_image_task returned successfully", flush=True)
            return result
        except Exception as route_err:
            print(f"[ROUTE] ========== ERROR CALLING convert_image_task ==========", flush=True)
            print(f"[ROUTE] Error Type: {type(route_err).__name__}", flush=True)
            print(f"[ROUTE] Error Message: {str(route_err)}", flush=True)
            import traceback
            traceback.print_exc(file=sys.stdout)
            sys.stdout.flush()
            print(f"[ROUTE] ======================================================", flush=True)
            raise
    elif feature_slug == "image.quality":
        print(f"[ROUTE] Routing to quality_control_task", flush=True)
        return quality_control_task(payload)
    else:
        error_msg = f"Unknown image feature: {feature_slug}"
        print(f"[ROUTE] ========== ERROR ==========", flush=True)
        print(f"[ROUTE] {error_msg}", flush=True)
        print(f"[ROUTE] Received featureSlug: '{feature_slug}'", flush=True)
        print(f"[ROUTE] Payload keys: {list(payload.keys())}", flush=True)
        print(f"[ROUTE] ==========================", flush=True)
        raise ValueError(error_msg)

