"""Chains Stage 1 -> Stage 2 -> Stage 3 on the sample attempt and prints the
candidate root causes.

Run with: python -m app.engine.run_stage3  (from backend/)
"""

import json
from pathlib import Path

from .models import Attempt
from .stage1_evidence_gate import gate
from .stage2_concept_weakness import concept_weakness
from .stage3_candidates import candidate_root_causes

SAMPLE_PATH = Path(__file__).resolve().parent / "sample_attempt.json"


def main() -> None:
    with SAMPLE_PATH.open() as f:
        attempt = Attempt.model_validate(json.load(f))

    conceptual_evidence, excluded = gate(attempt)
    weakness = concept_weakness(attempt)
    candidates = candidate_root_causes(weakness)

    print(f"Root-cause analysis for student: {attempt.student_id}")
    print(
        f"Stage 1: {len(conceptual_evidence)} conceptual-evidence answers, "
        f"{len(excluded)} excluded"
    )

    weak_concepts = sorted(c for c, info in weakness.items() if info["status"] == "weak")
    print(f"Stage 2: weak concepts = {weak_concepts}\n")

    print(f"Stage 3: {len(candidates)} candidate root causes")
    id_width = max(len("concept_id"), *(len(c["concept_id"]) for c in candidates)) + 2
    header = f"{'concept_id':<{id_width}}{'is_itself_weak':<16}explains"
    print(header)
    print("-" * len(header))
    for candidate in candidates:
        print(
            f"{candidate['concept_id']:<{id_width}}{str(candidate['is_itself_weak']):<16}"
            f"{candidate['explains']}"
        )


if __name__ == "__main__":
    main()
