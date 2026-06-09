from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class IntelligenceApiResult(BaseModel):
    module: str = "MANUFACTURING_INTELLIGENCE"
    action: str
    message: str
    data: dict[str, Any] | list[dict[str, Any]]


class RootCauseRequest(BaseModel):
    problem_type: str = "Production delay"
    entity_type: str = "Production Order"
    entity_id: str
    user_role: str = "Plant Manager"


class WhatIfRequest(BaseModel):
    scenario_type: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    created_by: str = "planner"


class IntelligenceDraftActionRequest(BaseModel):
    action_type: str
    source_type: str | None = None
    source_id: str | None = None
    reason: str
    owner: str = "operations-manager"
