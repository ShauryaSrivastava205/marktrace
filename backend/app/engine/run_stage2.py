"""Quick manual check for Stage 2: load the sample attempt and print each
concept's mastery table.

Run with: python -m app.engine.run_stage2  (from backend/)
"""

import json
from pathlib import Path

from .models import Attempt
from .stage2_concept_weakness import concept_weakness

SAMPLE_PATH = Path(__file__).resolve().parent / "sample_attempt.json"


def main() -> None:
    with SAMPLE_PATH.open() as f:
        attempt = Attempt.model_validate(json.load(f))

    weakness = concept_weakness(attempt)

    print(f"Concept weakness for student: {attempt.student_id}\n")

    header = f"{'concept_id':<16}{'strength':<10}{'weak_wrong':<12}{'mastery':<10}{'status':<12}"
    print(header)
    print("-" * len(header))

    for concept_id in sorted(weakness):
        row = weakness[concept_id]
        mastery_str = "N/A" if row["mastery"] is None else f"{row['mastery']:.2f}"
        print(
            f"{concept_id:<16}{row['strength']:<10}{row['weak_wrong']:<12}"
            f"{mastery_str:<10}{row['status']:<12}"
        )


if __name__ == "__main__":
    main()
