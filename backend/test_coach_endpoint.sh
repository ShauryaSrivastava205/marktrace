#!/usr/bin/env bash
# Quick smoke test for POST /coach.
#
# Start the server first (from backend/):
#   venv/bin/uvicorn app.main:app --reload
#
# Then run this script (from backend/):
#   ./test_coach_endpoint.sh
#
# Feeds a real /diagnose response into /coach, so the coach only ever sees
# facts the diagnosis engine actually produced. If GEMINI_API_KEY isn't set
# on the server, this correctly gets back a 503 "coach unavailable".

set -euo pipefail

HOST="${1:-http://127.0.0.1:8000}"

DIAGNOSIS=$(curl -sf -X POST "$HOST/diagnose" \
  -H "Content-Type: application/json" \
  --data @app/engine/sample_attempt.json)

COACH_INPUT=$(echo "$DIAGNOSIS" | python3 -c '
import json, sys

d = json.load(sys.stdin)
print(json.dumps({
    "root_gaps": d["root_gaps"],
    "concept_mastery": d["concept_mastery"],
    "explanation": d["explanation"],
    "evidence_sufficient": d["evidence_sufficient"],
}))
')

RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$HOST/coach" \
  -H "Content-Type: application/json" \
  --data "$COACH_INPUT")

echo "HTTP $(tail -n1 <<< "$RESPONSE")"
sed '$d' <<< "$RESPONSE" | python3 -m json.tool
