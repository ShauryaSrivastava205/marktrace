import json
import unittest

from app.engine.graph_loader import GRAPH_PATH, get_all_nodes
from app.ingestion.codeforces import _TAG_MAP_PATH, load_tag_map


class CodeforcesTagMapTests(unittest.TestCase):
    def test_every_mapped_concept_id_exists_in_the_graph(self):
        valid_ids = {node["id"] for node in get_all_nodes()}
        invalid = {
            tag: [cid for cid in concept_ids if cid not in valid_ids]
            for tag, concept_ids in load_tag_map().items()
            if any(cid not in valid_ids for cid in concept_ids)
        }
        self.assertEqual(
            invalid,
            {},
            f"tag map references concept ids missing from {GRAPH_PATH.name}",
        )

    def test_every_section_of_the_map_file_is_covered_by_the_loader(self):
        # load_tag_map only reads "confirmed" and "reconcile"; a new section
        # would silently escape the membership check above.
        raw = json.loads(_TAG_MAP_PATH.read_text(encoding="utf-8"))
        mapping_sections = {
            key
            for key, value in raw.items()
            if isinstance(value, dict) and not key.startswith("_")
        }
        self.assertLessEqual(mapping_sections, {"confirmed", "reconcile"})

    def test_a_tag_is_never_both_mapped_and_deliberately_unmapped(self):
        raw = json.loads(_TAG_MAP_PATH.read_text(encoding="utf-8"))
        overlap = set(load_tag_map()) & set(raw.get("deliberately_unmapped", []))
        self.assertEqual(overlap, set())


if __name__ == "__main__":
    unittest.main()
