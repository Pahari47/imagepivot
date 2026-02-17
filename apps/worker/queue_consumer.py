import json
import os
import time
from typing import Any, Dict

import redis

JOB_QUEUE_KEY_V1 = "imagepivot:jobs:v1"

_stop = False
_redis_client: redis.Redis | None = None


def _get_redis_client() -> redis.Redis:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    print(f"[WORKER] Creating Redis client with URL: {redis_url}")
    client = redis.Redis.from_url(redis_url, decode_responses=True)
    print(f"[WORKER] Redis client created")
    return client


def _handle_job(payload: Dict[str, Any]) -> None:
    # Dispatch to Celery task (real processing lives there)
    from tasks.process_job import process_job

    job_id = payload.get("jobId", "unknown")
    feature_slug = payload.get("featureSlug", "unknown")
    media_type = payload.get("mediaType", "unknown")
    
    print(f"[WORKER] Received job from queue: jobId={job_id}, feature={feature_slug}, mediaType={media_type}")
    
    try:
        result = process_job.delay(payload)
        print(f"[WORKER] Celery task dispatched: jobId={job_id}, taskId={result.id}")
    except Exception as e:
        print(f"[WORKER] ERROR: Failed to dispatch Celery task for job {job_id}: {e}")
        raise


def request_stop() -> None:
    global _stop
    _stop = True


def _close() -> None:
    global _redis_client
    try:
        if _redis_client is not None:
            _redis_client.close()
    except Exception:
        pass
    _redis_client = None


def run_queue_consumer() -> None:
    global _redis_client
    print("[WORKER] run_queue_consumer() called")
    
    try:
        print("[WORKER] Connecting to Redis...")
        _redis_client = _get_redis_client()
        
        # Test Redis connection
        _redis_client.ping()
        print("[WORKER] Redis connection successful")
        
        print(f"[WORKER] Queue consumer started, listening on: {JOB_QUEUE_KEY_V1}")
    except Exception as e:
        print(f"[WORKER] ERROR: Failed to connect to Redis: {e}")
        import traceback
        traceback.print_exc()
        raise

    while not _stop:
        try:
            item = _redis_client.blpop(JOB_QUEUE_KEY_V1, timeout=5)  # type: ignore[union-attr]
            if not item:
                continue

            _key, raw = item
            print(f"[WORKER] Received item from queue: key={_key}, size={len(raw)} bytes")
            
            try:
                payload = json.loads(raw)
                print(f"[WORKER] Parsed payload: jobId={payload.get('jobId')}, featureSlug={payload.get('featureSlug')}")
                _handle_job(payload)
            except json.JSONDecodeError as e:
                print(f"[WORKER] ERROR: Failed to parse JSON payload: {e}")
                print(f"[WORKER] Raw payload (first 200 chars): {raw[:200]}")
            except Exception as e:
                print(f"[WORKER] ERROR: Failed to handle job: {e}")
                import traceback
                traceback.print_exc()
        except Exception as e:
            print(f"[WORKER] ERROR: Queue consumer error: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(1)

    print("[WORKER] Queue consumer stopping...")
    _close()


