from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import manufacturing_intelligence_models  # noqa: F401
from .manufacturing_intelligence_schemas import IntelligenceApiResult, IntelligenceDraftActionRequest, RootCauseRequest, WhatIfRequest
from .manufacturing_intelligence_service import manufacturing_intelligence_service

router = APIRouter(prefix="/manufacturing-intelligence", tags=["Manufacturing Intelligence"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> IntelligenceApiResult:
    return IntelligenceApiResult(action=action, message=message, data=data)


@router.get("/enablement", response_model=IntelligenceApiResult)
def enablement(company_id: str = "company-c") -> IntelligenceApiResult:
    return result("enablement", "Manufacturing Intelligence feature flags.", manufacturing_intelligence_service.enablement(company_id))


@router.get("/command-center", response_model=IntelligenceApiResult)
def command_center() -> IntelligenceApiResult:
    return result("command_center", "Manufacturing command center.", manufacturing_intelligence_service.command_center())


@router.get("/risks", response_model=IntelligenceApiResult)
def risks() -> IntelligenceApiResult:
    return result("risks", "Cross-module intelligence risks.", manufacturing_intelligence_service.risks())


@router.get("/impact-graph/{entity_type}/{entity_id}", response_model=IntelligenceApiResult)
def impact_graph(entity_type: str, entity_id: str) -> IntelligenceApiResult:
    try:
        data = manufacturing_intelligence_service.impact_graph(entity_type, entity_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Impact graph entity not found: {error.args[0]}") from error
    return result("impact_graph", "Business impact graph.", data)


@router.post("/root-cause", response_model=IntelligenceApiResult)
def root_cause(request: RootCauseRequest) -> IntelligenceApiResult:
    return result("root_cause", "Cross-module root cause analysis.", manufacturing_intelligence_service.root_cause(request.model_dump()))


@router.post("/what-if", response_model=IntelligenceApiResult)
def what_if(request: WhatIfRequest) -> IntelligenceApiResult:
    return result("what_if", "What-if simulation result.", manufacturing_intelligence_service.what_if(request.model_dump()))


@router.get("/bottlenecks", response_model=IntelligenceApiResult)
def bottlenecks() -> IntelligenceApiResult:
    return result("bottlenecks", "Cross-module bottleneck detection.", manufacturing_intelligence_service.bottlenecks())


@router.get("/health-score", response_model=IntelligenceApiResult)
def health_score() -> IntelligenceApiResult:
    return result("health_score", "Operational health scores.", manufacturing_intelligence_service.health_score())


@router.get("/plant-health-score", response_model=IntelligenceApiResult)
def plant_health_score() -> IntelligenceApiResult:
    return result("plant_health_score", "Plant health scores.", manufacturing_intelligence_service.plant_health_score())


@router.get("/customer-impact", response_model=IntelligenceApiResult)
def customer_impact() -> IntelligenceApiResult:
    return result("customer_impact", "Customer impact analysis.", manufacturing_intelligence_service.customer_impact())


@router.get("/cost-impact", response_model=IntelligenceApiResult)
def cost_impact() -> IntelligenceApiResult:
    return result("cost_impact", "Cost impact analysis.", manufacturing_intelligence_service.cost_impact())


@router.get("/recommendations", response_model=IntelligenceApiResult)
def recommendations() -> IntelligenceApiResult:
    return result("recommendations", "Manufacturing intelligence recommendations.", manufacturing_intelligence_service.recommendations())


@router.post("/draft-action", response_model=IntelligenceApiResult)
def draft_action(request: IntelligenceDraftActionRequest) -> IntelligenceApiResult:
    return result("draft_action", "Manufacturing intelligence draft action created. Human approval required.", manufacturing_intelligence_service.draft_action(request.model_dump()))


@router.get("/executive-summary", response_model=IntelligenceApiResult)
def executive_summary() -> IntelligenceApiResult:
    return result("executive_summary", "Manufacturing intelligence executive summary.", manufacturing_intelligence_service.executive_summary())
