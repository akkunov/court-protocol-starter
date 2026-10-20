import hmac
import os

from fastapi import HTTPException, Request


def require_internal_api_key(request: Request) -> None:
    expected = os.environ.get("ASR_SERVICE_API_KEY", "")

    # Fail closed. A missing/default key must never make the ASR endpoint public.
    if not expected or expected == "change-me" or expected.startswith("replace-with-"):
        raise HTTPException(
            status_code=503,
            detail="ASR_SERVICE_API_KEY is not configured",
        )

    provided = request.headers.get("x-api-key", "")
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")
