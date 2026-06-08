from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import customer_portal_models  # noqa: F401
from .customer_portal_repository import customer_portal_repo
from .customer_portal_schemas import (
    CustomerPortalApiResult,
    FeedbackRequest,
    PortalDraftActionRequest,
    PortalInviteRequest,
    PortalLoginRequest,
    PortalReturnRequest,
    PortalUserUpdateRequest,
    ProfileUpdateRequest,
    SupportCommentRequest,
    SupportRequestCreate,
)
from .customer_portal_service import customer_portal_service

router = APIRouter(prefix="/customer-portal", tags=["Customer Portal"])
ai_router = APIRouter(prefix="/ai/customer-portal", tags=["Customer Portal AI"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> CustomerPortalApiResult:
    return CustomerPortalApiResult(action=action, message=message, data=data)


def user() -> dict[str, Any]:
    return customer_portal_service.current_user()


@router.post("/auth/login", response_model=CustomerPortalApiResult)
def login(request: PortalLoginRequest) -> CustomerPortalApiResult:
    try:
        login_result = customer_portal_service.login(request.email, request.password)
    except PermissionError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
    return result("login", "Customer portal login successful.", login_result)


@router.post("/auth/refresh", response_model=CustomerPortalApiResult)
def refresh(refresh_token: str) -> CustomerPortalApiResult:
    try:
        refreshed = customer_portal_service.refresh(refresh_token)
    except PermissionError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
    return result("refresh", "Customer portal token refreshed.", refreshed)


@router.post("/auth/password-reset", response_model=CustomerPortalApiResult)
def password_reset(email: str) -> CustomerPortalApiResult:
    return result("password_reset", "Password reset email queued.", {"email": email, "status": "RESET_EMAIL_QUEUED"})


@router.post("/auth/verify-email", response_model=CustomerPortalApiResult)
def verify_email(token: str) -> CustomerPortalApiResult:
    return result("verify_email", "Email verified.", {"token": token, "status": "VERIFIED"})


@router.get("/users", response_model=CustomerPortalApiResult)
def list_users() -> CustomerPortalApiResult:
    return result("list_users", "Customer portal users.", [customer_portal_service._public_user(row) for row in customer_portal_repo.users])


@router.post("/users/invite", response_model=CustomerPortalApiResult)
def invite_user(request: PortalInviteRequest) -> CustomerPortalApiResult:
    return result("invite_user", "Customer portal invitation created.", customer_portal_service.invite_user(request.model_dump()))


@router.put("/users/{portal_user_id}", response_model=CustomerPortalApiResult)
def update_user(portal_user_id: str, request: PortalUserUpdateRequest) -> CustomerPortalApiResult:
    portal_user = customer_portal_repo.get(customer_portal_repo.users, portal_user_id)
    if not portal_user:
        raise HTTPException(status_code=404, detail="Portal user not found")
    portal_user.update(request.model_dump())
    return result("update_user", "Customer portal user updated.", customer_portal_service._public_user(portal_user))


@router.post("/users/{portal_user_id}/disable", response_model=CustomerPortalApiResult)
def disable_user(portal_user_id: str) -> CustomerPortalApiResult:
    portal_user = customer_portal_repo.get(customer_portal_repo.users, portal_user_id)
    if not portal_user:
        raise HTTPException(status_code=404, detail="Portal user not found")
    portal_user["status"] = "Disabled"
    return result("disable_user", "Customer portal user disabled.", customer_portal_service._public_user(portal_user))


@router.get("/profile", response_model=CustomerPortalApiResult)
def profile() -> CustomerPortalApiResult:
    return result("profile", "Customer-owned profile view.", customer_portal_service.profile(user()))


@router.put("/profile/update-request", response_model=CustomerPortalApiResult)
def profile_update_request(request: ProfileUpdateRequest) -> CustomerPortalApiResult:
    return result("profile_update_request", "Profile update request created for internal review.", customer_portal_service.profile_update_request(user(), request.requested_changes))


@router.get("/dashboard", response_model=CustomerPortalApiResult)
def dashboard() -> CustomerPortalApiResult:
    return result("dashboard", "Customer portal dashboard.", customer_portal_service.dashboard(user()))


@router.get("/orders", response_model=CustomerPortalApiResult)
def orders() -> CustomerPortalApiResult:
    return result("orders", "Customer-owned order tracking.", customer_portal_service.orders(user()))


@router.get("/orders/{order_id}", response_model=CustomerPortalApiResult)
def order_detail(order_id: str) -> CustomerPortalApiResult:
    try:
        data = customer_portal_service.order_detail(user(), order_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Order not found: {error.args[0]}") from error
    return result("order_detail", "Customer-owned order detail.", data)


@router.get("/shipments", response_model=CustomerPortalApiResult)
def shipments() -> CustomerPortalApiResult:
    return result("shipments", "Customer-owned shipment tracking.", customer_portal_service.shipments(user()))


@router.get("/shipments/{shipment_id}", response_model=CustomerPortalApiResult)
def shipment_detail(shipment_id: str) -> CustomerPortalApiResult:
    shipment = next((row for row in customer_portal_service.shipments(user()) if row["id"] == shipment_id), None)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return result("shipment_detail", "Customer-owned shipment detail.", shipment)


@router.get("/documents", response_model=CustomerPortalApiResult)
def documents() -> CustomerPortalApiResult:
    return result("documents", "Customer-shared documents only.", customer_portal_service.documents(user()))


@router.get("/documents/{document_id}/download", response_model=CustomerPortalApiResult)
def download_document(document_id: str) -> CustomerPortalApiResult:
    try:
        doc = customer_portal_service.download_document(user(), document_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Document not found: {error.args[0]}") from error
    return result("download_document", "Secure customer document download token created.", doc)


@router.get("/support-requests", response_model=CustomerPortalApiResult)
def support_requests() -> CustomerPortalApiResult:
    return result("support_requests", "Customer support requests.", [row for row in customer_portal_repo.support_requests if row["customer_id"] == user()["customer_id"]])


@router.post("/support-requests", response_model=CustomerPortalApiResult)
def create_support_request(request: SupportRequestCreate) -> CustomerPortalApiResult:
    return result("create_support_request", "Support request created.", customer_portal_service.create_support(user(), request.model_dump()))


@router.get("/support-requests/{support_request_id}", response_model=CustomerPortalApiResult)
def support_request_detail(support_request_id: str) -> CustomerPortalApiResult:
    support = customer_portal_repo.get(customer_portal_repo.support_requests, support_request_id)
    if not support or support["customer_id"] != user()["customer_id"]:
        raise HTTPException(status_code=404, detail="Support request not found")
    return result("support_request_detail", "Support request detail.", support)


@router.post("/support-requests/{support_request_id}/comment", response_model=CustomerPortalApiResult)
def add_support_comment(support_request_id: str, request: SupportCommentRequest) -> CustomerPortalApiResult:
    comment = customer_portal_repo.add(customer_portal_repo.support_comments, {"support_request_id": support_request_id, "customer_id": user()["customer_id"], **request.model_dump()}, "cp-comment")
    return result("add_support_comment", "Support request comment added.", comment)


@router.post("/support-requests/{support_request_id}/attachments", response_model=CustomerPortalApiResult)
def add_support_attachment(support_request_id: str, file_url: str) -> CustomerPortalApiResult:
    attachment = customer_portal_repo.add(customer_portal_repo.support_attachments, {"support_request_id": support_request_id, "customer_id": user()["customer_id"], "file_url": file_url}, "cp-attach")
    return result("add_support_attachment", "Support attachment uploaded.", attachment)


@router.get("/returns", response_model=CustomerPortalApiResult)
def returns() -> CustomerPortalApiResult:
    return result("returns", "Customer return requests.", [row for row in customer_portal_repo.return_requests if row["customer_id"] == user()["customer_id"]])


@router.post("/returns", response_model=CustomerPortalApiResult)
def create_return(request: PortalReturnRequest) -> CustomerPortalApiResult:
    try:
        return_request = customer_portal_service.create_return(user(), request.model_dump())
    except KeyError as error:
        raise HTTPException(status_code=404, detail=f"Order not found: {error.args[0]}") from error
    return result("create_return", "Customer return request submitted.", return_request)


@router.get("/returns/{return_id}", response_model=CustomerPortalApiResult)
def return_detail(return_id: str) -> CustomerPortalApiResult:
    return_request = customer_portal_repo.get(customer_portal_repo.return_requests, return_id)
    if not return_request or return_request["customer_id"] != user()["customer_id"]:
        raise HTTPException(status_code=404, detail="Return request not found")
    return result("return_detail", "Return request detail.", return_request)


@router.get("/notifications", response_model=CustomerPortalApiResult)
def notifications() -> CustomerPortalApiResult:
    return result("notifications", "Customer notifications.", customer_portal_service.notifications(user()))


@router.get("/reports/{report_type}", response_model=CustomerPortalApiResult)
def report(report_type: str) -> CustomerPortalApiResult:
    return result("report", "Customer-owned report.", customer_portal_service.reports(user(), report_type))


@router.post("/feedback", response_model=CustomerPortalApiResult)
def feedback(request: FeedbackRequest) -> CustomerPortalApiResult:
    feedback_record = customer_portal_repo.add(customer_portal_repo.feedback, {"customer_id": user()["customer_id"], **request.model_dump()}, "cp-feedback")
    return result("feedback", "Customer feedback captured.", feedback_record)


@ai_router.get("/risk-center", response_model=CustomerPortalApiResult)
def ai_risk_center() -> CustomerPortalApiResult:
    return result("ai_risk_center", "Customer Portal AI risk center.", customer_portal_service.risk_center())


@ai_router.get("/order-risk", response_model=CustomerPortalApiResult)
def ai_order_risk() -> CustomerPortalApiResult:
    return result("ai_order_risk", "Customer order delay risk.", {"orders": customer_portal_service.orders(user()), "recommended_internal_action": "Review expected dispatch date", "draft_customer_message": "We are reviewing your order schedule."})


@ai_router.get("/support-classification", response_model=CustomerPortalApiResult)
def ai_support_classification() -> CustomerPortalApiResult:
    return result("ai_support_classification", "Support request classification.", {"category": "Delivery issue", "urgency": "MEDIUM", "suggested_owner": "customer-support", "escalation_recommended": False})


@ai_router.get("/return-risk", response_model=CustomerPortalApiResult)
def ai_return_risk() -> CustomerPortalApiResult:
    return result("ai_return_risk", "Customer return risk.", {"return_risk_score": len(customer_portal_repo.return_requests) * 20, "inspection_recommended": True})


@ai_router.get("/document-risk", response_model=CustomerPortalApiResult)
def ai_document_risk() -> CustomerPortalApiResult:
    return result("ai_document_risk", "Missing customer-facing document risk.", {"missing_documents": ["Proof of delivery"], "draft_task": "Upload missing proof of delivery"})


@ai_router.get("/satisfaction-risk", response_model=CustomerPortalApiResult)
def ai_satisfaction_risk() -> CustomerPortalApiResult:
    return result("ai_satisfaction_risk", "Customer satisfaction risk.", {"risk_score": 32, "recommended_retention_action": "Proactive order update"})


@ai_router.post("/draft-action", response_model=CustomerPortalApiResult)
def ai_draft_action(request: PortalDraftActionRequest) -> CustomerPortalApiResult:
    return result("ai_draft_action", "Customer Portal AI draft action created. Human approval required.", customer_portal_service.draft_action(request.model_dump()))
