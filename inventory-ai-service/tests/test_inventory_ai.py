from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_risk_center():
    response = client.get("/inventory-ai/risk-center")
    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "rule_based"
    assert isinstance(payload["risks"], list)


def test_shortage_prediction():
    response = client.get("/inventory-ai/shortage-prediction?current_stock=18&reserved_quantity=4&incoming_quantity=0&daily_consumption=2&supplier_lead_time_days=5")
    assert response.status_code == 200
    assert response.json()["risk_level"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}


def test_overstock_prediction():
    response = client.get("/inventory-ai/overstock?current_stock=62000&average_monthly_usage=24000&max_stock_level=42000")
    assert response.status_code == 200
    assert response.json()["excess_quantity"] == 20000


def test_procurement_recommendation_requires_draft_action():
    response = client.get("/inventory-ai/procurement-recommendations")
    assert response.status_code == 200
    assert response.json()["draft_action"]["status"] == "DRAFT"


def test_expiry_intelligence():
    expiry = (date.today() + timedelta(days=10)).isoformat()
    response = client.get(f"/inventory-ai/expiry-intelligence?expiry_date={expiry}&current_quantity=90&average_daily_usage=1.5")
    assert response.status_code == 200
    assert response.json()["quantity_at_risk"] > 0


def test_dead_stock():
    last = (date.today() - timedelta(days=120)).isoformat()
    response = client.get(f"/inventory-ai/dead-stock?last_movement_date={last}&current_quantity=90&inventory_value=18900")
    assert response.status_code == 200
    assert response.json()["dead_stock_status"] in {"ACTIVE", "SLOW_OR_NON_MOVING", "DEAD_STOCK"}


def test_production_impact():
    response = client.get("/inventory-ai/production-impact")
    assert response.status_code == 200
    assert response.json()["can_produce"] is False


def test_optimization():
    response = client.get("/inventory-ai/optimization")
    assert response.status_code == 200
    assert isinstance(response.json()["recommendations"], list)
