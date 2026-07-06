# Vinod Company Scale Data, Sync, and Visualization Test Report

Generated: 2026-07-06  
Test company: `vinod`  
Company ID: `company-vinod`  
Docker service tested: `metam-services-platform-api-1`  
Database: PostgreSQL container from Docker Compose  
Seed script: `scripts/seed_vinod_scale_data.py`

## 1. What Was Created

The scale test created a full Vinod company dataset designed to exercise the platform under realistic operational volume.

| Area | Result |
|---|---:|
| Base operational rows requested | 100,000 |
| Simulated live rows added | 1,000 |
| Total Vinod module records after run | 101,000 |
| Plants created for Vinod | 3 |
| Data Hub source connections | 4 |
| Data catalog entries | 4 |
| Field mapping rules | 27 |
| Data model relationships | 1 |
| Refresh run records | 1 base load plus live batch measurements |

## 2. Plant Distribution

| Plant ID | Records |
|---|---:|
| `plant-vinod-main` | 33,666 |
| `plant-vinod-assembly` | 33,668 |
| `plant-vinod-distribution` | 33,666 |

This proves that plant-level filtering can be tested at meaningful scale.

## 3. Module Distribution

| Module | Records |
|---|---:|
| Inventory | 34,000 |
| Production | 18,000 |
| Warehouse | 14,000 |
| Procurement | 10,000 |
| Maintenance | 9,000 |
| Quality | 6,000 |
| Sales | 4,000 |
| Costing | 3,000 |
| Planning | 2,000 |
| Reports | 1,000 |

The Maintenance total includes 1,000 live telemetry rows.

## 4. Data Load Timing

| Step | Time |
|---|---:|
| Ensure Vinod company, plants, roles, feature flags | 0.083 sec |
| Clean previous Vinod scale rows | 0.481 sec |
| Generate 100,000 module records | 2.207 sec |
| Bulk insert 100,000 module records | 16.379 sec |
| Seed Data Hub connections/catalog/mappings | 0.002 sec |
| Commit base load | 0.034 sec |

Total backend-side base load time was about **19.186 seconds**, including generation, insert, metadata creation, and commit.

## 5. Simulated Live Refresh Timing

The test then simulated continuous machine/IoT updates in 5 batches of 200 rows each.

| Live Batch | Rows Added | Insert Time |
|---|---:|---:|
| Batch 1 | 200 | 0.024 sec |
| Batch 2 | 200 | 0.024 sec |
| Batch 3 | 200 | 0.031 sec |
| Batch 4 | 200 | 0.041 sec |
| Batch 5 | 200 | 0.037 sec |

Average live batch insert time: about **0.031 sec for 200 rows**.

Practical meaning:

- Small live refresh batches are reflected in PostgreSQL almost immediately.
- The UI will see the new records on the next React Query refetch, manual refresh, route reload, or invalidation event.
- For true live dashboards, the next step should be WebSocket/SSE push or polling intervals per module.

## 6. Frontend-Facing API Timing

These are the API reads that the frontend depends on to show records and visualizations.

| API / Use Case | Median Time | Max Time | Response Size |
|---|---:|---:|---:|
| Health check | 0.005 sec | 0.007 sec | 0.07 KB |
| Ready/database check | 0.005 sec | 0.006 sec | 0.09 KB |
| Inventory page, 250 records | 0.082 sec | 0.103 sec | 262.78 KB |
| Live telemetry page, 250 records | 0.111 sec | 0.140 sec | 149.22 KB |
| Low-stock search, 250 records | 0.352 sec | 0.491 sec | 262.84 KB |
| Analytics summary across all companies | 7.650 sec | 7.777 sec | 2,357.41 KB |
| Data Hub saved connections | 0.021 sec | 0.039 sec | 10.23 KB |
| Data Hub catalog | 0.016 sec | 0.018 sec | 12.68 KB |

## 7. Where The System Is Fast

The following areas behaved well at 100k+ rows:

- Paginated module data fetches: 250-row pages return in about 0.08 to 0.14 seconds.
- Data Hub metadata screens: saved connections and catalog return in under 0.04 seconds.
- Live insert batches: 200-row increments insert in about 0.03 seconds.
- Health and readiness checks are effectively instant.

## 8. Where The System Lags

The clear bottleneck is:

`GET /runtime/analytics/summary`

This endpoint took about **7.65 seconds median** because the current implementation loads all matching `ModuleRecord` rows into Python and then calculates counts and totals in application memory.

Current behavior:

1. Query all records.
2. Build Python lists.
3. Loop over all records.
4. Calculate module counts, company counts, inventory quantity, and low-stock rows.
5. Return a large response.

Recommended fix:

- Replace Python full-table scan with SQL aggregation:
  - `COUNT(*) GROUP BY module_key`
  - `COUNT(*) GROUP BY company_id`
  - `SUM(quantity) WHERE module_key='inventory' GROUP BY company_id`
  - `COUNT(*) WHERE quantity <= reorder_level` should either use extracted columns or precomputed risk flags.
- Add cached dashboard summary per company/plant.
- Refresh summary cache after imports or on a short schedule.
- Keep large low-stock item lists paginated instead of embedding them in the dashboard summary.

