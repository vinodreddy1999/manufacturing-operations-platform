#!/usr/bin/env python3
import json
import os
from urllib.error import HTTPError
from urllib.request import Request, urlopen


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8080").rstrip("/")


def request_json(method: str, path: str, payload: dict | None = None, token: str | None = None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(f"{BASE_URL}{path}", data=body, method=method)
    request.add_header("Accept", "application/json")
    if payload is not None:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def login(email: str, password: str) -> str:
    response = request_json(
        "POST",
        "/runtime/auth/login",
        {"email": email, "password": password},
    )
    token = response.get("access_token") or response.get("data", {}).get("access_token")
    if not token:
        raise RuntimeError(f"No access token returned for {email}")
    return token


def run() -> int:
    admin_token = login("admin@metam.local", "ChangeMe123!")
    super_token = login("super@metam.local", "SuperAdmin123!")
    user_token = login("user@metam.local", "User12345!")

    admin_users_response = request_json("GET", "/runtime/users", token=admin_token)
    super_users_response = request_json("GET", "/runtime/users", token=super_token)
    admin_users = admin_users_response.get("data", admin_users_response)
    super_users = super_users_response.get("data", super_users_response)
    admin_companies = sorted({row["company_id"] for row in admin_users})
    super_companies = sorted({row["company_id"] for row in super_users})

    admin_catalog_response = request_json("GET", "/manufacturing-data-hub/catalog", token=admin_token)
    admin_catalog = admin_catalog_response.get("data", admin_catalog_response)
    admin_catalog_companies = sorted({row["company_id"] for row in admin_catalog})

    user_catalog_status = None
    try:
        request_json("GET", "/manufacturing-data-hub/catalog", token=user_token)
        user_catalog_status = "unexpected-access"
    except HTTPError as exc:
        user_catalog_status = exc.code

    output = {
        "base_url": BASE_URL,
        "admin_user_count": len(admin_users),
        "admin_companies_seen": admin_companies,
        "super_admin_user_count": len(super_users),
        "super_admin_companies_seen": super_companies,
        "admin_datahub_companies_seen": admin_catalog_companies,
        "user_datahub_status": user_catalog_status,
    }
    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
