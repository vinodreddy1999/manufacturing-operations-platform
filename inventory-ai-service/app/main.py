from contextlib import asynccontextmanager

from fastapi import FastAPI

from .database import Base, SessionLocal, engine
from .routes import router
from .seed_data import seed_demo_data


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


initialize_database()

app = FastAPI(
    title="Inventory AI Service",
    version="0.1.0",
    description="Rule-based inventory intelligence service with draft recommendations and human approval controls.",
    lifespan=lifespan,
)

app.include_router(router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "inventory-ai-service", "mode": "rule_based"}
