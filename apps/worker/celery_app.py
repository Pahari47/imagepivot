import os
import sys

from celery import Celery


def _redis_url() -> str:
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")


celery_app = Celery(
    "imagepivot_worker",
    broker=_redis_url(),
    backend=_redis_url(),
    include=["tasks.process_job", "tasks.image.resize"],
)

# Windows doesn't support prefork pool, use solo pool instead
pool_type = "solo" if sys.platform == "win32" else "prefork"

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    worker_pool=pool_type,
)




