"""Chains Stage 1 -> Stage 2 -> Stage 3 -> Stage 4 -> Stage 5 on the sample
attempt and prints each root with its confidence tier.

Run with: python -m app.engine.run_stage5  (from backend/)
"""

import json
from pathlib import Path

from .models import Attempt
from .stage1_evidence_gate import gate
from .stage2_concept_weakness import concept_weakness
from .stage3_candidates import candidate_root_causes
from .stage4_root_selection import select_root_causes
from .stage5_confidence import add_confidence

SAMPLE_PATH = Path(__file__).resolve().parent / "sample_attempt.json"


def main() -> None:
    with SAMPLE_PATH.open() as f:
        attempt = Attempt.model_validate(json.load(f))

    conceptual_evidence, excluded = gate(attempt)
    weakness = concept_weakness(attempt)
    candidates = candidate_root_causes(weakness)
    roots = select_root_causes(candidates)
    scored_roots = add_confidence(roots, weakness)

    print(f"Root-cause analysis for student: {attempt.student_id}")
    print(
        f"Stage 1: {len(conceptual_evidence)} conceptual-evidence answers, "
        f"{len(excluded)} excluded"
    )
    weak_concepts = sorted(c for c, info in weakness.items() if info["status"] == "weak")
    print(f"Stage 2: weak concepts = {weak_concepts}")
    print(f"Stage 3: {len(candidates)} candidate root causes considered")
    print(f"Stage 4: {len(scored_roots)} selected root cause(s)\n")

    print("Stage 5: confidence tiers")
    for i, root in enumerate(scored_roots, start=1):
        print(
            f"  {i}. {root['concept_id']} (level {root['level']}) -> "
            f"{root['confidence']} (support={root['support']}) explains {root['explains']}"
        )


if __name__ == "__main__":
    main()
