"""Stage 5 of the root-cause engine: confidence tiers for the roots Stage 4
selected.

Two signals feed the tier:
  - support: how much gated evidence backs the root's explanation — the sum
    of weak_wrong (conceptual/procedural failures, from Stage 2) across
    every concept the root explains. More failed items pointing at the
    explanation is stronger corroboration.
  - relies_on_soft: whether reaching every explained concept from the root
    requires crossing at least one SOFT conceptual edge somewhere along the
    way. SOFT means "a real but mild dependency" (see the graph's _notes),
    so an explanation that only holds together via a soft link is less
    certain than one built entirely of STRONG edges.

HIGH is intentionally unreachable here — it's reserved for a future Verify
step (e.g. a targeted follow-up question actually confirming the gap),
not something inferable from Stage 1-4 evidence alone.
"""

from .graph_loader import get_conceptual_edges, get_edge_strength

SUPPORT_INSUFFICIENT_MAX = 1
SUPPORT_LOW = 2
SUPPORT_MEDIUM_MIN = 3


def _direct_children(concept_id: str) -> set[str]:
    return {edge["to"] for edge in get_conceptual_edges() if edge["from"] == concept_id}


def _all_strong_reachable(root_id: str) -> set[str]:
    """Every concept reachable from root_id via a path made entirely of STRONG
    conceptual edges (includes root_id itself)."""
    visited = {root_id}
    queue = [root_id]
    while queue:
        node = queue.pop(0)
        for child in _direct_children(node):
            if child in visited:
                continue
            if get_edge_strength(node, child) == "STRONG":
                visited.add(child)
                queue.append(child)
    return visited


def _relies_on_soft(root_id: str, explained: list[str]) -> bool:
    """True if any explained concept is unreachable from root_id via an
    all-STRONG path — i.e. every path down to it crosses a SOFT edge."""
    strong_reachable = _all_strong_reachable(root_id)
    return any(concept_id not in strong_reachable for concept_id in explained)


def _tier(support: int, relies_on_soft: bool) -> str:
    if support <= SUPPORT_INSUFFICIENT_MAX:
        return "INSUFFICIENT"
    if support == SUPPORT_LOW or relies_on_soft:
        return "LOW"
    if support >= SUPPORT_MEDIUM_MIN and not relies_on_soft:
        return "MEDIUM"
    # HIGH is unreachable here — see module docstring.
    raise AssertionError(f"unreachable tier for support={support}, relies_on_soft={relies_on_soft}")


def add_confidence(roots: list[dict], weakness: dict[str, dict]) -> list[dict]:
    """Attach {confidence, support} to each Stage 4 root, using Stage 2's
    per-concept weakness map and the graph's conceptual edge strengths."""
    scored: list[dict] = []
    for root in roots:
        support = sum(weakness[concept_id]["weak_wrong"] for concept_id in root["explains"])
        relies_on_soft = _relies_on_soft(root["concept_id"], root["explains"])
        scored.append({**root, "confidence": _tier(support, relies_on_soft), "support": support})
    return scored
