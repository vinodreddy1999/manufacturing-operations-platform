#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"

echo "GET /"
curl -fsS "$BASE_URL" >/dev/null

echo "GET /health"
curl -fsS "$BASE_URL/health"
echo

TOKEN="$(
  curl -fsS -X POST "$BASE_URL/runtime/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"super@mop.local","password":"SuperAdmin123!"}' |
    python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["access_token"])'
)"
echo "login: ok"

echo "GET /runtime/users"
curl -fsS "$BASE_URL/runtime/users" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "POST /runtime/records"
curl -fsS -X POST "$BASE_URL/runtime/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"module_key":"inventory","record_type":"finished_good","record_code":"FG-VALIDATION","name":"Validation Finished Good","status":"AVAILABLE","quantity":25,"payload":{"uom":"ea","reorder_level":10,"warehouse":"WH-A"}}' >/dev/null

echo "GET /runtime/analytics/summary"
curl -fsS "$BASE_URL/runtime/analytics/summary" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "GET /runtime/audit-logs"
curl -fsS "$BASE_URL/runtime/audit-logs" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "fullstack validation: ok"
