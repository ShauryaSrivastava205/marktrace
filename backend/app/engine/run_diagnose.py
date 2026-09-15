"""Runs the full root-cause engine pipeline (Stage 1 -> 6) on the sample
attempt and prints the final diagnosis as pretty JSON.

Run with: python -m app.engine.run_diagnose  (from backend/)
"""

import json
from pathlib import Path

from .diagnose import diagnose
from .models import Attempt

SAMPLE_PATH = Path(__file__).resolve().parent / "sample_attempt.json"


def main() -> None:
    with SAMPLE_PATH.open() as f:
        attempt = Attempt.model_validate(json.load(f))

    result = diagnose(attempt)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
