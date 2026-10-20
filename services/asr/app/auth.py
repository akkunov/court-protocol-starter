import os

from fastapi import HTTPException, Request


EXPECTED_API_KEY = os.environ.get("ASR_SERVICE_API_KEY", "")


def require_internal_api_key(request: Request) -> None:
    if not EXPECTED_API_KEY:
        return

    provided = request.headers.get("x-api-key") or request.headers.get("X-API-Key") or ""
    if provided != EXPECTED_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

