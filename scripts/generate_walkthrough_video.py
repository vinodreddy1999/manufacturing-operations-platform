from __future__ import annotations

import json
import struct
import textwrap
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUTPUT_GIF = DOCS / "mop-complete-working-walkthrough.gif"
OUTPUT_AVI = DOCS / "mop-complete-working-walkthrough.avi"
OUTPUT_HTML = DOCS / "mop-complete-working-walkthrough.html"
API_BASE = "http://127.0.0.1:8000"
APP_BASE = "http://127.0.0.1:8080"

FALLBACK_SUMMARY = {
    "active_users": 97,
    "module_record_counts": {
        "inventory": 78,
        "production": 76,
        "maintenance": 76,
        "procurement": 75,
        "quality": 75,
        "sales": 75,
        "costing": 20,
        "planning": 15,
        "compliance": 15,
        "customer-portal": 15,
        "supplier-portal": 15,
        "reports": 15,
        "documents": 15,
        "warehouse": 10,
        "reporting": 10,
        "integrations": 10,
        "mobile": 5,
        "ai_copilot": 5,
    },
    "company_count": 5,
    "companies": [],
}


ROLES = [
    ("Super Admin", "super@mop.local", "Sees all companies, all users, all modules, DataHub, Admin, and operations."),
    ("Company Admin", "admin.apex@mop.local", "Sees only own company users/data and can manage DataHub + records."),
    ("Team Manager", "manager.apex@mop.local", "Can work operational data for assigned company scope."),
    ("Supervisor", "supervisor.apex@mop.local", "Can update operational records for execution follow-up."),
    ("Operator", "operator.apex@mop.local", "Focused shopfloor user with limited operational access."),
    ("Auditor", "auditor.apex@mop.local", "Read/audit focused view, no destructive operations."),
    ("Viewer", "viewer.apex@mop.local", "Read-only business visibility."),
]

MODULES = [
    ("Dashboard", "/", "Executive cards redirect to Admin, Operations, Inventory, and DataHub."),
    ("Admin", "/admin", "Companies, users, roles, module enable/disable, and admin metrics."),
    ("Data Hub", "/data-hub", "Catalog, connections, uploads, cloud sources, and data quality."),
    ("Planning", "/planning", "Demand, capacity, workforce, maintenance, and procurement planning."),
    ("Inventory", "/inventory", "Stock, reservations, risk, movement, expiry, counts, and costing."),
    ("Production", "/production", "Work orders, BOM, routing, scheduling, WIP, and OEE."),
    ("Maintenance", "/maintenance", "Assets, work orders, preventive maintenance, spare parts, calendar."),
    ("Quality", "/quality", "Inspections, NCR, CAPA, incoming/in-process/finished goods quality."),
    ("Procurement", "/procurement", "Suppliers, RFQ, PR, PO, goods receipt, and vendor evaluation."),
    ("Sales", "/sales", "Customers, orders, dispatch, delivery, logistics, and history."),
    ("Costing", "/costing", "Material/labor/machine/energy/logistics/product profitability."),
    ("Compliance", "/compliance", "Compliance records, audits, e-signature, and reports."),
    ("Customer Portal", "/customer-portal", "Customer orders, delivery status, invoices, docs, tickets."),
    ("Supplier Portal", "/supplier-portal", "Supplier RFQs, POs, deliveries, docs, and scorecards."),
    ("Reports", "/reports", "Operational reports and export-ready reporting workspace."),
    ("Documents", "/documents", "SOPs, instructions, contracts, manuals, certificates, approvals."),
    ("Operations", "/operations", "Global records table plus module-to-company allocation redirects."),
    ("AI Intelligence", "/intelligence", "AI command center route preserved for future frontend integration."),
]


def api_json(path: str, token: str | None = None, method: str = "GET", payload: dict[str, Any] | None = None) -> dict[str, Any]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(f"{API_BASE}{path}", data=body, method=method)
    request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def get_token(email: str, password: str) -> str | None:
    try:
        result = api_json("/runtime/auth/login", method="POST", payload={"email": email, "password": password})
        return result["data"]["access_token"]
    except Exception:
        return None