## 9. What Happens When Client Tables And Column Names Differ

Different clients rarely send the same table names or column names. The Vinod test includes four different source schemas to prove the mapping approach.

### SAP Inventory Example

Source table: `MSEG_MARA_STOCK`

| Source Column | Platform Field |
|---|---|
| `MATNR` | `item_code` |
| `MAKTX` | `item_name` |
| `WERKS` | `plant_id` |
| `LGORT` | `warehouse` |
| `LABST` | `quantity` |
| `MEINS` | `uom` |
| `CHARG` | `batch_number` |
| `VFDAT` | `expiry_date` |

### MES Production Example

Source table: `tblProdOrderRuntime`

| Source Column | Platform Field |
|---|---|
| `ProdOrdNo` | `production_order_id` |
| `MatCode` | `item_code` |
| `LineCode` | `production_line` |
| `PlanQty` | `planned_quantity` |
| `DoneQty` | `completed_quantity` |
| `OrderState` | `status` |

### WMS Warehouse Example

Source table: `wms_bin_inventory_snapshot`

| Source Column | Platform Field |
|---|---|
| `sku` | `item_code` |
| `bin` | `bin_code` |
| `zone` | `zone_code` |
| `qty_on_hand` | `quantity` |
| `allocated_qty` | `reserved_quantity` |
| `bin_status` | `status` |

### IoT / Machine Data Example

Source stream: `machine.telemetry.live`

| Source Column | Platform Field |
|---|---|
| `assetTag` | `asset_id` |
| `ts` | `event_time` |
| `tempC` | `temperature_c` |
| `vibrationMmS` | `vibration_mm_s` |
| `alarmCode` | `alarm_code` |
| `runState` | `status` |

## 10. How Data Syncs Into Modules

The intended Data Hub flow is:

1. User selects a source in Data Hub.
2. User enters connection details.
3. Backend stores masked connection metadata in `datahub_saved_connections`.
4. Backend discovers source tables/files/endpoints.
5. User previews sample rows.
6. User transforms data:
   - rename columns
   - trim text
   - cast types
   - filter rows
   - remove duplicates
   - calculate values
7. User maps source fields to platform fields.
8. Validation checks required module fields.
9. Human approval is required before critical import.
10. Import writes normalized records into module tables or `module_records`.
11. Refresh run is logged in `datahub_refresh_runs`.
12. Audit is logged in `datahub_audit_events`.

For this scale test, the script directly wrote normalized `ModuleRecord` rows to simulate the completed import stage at high volume.

## 11. How Long It Takes To Reflect In Frontend

Measured backend/API reflection:

- Bulk load of 100k rows: about 19.186 seconds.
- A 250-row inventory page became queryable in about 0.082 seconds after load.
- Live batches of 200 rows were inserted in about 0.031 seconds each.
- A 250-row live telemetry fetch returned in about 0.111 seconds.

Frontend visibility depends on the active UI behavior:

| UI Behavior | Expected Reflection |
|---|---|
| Manual browser refresh | Immediate after backend commit |
| React Query invalidation after mutation | Immediate after mutation success |
| Polling every 5 seconds | Up to 5 seconds |
| Polling every 30 seconds | Up to 30 seconds |
| No polling/invalidation | User must refresh or navigate |
| WebSocket/SSE push | Near real time |

Current application behavior is strongest for manual refresh and mutation invalidation. Continuous dashboards should add WebSocket/SSE or configured polling.

## 12. Recommended Continuous Refresh Design

For true live manufacturing data:

| Data Type | Recommended Refresh |
|---|---|
| Machine telemetry | WebSocket/SSE or 1-5 second polling |
| Warehouse scanner events | 5-15 second polling or event push |
| Inventory balances | 30-60 second incremental refresh |
| Production order status | 15-60 second incremental refresh |
| Procurement and supplier data | 5-15 minute scheduled refresh |
| Finance/costing | Hourly or daily refresh |
| Executive summary KPIs | Cached aggregation every 1-5 minutes |

## 13. Test Commands

Run the full scale seed inside Docker:

```bash
docker exec -e PYTHONPATH=/app -e BASE_URL=http://127.0.0.1:8000 metam-services-platform-api-1 python scripts/seed_vinod_scale_data.py --rows 100000 --live-batches 5 --live-batch-size 200
```

Check app health:

```bash
curl http://127.0.0.1:8080/ready
curl http://127.0.0.1:8000/health
```

Open the UI:

```text
http://localhost:8080
```

Then select:

1. `vinod` as the client.
2. Data Hub to see saved source connections and catalog entries.
3. Inventory / Production / Warehouse modules to test paginated operational records.

## 14. Final Findings

The platform can store and page through 100k+ Vinod records successfully.

What works well:

- Bulk import into PostgreSQL.
- Paginated record reads.
- Data Hub connection/catalog metadata.
- Plant-level distribution.
- Live insert simulation.

What needs optimization:

- Dashboard analytics summary must move from Python full-table scan to SQL aggregation or cached summaries.
- Frontend continuous refresh should be explicit per widget/module.
- For very large visuals, charts should consume aggregate endpoints, not raw row payloads.
- Data Hub import should eventually write to dedicated typed module tables for each module instead of relying only on generic `module_records`.

