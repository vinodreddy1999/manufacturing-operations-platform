from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_modules_are_available():
    response = client.get("/modules")
    assert response.status_code == 200
    modules = {item["key"] for item in response.json()}
    assert "INVENTORY" in modules
    assert "PRODUCTION" in modules
    assert "AI" in modules


def test_demo_login():
    response = client.post(
        "/auth/login",
        json={
            "tenant_slug": "precision-components",
            "email": "admin@mop.local",
            "password": "ChangeMe123!",
        },
    )
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"


def test_inventory_balances():
    response = client.get("/inventory/balances")
    assert response.status_code == 200
    assert response.json()["module"] == "INVENTORY"
