from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .engine.diagnose import diagnose
from .engine.models import Attempt

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
