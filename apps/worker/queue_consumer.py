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
    return redis.Redis.from_url(redis_url, decode_responses=True)


def _handle_job(payload: Dict[str, Any]) -> None:
    # Dispatch to Celery task (real processing lives there)
    from tasks.process_job import process_job

    process_job.delay(payload)


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
    _redis_client = _get_redis_client()
    print("[worker] queue consumer started")

    while not _stop:
        try:
            item = _redis_client.blpop(JOB_QUEUE_KEY_V1, timeout=5)  # type: ignore[union-attr]
            if not item:
                continue

            _key, raw = item
            payload = json.loads(raw)
            _handle_job(payload)
        except Exception as e:
            print(f"[worker] consumer error: {e}")
            time.sleep(1)

    _close()


