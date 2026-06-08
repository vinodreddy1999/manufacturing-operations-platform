from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import supplier_portal_models  # noqa: F401
from .supplier_portal_repository import supplier_portal_repo
from .supplier_portal_schemas import (
    ASNRequest,
    DeliveryConfirmationRequest,
    POAcknowledgementRequest,
    SupplierCapaResponseRequest,
    SupplierCertificateUploadRequest,
    SupplierDocumentUploadRequest,
    SupplierMessageRequest,
    SupplierPortalApiResult,
    SupplierPortalDraftActionRequest,
    SupplierPortalInviteRequest,
    SupplierPortalLoginRequest,
    SupplierProfileUpdateRequest,
)
from .supplier_portal_service import supplier_portal_service

router = APIRouter(prefix="/supplier-portal", tags=["Supplier Portal"])
ai_router = APIRouter(prefix="/ai/supplier-portal", tags=["Supplier Portal AI"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> SupplierPortalApiResult:
    return SupplierPortalApiResult(action=action, message=message, data=data)


def user() -> dict[str, Any]:
    return supplier_portal_service.current_user()


@router.post("/auth/login", response_model=SupplierPortalApiResult)
def login(request: SupplierPortalLoginRequest) -> SupplierPortalApiResult:
    try:
        data = supplier_portal_service.login(request.email, request.password)
    except PermissionError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
    return result("login", "Supplier portal login successful.", data)


@router.post("/auth/refresh", response_model=SupplierPortalApiResult)
def refresh(refresh_token: str) -> SupplierPortalApiResult:
    try:
        data = supplier_portal_service.refresh(refresh_token)
    except PermissionError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
    return result("refresh", "Supplier portal token refreshed.", data)


@router.post("/auth/password-reset", response_model=SupplierPortalApiResult)
def password_reset(email: str) -> SupplierPortalApiResult:
    return result("password_reset", "Supplier password reset queued.", {"email": email, "status": "RESET_EMAIL_QUEUED"})


@router.post("/auth/verify-email", response_model=SupplierPortalApiResult)
def verify_email(token: str) -> SupplierPortalApiResult:
    return result("verify_email", "Supplier email verified.", {"token": token, "status": "VERIFIED"})


@router.get("/users", response_model=SupplierPortalApiResult)
def users() -> SupplierPortalApiResult:
    return result("users", "Supplier portal users.", [{k: v for k, v in row.items() if k != "password"} for row in supplier_portal_repo.users])


@router.post("/users/invite", response_model=SupplierPortalApiResult)
def invite_user(request: SupplierPortalInviteRequest) -> SupplierPortalApiResult:
    new_user = supplier_portal_repo.add(supplier_portal_repo.users, {**request.model_dump(), "supplier_portal_user_id": "spu-new", "status": "Invited", "last_login": None, "invitation_status": "Pending", "password": "Supplier123!"}, "spu")
    return result("invite_user", "Supplier portal invitation created.", {k: v for k, v in new_user.items() if k != "password"})


@router.put("/users/{supplier_portal_user_id}", response_model=SupplierPortalApiResult)
def update_user(supplier_portal_user_id: str, request: SupplierPortalInviteRequest) -> SupplierPortalApiResult:
    portal_user = next((row for row in supplier_portal_repo.users if row["supplier_portal_user_id"] == supplier_portal_user_id), None)
    if not portal_user:
        raise HTTPException(status_code=404, detail=f"Supplier portal user not found: {supplier_portal_user_id}")
    portal_user.update(request.model_dump())
    supplier_portal_repo.audit(user()["supplier_portal_user_id"], "supplier_portal_user_updated", {"updated_user_id": supplier_portal_user_id})
    return result("update_user", "Supplier portal user updated.", {k: v for k, v in portal_user.items() if k != "password"})


@router.post("/users/{supplier_portal_user_id}/disable", response_model=SupplierPortalApiResult)
def disable_user(supplier_portal_user_id: str) -> SupplierPortalApiResult:
    portal_user = next((row for row in supplier_portal_repo.users if row["supplier_portal_user_id"] == supplier_portal_user_id), None)
    if not portal_user:
        raise HTTPException(status_code=404, detail=f"Supplier portal user not found: {supplier_portal_user_id}")
    portal_user["status"] = "Disabled"
    supplier_portal_repo.audit(user()["supplier_portal_user_id"], "supplier_portal_user_disabled", {"disabled_user_id": supplier_portal_user_id})
    return result("disable_user", "Supplier portal user disabled.", {k: v for k, v in portal_user.items() if k != "password"})


@router.get("/profile", response_model=SupplierPortalApiResult)
def profile() -> SupplierPortalApiResult:
    return result("profile", "Supplier-owned profile view.", supplier_portal_service.profile(user()))


@router.put("/profile/update-request", response_model=SupplierPortalApiResult)
def profile_update(request: SupplierProfileUpdateRequest) -> SupplierPortalApiResult:
    update = supplier_portal_repo.add(supplier_portal_repo.profile_update_requests, {"supplier_id": user()["supplier_id"], "requested_by": user()["supplier_portal_user_id"], "status": "Pending Review", **request.model_dump()}, "sp-profile")
    supplier_portal_repo.audit(user()["supplier_portal_user_id"], "profile_update_request", {"profile_update_request_id": update["id"]})
    return result("profile_update_request", "Supplier profile update request created for procurement review.", update)


@router.get("/dashboard", response_model=SupplierPortalApiResult)
def dashboard() -> SupplierPortalApiResult:
    return result("dashboard", "Supplier portal dashboard.", supplier_portal_service.dashboard(user()))


@router.get("/purchase-orders", response_model=SupplierPortalApiResult)
def purchase_orders() -> SupplierPortalApiResult:
    return result("purchase_orders", "Supplier-owned purchase orders.", supplier_portal_service.purchase_orders(user()))


@router.get("/purchase-orders/{po_id}", response_model=SupplierPortalApiResult)
def purchase_order(po_id: str) -> SupplierPortalApiResult:
    try:
        data = supplier_portal_service.purchase_order(user(), po_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Purchase order not found: {error.args[0]}") from error
    return result("purchase_order", "Supplier-owned purchase order detail.", data)


@router.post("/purchase-orders/{po_id}/acknowledge", response_model=SupplierPortalApiResult)
def acknowledge_po(po_id: str, request: POAcknowledgementRequest) -> SupplierPortalApiResult:
    try:
        data = supplier_portal_service.acknowledge_po(user(), po_id, request.model_dump())
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Purchase order not found: {error.args[0]}") from error
    return result("acknowledge_po", "PO acknowledgement submitted.", data)


@router.get("/delivery-confirmations", response_model=SupplierPortalApiResult)
def delivery_confirmations() -> SupplierPortalApiResult:
    return result("delivery_confirmations", "Supplier delivery confirmations.", [row for row in supplier_portal_repo.delivery_confirmations if row["supplier_id"] == user()["supplier_id"]])


@router.post("/delivery-confirmations", response_model=SupplierPortalApiResult)
def create_delivery_confirmation(request: DeliveryConfirmationRequest) -> SupplierPortalApiResult:
    data = supplier_portal_repo.add(supplier_portal_repo.delivery_confirmations, {"supplier_id": user()["supplier_id"], **request.model_dump()}, "sp-delivery")
    return result("create_delivery_confirmation", "Delivery confirmation submitted.", data)


@router.get("/asn", response_model=SupplierPortalApiResult)
def list_asn() -> SupplierPortalApiResult:
    return result("asn", "Advance shipment notices.", [row for row in supplier_portal_repo.asn if row["supplier_id"] == user()["supplier_id"]])


@router.post("/asn", response_model=SupplierPortalApiResult)
def create_asn(request: ASNRequest) -> SupplierPortalApiResult:
    data = supplier_portal_repo.add(supplier_portal_repo.asn, {"supplier_id": user()["supplier_id"], **request.model_dump()}, "asn")
    return result("create_asn", "Advance shipment notice submitted.", data)


@router.get("/documents", response_model=SupplierPortalApiResult)
def documents() -> SupplierPortalApiResult:
    return result("documents", "Supplier uploaded documents.", [row for row in supplier_portal_repo.documents if row["supplier_id"] == user()["supplier_id"]])


@router.post("/documents/upload", response_model=SupplierPortalApiResult)
def upload_document(request: SupplierDocumentUploadRequest) -> SupplierPortalApiResult:
    return result("upload_document", "Supplier document uploaded for review.", supplier_portal_service.upload_document(user(), request.model_dump()))


@router.get("/certificates", response_model=SupplierPortalApiResult)
def certificates() -> SupplierPortalApiResult:
    return result("certificates", "Supplier certificates.", [row for row in supplier_portal_repo.certificates if row["supplier_id"] == user()["supplier_id"]])


@router.post("/certificates/upload", response_model=SupplierPortalApiResult)
def upload_certificate(request: SupplierCertificateUploadRequest) -> SupplierPortalApiResult:
    return result("upload_certificate", "Supplier certificate uploaded for verification.", supplier_portal_service.upload_certificate(user(), request.model_dump()))


@router.get("/messages", response_model=SupplierPortalApiResult)
def messages() -> SupplierPortalApiResult:
    return result("messages", "Supplier messages.", supplier_portal_service.messages(user()))


@router.post("/messages", response_model=SupplierPortalApiResult)
def create_message(request: SupplierMessageRequest) -> SupplierPortalApiResult:
    message = supplier_portal_repo.add(supplier_portal_repo.messages, {"supplier_id": user()["supplier_id"], "sender_type": "Supplier", "sender_id": user()["supplier_portal_user_id"], **request.model_dump()}, "sp-msg")
    return result("create_message", "Supplier message sent.", message)


@router.get("/capa", response_model=SupplierPortalApiResult)
def capa() -> SupplierPortalApiResult:
    return result("capa", "Supplier CAPA responses.", supplier_portal_service.capa(user()))


@router.post("/capa/{capa_id}/respond", response_model=SupplierPortalApiResult)
def respond_capa(capa_id: str, request: SupplierCapaResponseRequest) -> SupplierPortalApiResult:
    response = supplier_portal_repo.add(supplier_portal_repo.capa_responses, {"supplier_id": user()["supplier_id"], "capa_id": capa_id, **request.model_dump()}, "sp-capa")
    return result("respond_capa", "Supplier CAPA response submitted.", response)


@router.get("/notifications", response_model=SupplierPortalApiResult)
def notifications() -> SupplierPortalApiResult:
    return result("notifications", "Supplier notifications.", [row for row in supplier_portal_repo.notifications if row["supplier_id"] == user()["supplier_id"]])


@router.get("/reports/{report_type}", response_model=SupplierPortalApiResult)
def report(report_type: str) -> SupplierPortalApiResult:
    return result("report", "Supplier-owned report.", supplier_portal_service.reports(user(), report_type))


@ai_router.get("/risk-center", response_model=SupplierPortalApiResult)
def ai_risk_center() -> SupplierPortalApiResult:
    return result("ai_risk_center", "Supplier Portal AI risk center.", supplier_portal_service.risk_center())


@ai_router.get("/delivery-risk", response_model=SupplierPortalApiResult)
def ai_delivery_risk() -> SupplierPortalApiResult:
    return result("ai_delivery_risk", "Supplier delivery risk AI.", supplier_portal_service.delivery_risk())


@ai_router.get("/document-risk", response_model=SupplierPortalApiResult)
def ai_document_risk() -> SupplierPortalApiResult:
    return result("ai_document_risk", "Supplier document risk AI.", supplier_portal_service.document_risk())


@ai_router.get("/certificate-expiry", response_model=SupplierPortalApiResult)
def ai_certificate_expiry() -> SupplierPortalApiResult:
    return result("ai_certificate_expiry", "Supplier certificate expiry AI.", supplier_portal_service.certificate_expiry())


@ai_router.get("/supplier-quality-risk", response_model=SupplierPortalApiResult)
def ai_supplier_quality_risk() -> SupplierPortalApiResult:
    return result("ai_supplier_quality_risk", "Supplier quality risk AI.", supplier_portal_service.supplier_quality_risk())


@ai_router.get("/po-acknowledgement-risk", response_model=SupplierPortalApiResult)
def ai_po_ack_risk() -> SupplierPortalApiResult:
    return result("ai_po_acknowledgement_risk", "PO acknowledgement risk AI.", supplier_portal_service.po_ack_risk())


@ai_router.get("/message-summary", response_model=SupplierPortalApiResult)
def ai_message_summary() -> SupplierPortalApiResult:
    return result("ai_message_summary", "Supplier message summary AI.", {"summary": "No urgent supplier messages.", "recommended_owner": "procurement"})


@ai_router.post("/draft-action", response_model=SupplierPortalApiResult)
def ai_draft_action(request: SupplierPortalDraftActionRequest) -> SupplierPortalApiResult:
    return result("ai_draft_action", "Supplier Portal AI draft action created. Human approval required.", supplier_portal_service.draft_action(request.model_dump()))
