import os
import sys
import logging

from celery import Celery
from celery.signals import setup_logging


def _redis_url() -> str:
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")


celery_app = Celery(
    "imagepivot_worker",
    broker=_redis_url(),
    backend=_redis_url(),
    include=["tasks.process_job", "tasks.image"],
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
    worker_hijack_root_logger=False,
    worker_log_color=False,
)


@setup_logging.connect
def config_loggers(*args, **kwargs):
    """Configure logging to ensure stdout/stderr are visible."""
    # Force unbuffered output
    sys.stdout.reconfigure(line_buffering=True) if hasattr(sys.stdout, 'reconfigure') else None
    sys.stderr.reconfigure(line_buffering=True) if hasattr(sys.stderr, 'reconfigure') else None
    
    # Configure root logger to show INFO and above
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Ensure console handler outputs to stdout/stderr
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)




