import os
from typing import Optional, Tuple

import boto3


def _r2_client():
    endpoint = os.getenv("R2_ENDPOINT")
    access_key = os.getenv("R2_ACCESS_KEY_ID")
    secret_key = os.getenv("R2_SECRET_ACCESS_KEY")

    if not endpoint or not access_key or not secret_key:
        raise RuntimeError("R2 credentials not configured (R2_ENDPOINT/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY)")

    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )


def _bucket() -> str:
    return os.getenv("R2_BUCKET_NAME", "imagepivot-uploads")


def head_object(key: str) -> Tuple[int, Optional[str]]:
    s3 = _r2_client()
    resp = s3.head_object(Bucket=_bucket(), Key=key)
    size_bytes = int(resp.get("ContentLength", 0))
    content_type = resp.get("ContentType")
    return size_bytes, content_type


def download_file(key: str, local_path: str) -> None:
    s3 = _r2_client()
    s3.download_file(_bucket(), key, local_path)


def upload_file(local_path: str, key: str, content_type: Optional[str] = None) -> None:
    s3 = _r2_client()
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type
    s3.upload_file(local_path, _bucket(), key, ExtraArgs=extra_args if extra_args else None)


def copy_object(src_key: str, dest_key: str, content_type: Optional[str] = None) -> int:
    """
    Server-side copy within the same bucket. Returns output size in bytes.
    """
    s3 = _r2_client()
    copy_source = {"Bucket": _bucket(), "Key": src_key}

    kwargs = {
        "Bucket": _bucket(),
        "Key": dest_key,
        "CopySource": copy_source,
    }
    if content_type:
        kwargs["ContentType"] = content_type
        kwargs["MetadataDirective"] = "REPLACE"

    s3.copy_object(**kwargs)
    size_bytes, _ = head_object(dest_key)
    return size_bytes