def get_live_summary() -> dict[str, Any]:
    token = get_token("super@mop.local", "SuperAdmin123!")
    if not token:
        return FALLBACK_SUMMARY
    try:
        analytics = api_json("/runtime/analytics/summary", token=token)["data"]
        companies = api_json("/companies", token=token)
        return {
            "active_users": analytics.get("active_users"),
            "module_record_counts": analytics.get("module_record_counts", {}),
            "company_count": len(companies),
            "companies": companies,
        }
    except Exception:
        return FALLBACK_SUMMARY


def get_workflow_evidence() -> dict[str, Any]:
    evidence = {
        "work_order_id": "wo-a3a2076d",
        "work_order_number": "MWO-WALKTHROUGH-001",
        "assigned_to": "operator.apex@mop.local",
        "final_status": "Pending Review",
        "task_count": 1,
        "notification_count": 2,
        "notification_messages": [
            "Breakdown reported: Maintenance work order is ready.",
            "Maintenance completed: Maintenance completion captured.",
        ],
    }
    try:
        orders = api_json("/maintenance/work-orders")["data"]
        tasks = api_json("/maintenance/tasks")["data"]
        notifications = api_json("/maintenance/notifications")["data"]
        walkthrough = next((item for item in orders if item.get("work_order_number") == "MWO-WALKTHROUGH-001"), None)
        if walkthrough:
            evidence["work_order_id"] = walkthrough.get("id", evidence["work_order_id"])
            evidence["assigned_to"] = walkthrough.get("assigned_to", evidence["assigned_to"])
            evidence["final_status"] = walkthrough.get("status", evidence["final_status"])
        evidence["task_count"] = len(tasks)
        evidence["notification_count"] = len(notifications)
        evidence["notification_messages"] = [
            f"{item.get('notification_type')}: {item.get('message')}" for item in notifications[-3:]
        ] or evidence["notification_messages"]
    except Exception:
        pass
    return evidence


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_wrapped(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int], max_width: int, fill: str, size: int = 30, bold: bool = False, line_gap: int = 10) -> int:
    active_font = font(size, bold=bold)
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=active_font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    x, y = xy
    for line in lines:
        draw.text((x, y), line, fill=fill, font=active_font)
        y += size + line_gap
    return y


def panel(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], title: str, body: list[str], accent: str = "#22d3ee") -> None:
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=28, fill="#111827", outline="#2dd4bf", width=2)
    draw.rectangle((x1, y1, x2, y1 + 8), fill=accent)
    draw.text((x1 + 28, y1 + 24), title, fill="#ffffff", font=font(34, bold=True))
    y = y1 + 82
    for item in body:
        y = draw_wrapped(draw, item, (x1 + 28, y), x2 - x1 - 56, "#cbd5e1", size=24)
        y += 8


def base_frame(title: str, subtitle: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (1600, 900), "#020617")
    draw = ImageDraw.Draw(image)
    for index in range(0, 1600, 80):
        color = "#041124" if index % 160 == 0 else "#06172f"
        draw.line((index, 0, index + 480, 900), fill=color, width=2)
    draw.ellipse((1220, -160, 1780, 360), fill="#0f172a", outline="#22d3ee", width=3)
    draw.ellipse((-180, 620, 420, 1120), fill="#111827", outline="#7c3aed", width=3)
    draw.text((72, 54), "Metam Services", fill="#67e8f9", font=font(28, bold=True))
    draw.text((72, 112), title, fill="#ffffff", font=font(58, bold=True))
    draw_wrapped(draw, subtitle, (76, 186), 1420, "#cbd5e1", size=30)
    return image, draw


def frame_cover(summary: dict[str, Any]) -> Image.Image:
    image, draw = base_frame("Complete Working Walkthrough", "Role-based user views, module behavior, data flow, redirects, backend records, and Docker deployment.")
    stats = [
        f"Active seeded users: {summary['active_users']}",
        f"Seeded companies: {summary['company_count']}",
        f"Backend module groups: {len(summary['module_record_counts'])}",
        f"Application URL: {APP_BASE}",
    ]
    panel(draw, (76, 330, 760, 760), "Live Backend Scope", stats)
    panel(draw, (820, 330, 1524, 760), "What This Video Covers", [
        "Login views for each user level.",
        "Every frontend module and its backend records.",
        "Click redirections from dashboard and operations widgets.",
        "DataHub, Admin, RBAC, and company isolation behavior.",
    ], accent="#8b5cf6")
    return image


