#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"

login() {
  curl -fsS -X POST "$BASE_URL/runtime/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"super@mop.local","password":"SuperAdmin123!"}' |
    python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["access_token"])'
}

post_json() {
  path="$1"
  token="$2"
  payload="$3"
  curl -fsS -X POST "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$payload" >/dev/null
}

echo "Checking full-stack app at $BASE_URL"
curl -fsS "$BASE_URL/health"
echo

TOKEN="$(login)"
echo "Authenticated as super admin"

echo "Creating test users"
post_json "/runtime/users" "$TOKEN" '{"email":"planner.test@mop.local","name":"Planner Test User","password":"Planner123!","role":"admin","is_active":true}' || true
post_json "/runtime/users" "$TOKEN" '{"email":"viewer.test@mop.local","name":"Viewer Test User","password":"Viewer123!","role":"user","is_active":true}' || true

echo "Creating module records"
post_json "/runtime/records" "$TOKEN" '{"module_key":"inventory","record_type":"raw_material","record_code":"RM-COPPER-TEST","name":"Copper Wire Test Lot","status":"AVAILABLE","quantity":320,"payload":{"uom":"kg","reorder_level":150,"warehouse":"WH-A","bin":"A-03-02","unit_cost":740}}'
post_json "/runtime/records" "$TOKEN" '{"module_key":"inventory","record_type":"spare_part","record_code":"SP-MOTOR-TEST","name":"Servo Motor Test Spare","status":"LOW_STOCK","quantity":4,"payload":{"uom":"ea","reorder_level":8,"warehouse":"WH-B","bin":"B-02-09","unit_cost":18500}}'
post_json "/runtime/records" "$TOKEN" '{"module_key":"procurement","record_type":"purchase_requisition","record_code":"PR-TEST-001","name":"Copper replenishment request","status":"PENDING_APPROVAL","quantity":500,"payload":{"supplier":"MetalWorks Primary","lead_time_days":7,"estimated_value":370000}}'
post_json "/runtime/records" "$TOKEN" '{"module_key":"production","record_type":"work_order","record_code":"WO-TEST-001","name":"Control Panel Assembly Test","status":"SCHEDULED","quantity":60,"payload":{"line":"LINE-1","due_date":"2026-06-20","priority":"high"}}'
post_json "/runtime/records" "$TOKEN" '{"module_key":"maintenance","record_type":"work_order","record_code":"MWO-TEST-001","name":"Robot arm calibration","status":"OPEN","quantity":1,"payload":{"asset":"ROBOT-07","priority":"medium","estimated_hours":3}}'
post_json "/runtime/records" "$TOKEN" '{"module_key":"quality","record_type":"inspection_lot","record_code":"QI-TEST-001","name":"Incoming copper inspection","status":"OPEN","quantity":20,"payload":{"sample_size":5,"acceptance_level":"AQL-1.5"}}'
post_json "/runtime/records" "$TOKEN" '{"module_key":"sales","record_type":"sales_order","record_code":"SO-TEST-001","name":"Customer test dispatch order","status":"OPEN","quantity":35,"payload":{"customer":"Northwind Manufacturing","requested_date":"2026-06-22"}}'

echo "Verifying analytics"
curl -fsS "$BASE_URL/runtime/analytics/summary" -H "Authorization: Bearer $TOKEN" |
  python3 -c 'import json,sys; data=json.load(sys.stdin)["data"]; print("active_users=", data["active_users"]); print("record_counts=", data["module_record_counts"]); print("low_stock_count=", data["inventory_low_stock_count"])'

echo "Verifying audit logs"
curl -fsS "$BASE_URL/runtime/audit-logs" -H "Authorization: Bearer $TOKEN" |
  python3 -c 'import json,sys; logs=json.load(sys.stdin)["data"]; print("audit_log_count=", len(logs)); print("latest_action=", logs[0]["action"] if logs else "none")'

echo "Test data seed: ok"
