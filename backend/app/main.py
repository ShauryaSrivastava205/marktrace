"""HTTP API for MarkTrace's diagnostic and verification engine."""

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .engine.diagnose import diagnose
from .engine.models import Attempt, VerifyProbeRequest, VerifyRequest
from .engine.verify import get_probe, grade


def cors_origins() -> list[str]:
    """Return the explicitly allowed frontend origins.

    Set MARKTRACE_CORS_ORIGINS to a comma-separated list when deploying, for
    example: https://marktrace.vercel.app,http://localhost:3000.
    """

    configured = os.getenv("MARKTRACE_CORS_ORIGINS", "http://localhost:3000")
    origins = [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]
    if not origins:
        raise RuntimeError("MARKTRACE_CORS_ORIGINS must contain at least one origin")
    return origins


app = FastAPI(title="MarkTrace API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/diagnose")
def diagnose_endpoint(attempt: Attempt) -> dict:
    return diagnose(attempt)


@app.post("/verify/probe")
def verify_probe_endpoint(request: VerifyProbeRequest) -> dict:
    try:
        return get_probe(request.root_concept_id, request.downstream_concept_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.post("/verify/grade")
def verify_grade_endpoint(request: VerifyRequest) -> dict:
    try:
        return grade(request.root_concept_id, request.downstream_concept_id, request.answers)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
