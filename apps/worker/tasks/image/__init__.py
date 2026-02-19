from typing import Any, Dict

from tasks.image.resize import resize_image_task
from tasks.image.compress import compress_image_task


def route_image_feature(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Route image feature requests to appropriate handler based on featureSlug.
    """
    feature_slug = payload.get("featureSlug", "")
    
    if feature_slug == "image.resize":
        return resize_image_task(payload)
    elif feature_slug == "image.compress":
        return compress_image_task(payload)
    else:
        raise ValueError(f"Unknown image feature: {feature_slug}")

