"""Offline local ASR starter for uploaded recordings.

This endpoint intentionally accepts a server-side storage key rather than an
arbitrary filesystem path. The storage-key resolver and auth between NestJS
and this service must be implemented before exposing the service to the app.
"""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from faster_whisper import WhisperModel

from app.auth import require_internal_api_key

app = FastAPI(title="Court Protocol Local ASR", docs_url=None, redoc_url=None)

MODEL_PATH = os.environ.get("ASR_MODEL_PATH", "/models/large-v3")
DEVICE = os.environ.get("ASR_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("ASR_COMPUTE_TYPE", "int8")
STORAGE_ROOT = Path(os.environ.get("COURT_STORAGE_ROOT", "/srv/court-protocol-storage")).resolve()

model = WhisperModel(
    MODEL_PATH,
    device=DEVICE,
    compute_type=COMPUTE_TYPE,
    local_files_only=True,
)


class TranscriptionRequest(BaseModel):
    storage_key: str = Field(min_length=1, max_length=500)
    language: str = Field(default="ky", pattern="^(ky|ru)$")


def resolve_storage_key(storage_key: str) -> Path:
    candidate = (STORAGE_ROOT / storage_key).resolve()
    if not candidate.is_relative_to(STORAGE_ROOT):
        raise HTTPException(status_code=403, detail="Invalid storage key")
    if not candidate.is_file():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return candidate


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engine": "faster-whisper", "mode": "offline"}


@app.post("/internal/transcribe")
def transcribe(request: TranscriptionRequest, request_obj: Request) -> dict:
    require_internal_api_key(request_obj)
    audio_path = resolve_storage_key(request.storage_key)
    try:
        segments, info = model.transcribe(
            str(audio_path),
            language=request.language,
            beam_size=5,
            vad_filter=True,
            condition_on_previous_text=False,
        )
        transcript = [
            {
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip(),
            }
            for segment in segments
        ]
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Audio transcription failed") from exc

    return {
        "language": info.language,
        "durationSeconds": info.duration,
        "segments": transcript,
    }