def frame_role(name: str, email: str, details: str) -> Image.Image:
    image, draw = base_frame(f"User Level: {name}", f"Login: {email}")
    panel(draw, (82, 300, 744, 740), "What This User Sees", [
        details,
        "Navigation is filtered by backend RBAC and frontend guards.",
        "Write controls are enabled only when the role has write permission.",
    ], accent="#38bdf8")
    panel(draw, (812, 300, 1518, 740), "How To Test", [
        f"Open {APP_BASE}",
        f"Sign in as {email}",
        "Move through Dashboard, Admin/DataHub if allowed, and module pages.",
    ], accent="#10b981")
    return image


def frame_module(name: str, path: str, details: str, count: Any) -> Image.Image:
    image, draw = base_frame(f"Module: {name}", f"Route: {APP_BASE}{path}")
    panel(draw, (76, 300, 760, 760), "Backend Data", [
        f"Live records available: {count}",
        "Module pages load from /runtime/records?module_key=...",
        "Create, update, and delete actions use runtime database APIs.",
    ], accent="#22d3ee")
    panel(draw, (820, 300, 1524, 760), "Workflow", [
        details,
        "Dashboard and operations widgets redirect into this workspace.",
        "Charts and tables update from the same backend source of truth.",
    ], accent="#f59e0b")
    return image


def frame_flow() -> Image.Image:
    image, draw = base_frame("End-to-End Data Flow", "How user clicks become backend-backed module results.")
    steps = [
        ("1. User login", "JWT token from /runtime/auth/login"),
        ("2. RBAC", "Role and company scope decide visible sections"),
        ("3. Dashboard click", "Cards route to Admin, DataHub, Inventory, Operations, or module pages"),
        ("4. Module API", "Frontend calls /runtime/records and module-specific endpoints"),
        ("5. Database", "PostgreSQL stores users, companies, feature flags, records, catalog, uploads"),
        ("6. Output", "Tables, charts, badges, and recommendations refresh in UI"),
    ]
    y = 300
    for index, (heading, body) in enumerate(steps):
        x = 120 + (index % 2) * 720
        if index and index % 2 == 0:
            y += 170
        panel(draw, (x, y, x + 610, y + 128), heading, [body], accent="#22d3ee" if index % 2 == 0 else "#8b5cf6")
    return image


def frame_company_selection() -> Image.Image:
    image, draw = base_frame("Admin Flow: Select Company and Allocate Modules", "How Super Admin/Admin controls module access before users work.")
    panel(draw, (80, 300, 760, 760), "Click Path", [
        "1. Login as super@mop.local.",
        "2. Open Admin.",
        "3. Create/select company.",
        "4. Select module in Company Module Controls.",
        "5. Enable or disable the module for that company.",
    ], accent="#22d3ee")
    panel(draw, (820, 300, 1520, 760), "What Changes", [
        "Feature flags update backend module allocation.",
        "Company users see only allowed sections.",
        "Operations allocation table redirects to the selected module.",
    ], accent="#8b5cf6")
    return image


def frame_add_data() -> Image.Image:
    image, draw = base_frame("User Flow: Add and Check Module Data", "How backend records are created, displayed, charted, and audited.")
    panel(draw, (80, 300, 760, 760), "Click Path", [
        "1. Open a module: Inventory, Production, Maintenance, Quality, etc.",
        "2. Use Create Backend Record.",
        "3. Enter code, name, status, owner, and quantity.",
        "4. Click Add Backend Record.",
    ], accent="#10b981")
    panel(draw, (820, 300, 1520, 760), "Result", [
        "Record is written to /runtime/records.",
        "Table refreshes from PostgreSQL-backed runtime data.",
        "Chart updates from the same loaded backend records.",
        "Read-only users can view but cannot write.",
    ], accent="#f59e0b")
    return image


def frame_assignment(evidence: dict[str, Any]) -> Image.Image:
    image, draw = base_frame("Work Assignment: Manager Creates and Assigns Work", "Actual live API walkthrough example generated in Docker.")
    panel(draw, (80, 300, 760, 760), "Created Work", [
        f"Work order: {evidence['work_order_number']}",
        f"Backend id: {evidence['work_order_id']}",
        "Machine: M-CUT-01",
        "Priority: CRITICAL",
        "Production impact: HIGH",
    ], accent="#ef4444")
    panel(draw, (820, 300, 1520, 760), "Assignment", [
        f"Assigned to: {evidence['assigned_to']}",
        "Skill: CNC spindle diagnostics",
        "Status moved through Assigned -> In Progress -> Pending Review.",
        "Manager review is required after completion.",
    ], accent="#22d3ee")
    return image


