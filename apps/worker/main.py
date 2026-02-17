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
    print("[MAIN] FastAPI startup event triggered")
    print("[MAIN] Starting queue consumer thread...")
    
    try:
        _consumer_thread = threading.Thread(target=run_queue_consumer, daemon=True)
        _consumer_thread.start()
        print("[MAIN] Queue consumer thread started successfully")
    except Exception as e:
        print(f"[MAIN] ERROR: Failed to start queue consumer thread: {e}")
        import traceback
        traceback.print_exc()
        raise


@app.on_event("shutdown")
def _shutdown():
    request_stop()
    if _consumer_thread is not None:
        _consumer_thread.join(timeout=5)

@app.get("/")
def read_root():
    global _consumer_thread
    consumer_status = "running" if _consumer_thread and _consumer_thread.is_alive() else "not running"
    return {
        "status": "Worker is running",
        "port": os.getenv("PORT", "8000"),
        "queue_consumer": consumer_status
    }

@app.get("/health")
def health_check():
    global _consumer_thread
    consumer_status = "running" if _consumer_thread and _consumer_thread.is_alive() else "not running"
    return {
        "status": "healthy",
        "queue_consumer": consumer_status
    }