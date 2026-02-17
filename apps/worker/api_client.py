import os
from typing import Any, Dict, Optional

import requests


def _api_base_url() -> str:
    # Expected: http://localhost:4000/api
    return os.getenv("API_BASE_URL", "http://localhost:4000/api").rstrip("/")


def _worker_api_key() -> str:
    key = os.getenv("WORKER_API_KEY", "")
    if not key:
        raise RuntimeError("WORKER_API_KEY not configured in worker env")
    return key


def post_job_status(
    job_id: str,
    status: str,
    error: Optional[str] = None,
    output: Optional[Dict[str, Any]] = None,
    worker_id: Optional[str] = None,
) -> None:
    url = f"{_api_base_url()}/jobs/internal/{job_id}/status"
    headers = {"x-worker-api-key": _worker_api_key()}
    payload: Dict[str, Any] = {"status": status}

    if error:
        payload["error"] = error
    if output:
        payload["output"] = output
    if worker_id:
        payload["workerId"] = worker_id

    print(f"[API_CLIENT] Updating job status: jobId={job_id}, status={status}, url={url}")
    
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        print(f"[API_CLIENT] Job status updated successfully: jobId={job_id}, status={status}")
    except requests.exceptions.RequestException as e:
        print(f"[API_CLIENT] ERROR: Failed to update job status: jobId={job_id}, error={e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"[API_CLIENT] Response status: {e.response.status_code}")
            print(f"[API_CLIENT] Response body: {e.response.text}")
        raise