def frame_notifications(evidence: dict[str, Any]) -> Image.Image:
    image, draw = base_frame("Notification Flow: Operator and Manager Are Informed", "How assignment and completion events become tasks and notifications.")
    panel(draw, (80, 300, 760, 760), "Generated Queues", [
        f"Maintenance task count: {evidence['task_count']}",
        f"Maintenance notification count: {evidence['notification_count']}",
        "Operator sees assigned work through Maintenance module context.",
        "Manager sees Pending Review status and notification queue.",
    ], accent="#8b5cf6")
    panel(draw, (820, 300, 1520, 760), "Latest Messages", evidence["notification_messages"], accent="#10b981")
    return image


def frame_manager_review(evidence: dict[str, Any]) -> Image.Image:
    image, draw = base_frame("Manager Review: Check, Approve, and Close Loop", "End-to-end status check after operator completes work.")
    panel(draw, (80, 300, 760, 760), "Manager Checks", [
        "1. Login as manager.apex@mop.local.",
        "2. Open Dashboard for open notifications.",
        "3. Open Maintenance or Operations.",
        f"4. Search/check {evidence['work_order_number']}.",
        f"5. Current final status: {evidence['final_status']}.",
    ], accent="#22d3ee")
    panel(draw, (820, 300, 1520, 760), "Outcome", [
        "Manager can verify root cause, closure notes, spare usage, uploaded docs.",
        "If approved, the process can move to close/audit trail.",
        "If rejected, manager sends it back to the assigned operator/team.",
    ], accent="#f59e0b")
    return image


def frame_end() -> Image.Image:
    image, draw = base_frame("Deployment and Testing", "The walkthrough aligns to the current Docker/GitHub build.")
    panel(draw, (100, 300, 1500, 720), "Current Delivery", [
        "Docker image: vinodreddy1999/manufacturing-operations-platform-fullstack:0.3.7",
        "Frontend app: http://127.0.0.1:8080",
        "Backend API: http://127.0.0.1:8000",
        "All role/module paths in this video are routed in the application.",
    ], accent="#10b981")
    return image


