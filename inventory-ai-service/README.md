# Inventory AI Service

Python FastAPI microservice for rule-based inventory intelligence in the Manufacturing Operations Platform.

The service analyzes inventory risk and creates recommendations or draft actions. It does not execute inventory, procurement, production, or warehouse actions automatically. Critical recommendations require human approval.

## Stack

- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- Pandas
- Docker

The first version is rule-based. `app/ai_engine.py` is intentionally structured so scikit-learn or other ML models can be added later.

## Run Locally

```bash
cd inventory-ai-service
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100
```

Open:

```text
http://127.0.0.1:8100/docs
```

## Run With Docker

```bash
cd inventory-ai-service
docker compose up --build
```

## Endpoints

| View | Endpoint |
| --- | --- |
| Inventory Risk Center | `GET /inventory-ai/risk-center` |
| Shortage Prediction | `GET /inventory-ai/shortage-prediction` |
| Overstock Prediction | `GET /inventory-ai/overstock` |
| Procurement Recommendation | `GET /inventory-ai/procurement-recommendations` |
| Expiry Intelligence | `GET /inventory-ai/expiry-intelligence` |
| Dead Stock Detection | `GET /inventory-ai/dead-stock` |
| Production Impact | `GET /inventory-ai/production-impact` |
| Inventory Optimization | `GET /inventory-ai/optimization` |

## Safety Rule

The AI service only:

- analyzes
- recommends
- creates draft actions
- flags critical actions for human approval

It does not execute stock moves, purchase orders, production changes, supplier changes, or write-offs automatically.
