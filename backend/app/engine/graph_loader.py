"""Loads the DSA concept graph and answers questions about prerequisite structure.

Edge convention (see data/dsa_concept_graph.json._notes): each edge is
{from: PREREQUISITE, to: DEPENDENT} — you must understand `from` before `to`.
The root-cause engine only ever walks CONCEPTUAL edges; IMPLEMENTATION and
PEDAGOGICAL edges are ignored here.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

GRAPH_PATH = Path(__file__).resolve().parents[3] / "data" / "dsa_concept_graph.json"


@lru_cache(maxsize=1)
def _load_raw() -> dict[str, Any]:
    with GRAPH_PATH.open() as f:
        return json.load(f)


def get_all_nodes() -> list[dict[str, Any]]:
    """Every concept node in the graph, e.g. {"id": "recursion", "label": ..., "level": ...}."""
    return _load_raw()["nodes"]


def get_conceptual_edges() -> list[dict[str, Any]]:
    """Only edges where relation_type == 'CONCEPTUAL' — the ones diagnosis is allowed to traverse."""
    return [e for e in _load_raw()["edges"] if e["relation_type"] == "CONCEPTUAL"]


@lru_cache(maxsize=1)
def _node_map() -> dict[str, dict[str, Any]]:
    return {node["id"]: node for node in get_all_nodes()}


def get_level(concept_id: str) -> int:
    """A concept's depth in the conceptual DAG (1 = root, no conceptual prerequisites)."""
    return _node_map()[concept_id]["level"]


@lru_cache(maxsize=1)
def _parent_map() -> dict[str, list[str]]:
    """concept_id -> list of its direct CONCEPTUAL prerequisites (edge.from for edge.to == concept_id)."""
    parents: dict[str, list[str]] = {}
    for edge in get_conceptual_edges():
        parents.setdefault(edge["to"], []).append(edge["from"])
    return parents


@lru_cache(maxsize=1)
def _child_map() -> dict[str, list[str]]:
    """concept_id -> list of concepts that directly depend on it (edge.to for edge.from == concept_id)."""
    children: dict[str, list[str]] = {}
    for edge in get_conceptual_edges():
        children.setdefault(edge["from"], []).append(edge["to"])
    return children


def _walk(start: str, adjacency: dict[str, list[str]]) -> list[str]:
    """Cycle-safe BFS over `adjacency`, returning every reachable node except `start` itself."""
    visited: set[str] = {start}
    result: list[str] = []
    queue = list(adjacency.get(start, []))
    while queue:
        node = queue.pop(0)
        if node in visited:
            continue
        visited.add(node)
        result.append(node)
        queue.extend(adjacency.get(node, []))
    return result


def get_conceptual_ancestors(concept_id: str) -> list[str]:
    """Every concept that must be understood before `concept_id` (transitively), via CONCEPTUAL edges only."""
    return _walk(concept_id, _parent_map())


def get_conceptual_descendants(concept_id: str) -> list[str]:
    """Every concept that transitively depends on `concept_id`, via CONCEPTUAL edges only."""
    return _walk(concept_id, _child_map())


@lru_cache(maxsize=1)
def _edge_strength_map() -> dict[tuple[str, str], str]:
    return {(e["from"], e["to"]): e["strength"] for e in get_conceptual_edges()}


def get_edge_strength(from_id: str, to_id: str) -> str | None:
    """Strength ('STRONG' or 'SOFT') of the direct CONCEPTUAL edge from_id -> to_id, or None if no such edge exists."""
    return _edge_strength_map().get((from_id, to_id))