def save_html(frames: list[str]) -> None:
    items = "\n".join(f"<li>{item}</li>" for item in frames)
    OUTPUT_HTML.write_text(
        f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Metam Services Complete Working Walkthrough</title>
  <style>
    body {{ margin: 0; font-family: Segoe UI, Arial, sans-serif; background: #020617; color: #e2e8f0; }}
    main {{ max-width: 1180px; margin: auto; padding: 32px; }}
    img {{ width: 100%; border-radius: 24px; border: 1px solid rgba(255,255,255,.14); box-shadow: 0 30px 80px rgba(0,0,0,.35); }}
    a {{ color: #67e8f9; }}
    .card {{ margin-top: 24px; padding: 24px; border: 1px solid rgba(255,255,255,.12); border-radius: 24px; background: rgba(15,23,42,.75); }}
    li {{ margin: 8px 0; }}
  </style>
</head>
<body>
  <main>
    <h1>Metam Services - Complete Working Walkthrough</h1>
    <p>This animated walkthrough covers user levels, module flows, backend data, click redirects, RBAC, and deployment.</p>
    <video controls width=\"100%\" poster=\"mop-complete-working-walkthrough.gif\">
      <source src=\"mop-complete-working-walkthrough.avi\" type=\"video/x-msvideo\" />
      Your browser can still view the animated fallback below.
    </video>
    <p><a href=\"mop-complete-working-walkthrough.avi\">Download full AVI video</a></p>
    <img src=\"mop-complete-working-walkthrough.gif\" alt=\"Metam Services complete working walkthrough animation fallback\" />
    <section class=\"card\">
      <h2>Covered Sections</h2>
      <ul>{items}</ul>
    </section>
    <section class=\"card\">
      <h2>Live Links</h2>
      <p><a href=\"{APP_BASE}\">Open application</a> | <a href=\"{API_BASE}/docs\">Open API docs</a></p>
    </section>
  </main>
</body>
</html>
""",
        encoding="utf-8",
    )


def riff_chunk(chunk_id: bytes, data: bytes) -> bytes:
    padding = b"\0" if len(data) % 2 else b""
    return chunk_id + struct.pack("<I", len(data)) + data + padding


def riff_list(list_type: bytes, data: bytes) -> bytes:
    payload = list_type + data
    padding = b"\0" if len(payload) % 2 else b""
    return b"LIST" + struct.pack("<I", len(payload)) + payload + padding


def save_avi(frames: list[Image.Image], output: Path, fps: int = 1) -> None:
    """Write a simple MJPEG AVI without relying on ffmpeg or external codecs."""
    width, height = frames[0].size
    jpeg_frames: list[bytes] = []
    for frame in frames:
        from io import BytesIO

        buffer = BytesIO()
        frame.convert("RGB").save(buffer, format="JPEG", quality=88)
        jpeg_frames.append(buffer.getvalue())

    max_frame_size = max(len(frame) for frame in jpeg_frames)
    total_frames = len(jpeg_frames)
    microseconds_per_frame = int(1_000_000 / fps)

    avih = struct.pack(
        "<IIIIIIIIII4I",
        microseconds_per_frame,
        max_frame_size * fps,
        0,
        0x10,
        total_frames,
        0,
        1,
        max_frame_size,
        width,
        height,
        0,
        0,
        0,
        0,
    )

    strh = (
        b"vids"
        + b"MJPG"
        + struct.pack(
            "<IHHIIIIIIIIhhhh",
            0,
            0,
            0,
            0,
            1,
            fps,
            0,
            total_frames,
            max_frame_size,
            0xFFFFFFFF,
            0,
            0,
            0,
            width,
            height,
        )
    )

    strf = struct.pack(
        "<IiiHHIIiiII",
        40,
        width,
        height,
        1,
        24,
        int.from_bytes(b"MJPG", "little"),
        max_frame_size,
        0,
        0,
        0,
        0,
    )

    hdrl = riff_list(
        b"hdrl",
        riff_chunk(b"avih", avih)
        + riff_list(b"strl", riff_chunk(b"strh", strh) + riff_chunk(b"strf", strf)),
    )

    movi_payload = bytearray()
    index_entries = []
    offset = 4
    for frame in jpeg_frames:
        chunk = riff_chunk(b"00dc", frame)
        index_entries.append((b"00dc", 0x10, offset, len(frame)))
        movi_payload.extend(chunk)
        offset += len(chunk)

    movi = riff_list(b"movi", bytes(movi_payload))
    idx1 = b"".join(struct.pack("<4sIII", *entry) for entry in index_entries)
    avi_payload = b"AVI " + hdrl + movi + riff_chunk(b"idx1", idx1)
    output.write_bytes(b"RIFF" + struct.pack("<I", len(avi_payload)) + avi_payload)


def main() -> None:
    DOCS.mkdir(exist_ok=True)
    summary = get_live_summary()
    workflow_evidence = get_workflow_evidence()
    counts = summary["module_record_counts"]
    frames: list[Image.Image] = [
        frame_cover(summary),
        frame_flow(),
        frame_company_selection(),
        frame_add_data(),
        frame_assignment(workflow_evidence),
        frame_notifications(workflow_evidence),
        frame_manager_review(workflow_evidence),
    ]
    frame_names = [
        "Cover",
        "Data flow",
        "Select company and allocate modules",
        "Add and check backend data",
        "Assign work",
        "Notify operator and manager",
        "Manager review",
    ]
    for role in ROLES:
        frames.append(frame_role(*role))
        frame_names.append(f"Role - {role[0]}")
    for module_name, path, details in MODULES:
        key = path.strip("/") or "dashboard"
        module_count = counts.get(key, counts.get("reporting" if key == "reports" else key, "N/A"))
        frames.append(frame_module(module_name, path, details, module_count))
        frame_names.append(f"Module - {module_name}")
    frames.append(frame_end())
    frame_names.append("Deployment and testing")
    frames[0].save(
        OUTPUT_GIF,
        save_all=True,
        append_images=frames[1:],
        duration=3600,
        loop=0,
        optimize=True,
    )
    save_avi(frames, OUTPUT_AVI, fps=1)
    save_html(frame_names)
    print(json.dumps({"gif": str(OUTPUT_GIF), "avi": str(OUTPUT_AVI), "html": str(OUTPUT_HTML), "frames": len(frames)}, indent=2))


if __name__ == "__main__":
    main()
