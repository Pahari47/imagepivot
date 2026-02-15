import os
from fastapi import FastAPI
import threading

from queue_consumer import run_queue_consumer, request_stop

app = FastAPI()

_consumer_thread: threading.Thread | None = None

@app.on_event("startup")
def _startup():
    # Minimal dev-friendly background consumer.
    # In production, run this as a separate worker process instead of a FastAPI thread.
    global _consumer_thread
    _consumer_thread = threading.Thread(target=run_queue_consumer, daemon=True)
    _consumer_thread.start()


@app.on_event("shutdown")
def _shutdown():
    request_stop()
    if _consumer_thread is not None:
        _consumer_thread.join(timeout=5)

@app.get("/")
def read_root():
    return {"status": "Worker is running", "port": os.getenv("PORT", "8000")}

@app.get("/health")
def health_check():
    return {"status": "healthy"}