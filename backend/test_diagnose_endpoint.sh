#!/usr/bin/env bash
# Quick smoke test for POST /diagnose.
#
# Start the server first (from backend/):
#   venv/bin/uvicorn app.main:app --reload
#
# Then run this script (from backend/):
#   ./test_diagnose_endpoint.sh

set -euo pipefail

HOST="${1:-http://127.0.0.1:8000}"

curl -sf -X POST "$HOST/diagnose" \
  -H "Content-Type: application/json" \
  --data @app/engine/sample_attempt.json \
  | python3 -m json.tool
