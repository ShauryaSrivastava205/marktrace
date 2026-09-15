from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .engine.diagnose import diagnose
from .engine.models import Attempt, VerifyProbeRequest, VerifyRequest
from .engine.verify import PROBE_BANK, grade

app = FastAPI(title="MarkTrace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/diagnose")
def diagnose_endpoint(attempt: Attempt) -> dict:
    return diagnose(attempt)


@app.post("/verify/probe")
def verify_probe_endpoint(request: VerifyProbeRequest) -> dict:
    # PROBE_BANK is a flat mock for now, so this ignores root/downstream
    # filtering until the real question bank (keyed by concept) lands.
    return {
        question_id: {k: v for k, v in probe.items() if k != "correct"}
        for question_id, probe in PROBE_BANK.items()
    }


@app.post("/verify/grade")
def verify_grade_endpoint(request: VerifyRequest) -> dict:
    return grade(request.root_concept_id, request.downstream_concept_id, request.answers)
