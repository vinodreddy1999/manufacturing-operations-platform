from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from . import sales_models  # noqa: F401 - registers SQLAlchemy tables
from .sales_repository import sales_repo
from .sales_schemas import (
    AllocationRequest,
    CustomerRequest,
    DispatchOrderRequest,
    PlantRepresentativeRequest,
    RegionRequest,
    ReturnRequest,
    SalesApiResult,
    SalesDraftActionRequest,
    SalesOrderRequest,
    ShipmentRequest,
    TerritoryRequest,
)
from .sales_service import sales_service

router = APIRouter(tags=["Sales & Distribution"])
ai_router = APIRouter(prefix="/ai/sales", tags=["Sales AI"])


def result(action: str, message: str, data: dict[str, Any] | list[dict[str, Any]]) -> SalesApiResult:
    return SalesApiResult(action=action, message=message, data=data)


def not_found(error: KeyError) -> HTTPException:
    return HTTPException(status_code=404, detail=f"Sales record not found: {error.args[0]}")


@router.get("/sales/dashboard", response_model=SalesApiResult)
def dashboard() -> SalesApiResult:
    return result("dashboard", "Sales dashboard with orders, shortages, production requirement, dispatch, returns and finished goods availability.", sales_service.dashboard())


@router.get("/customers", response_model=SalesApiResult)
def list_customers() -> SalesApiResult:
    return result("list_customers", "Customer master records.", sales_repo.snapshot(sales_repo.customers))


@router.post("/customers", response_model=SalesApiResult)
def create_customer(request: CustomerRequest) -> SalesApiResult:
    return result("create_customer", "Customer created.", sales_repo.add(sales_repo.customers, request.model_dump(), "cust"))


@router.get("/customers/{customer_id}", response_model=SalesApiResult)
def get_customer(customer_id: str) -> SalesApiResult:
    customer = sales_repo.get(sales_repo.customers, customer_id)
    if not customer:
        raise not_found(KeyError(customer_id))
    return result("get_customer", "Customer detail.", customer)


@router.put("/customers/{customer_id}", response_model=SalesApiResult)
def update_customer(customer_id: str, request: CustomerRequest) -> SalesApiResult:
    try:
        customer = sales_repo.update(sales_repo.customers, customer_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_customer", "Customer updated.", customer)


@router.delete("/customers/{customer_id}", response_model=SalesApiResult)
def delete_customer(customer_id: str) -> SalesApiResult:
    customer = sales_repo.get(sales_repo.customers, customer_id)
    if not customer:
        raise not_found(KeyError(customer_id))
    sales_repo.customers.remove(customer)
    return result("delete_customer", "Customer deleted.", customer)


@router.get("/regions", response_model=SalesApiResult)
def list_regions() -> SalesApiResult:
    return result("list_regions", "Sales regions.", sales_repo.snapshot(sales_repo.regions))


@router.post("/regions", response_model=SalesApiResult)
def create_region(request: RegionRequest) -> SalesApiResult:
    return result("create_region", "Sales region created.", sales_repo.add(sales_repo.regions, request.model_dump(), "region"))


@router.get("/territories", response_model=SalesApiResult)
def list_territories() -> SalesApiResult:
    return result("list_territories", "Sales territories.", sales_repo.snapshot(sales_repo.territories))


@router.post("/territories", response_model=SalesApiResult)
def create_territory(request: TerritoryRequest) -> SalesApiResult:
    return result("create_territory", "Sales territory created.", sales_repo.add(sales_repo.territories, request.model_dump(), "terr"))


@router.get("/plant-representatives", response_model=SalesApiResult)
def list_plant_representatives() -> SalesApiResult:
    return result("list_plant_representatives", "Plant representatives who control finished goods allocation.", sales_repo.snapshot(sales_repo.plant_representatives))


@router.post("/plant-representatives", response_model=SalesApiResult)
def create_plant_representative(request: PlantRepresentativeRequest) -> SalesApiResult:
    return result("create_plant_representative", "Plant representative created.", sales_repo.add(sales_repo.plant_representatives, request.model_dump(), "plant-rep"))


@router.get("/sales-orders", response_model=SalesApiResult)
def list_sales_orders() -> SalesApiResult:
    return result("list_sales_orders", "Sales order list.", sales_repo.snapshot(sales_repo.orders))


@router.post("/sales-orders", response_model=SalesApiResult)
def create_sales_order(request: SalesOrderRequest) -> SalesApiResult:
    return result("create_sales_order", "Sales order created with items.", sales_service.create_order(request.model_dump()))


@router.get("/sales-orders/{order_id}", response_model=SalesApiResult)
def get_sales_order(order_id: str) -> SalesApiResult:
    try:
        order = sales_service.order(order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("get_sales_order", "Sales order detail.", {**order, "items": sales_service.items_for_order(order_id)})


@router.put("/sales-orders/{order_id}", response_model=SalesApiResult)
def update_sales_order(order_id: str, request: SalesOrderRequest) -> SalesApiResult:
    payload = request.model_dump()
    payload.pop("items", None)
    try:
        order = sales_repo.update(sales_repo.orders, order_id, payload)
    except KeyError as error:
        raise not_found(error) from error
    return result("update_sales_order", "Sales order updated.", order)


@router.post("/sales-orders/{order_id}/submit", response_model=SalesApiResult)
def submit_order(order_id: str) -> SalesApiResult:
    try:
        order = sales_service.submit_order(order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("submit_order", "Sales order submitted.", order)


@router.post("/sales-orders/{order_id}/approve", response_model=SalesApiResult)
def approve_order(order_id: str) -> SalesApiResult:
    try:
        order = sales_service.approve_order(order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("approve_order", "Sales order approved or credit-blocked.", order)


@router.post("/sales-orders/{order_id}/reserve", response_model=SalesApiResult)
def reserve_order(order_id: str) -> SalesApiResult:
    try:
        reservation = sales_service.reserve_order(order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("reserve_order", "Finished goods reserved with partial allocation and production recommendation when needed.", reservation)


@router.post("/sales-orders/{order_id}/dispatch", response_model=SalesApiResult)
def dispatch_order(order_id: str) -> SalesApiResult:
    try:
        dispatch = sales_service.dispatch_order(order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("dispatch_order", "Dispatch workflow started with pick list.", dispatch)


@router.post("/sales-orders/{order_id}/close", response_model=SalesApiResult)
def close_order(order_id: str) -> SalesApiResult:
    try:
        order = sales_service.close_order(order_id)
    except KeyError as error:
        raise not_found(error) from error
    return result("close_order", "Sales order closed.", order)


@router.get("/allocations", response_model=SalesApiResult)
def list_allocations() -> SalesApiResult:
    return result("list_allocations", "Customer allocations and protected reservation decisions.", sales_repo.snapshot(sales_repo.allocations))


@router.post("/allocations", response_model=SalesApiResult)
def create_allocation(request: AllocationRequest) -> SalesApiResult:
    return result("create_allocation", "Allocation evaluated against protected reservations.", sales_service.create_allocation(request.model_dump()))


@router.get("/dispatch-orders", response_model=SalesApiResult)
def list_dispatch_orders() -> SalesApiResult:
    return result("list_dispatch_orders", "Dispatch orders.", sales_repo.snapshot(sales_repo.dispatch_orders))


@router.post("/dispatch-orders", response_model=SalesApiResult)
def create_dispatch_order(request: DispatchOrderRequest) -> SalesApiResult:
    return result("create_dispatch_order", "Dispatch order and FEFO/FIFO pick list created.", sales_service.create_dispatch_order(request.model_dump()))


@router.get("/shipments", response_model=SalesApiResult)
def list_shipments() -> SalesApiResult:
    return result("list_shipments", "Shipment tracking records.", sales_repo.snapshot(sales_repo.shipments))


@router.post("/shipments", response_model=SalesApiResult)
def create_shipment(request: ShipmentRequest) -> SalesApiResult:
    shipment = sales_repo.add(sales_repo.shipments, request.model_dump(), "shipment")
    return result("create_shipment", "Shipment created.", shipment)


@router.put("/shipments/{shipment_id}", response_model=SalesApiResult)
def update_shipment(shipment_id: str, request: ShipmentRequest) -> SalesApiResult:
    try:
        shipment = sales_repo.update(sales_repo.shipments, shipment_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_shipment", "Shipment updated.", shipment)


@router.get("/returns", response_model=SalesApiResult)
def list_returns() -> SalesApiResult:
    return result("list_returns", "Customer returns.", sales_repo.snapshot(sales_repo.returns))


@router.post("/returns", response_model=SalesApiResult)
def create_return(request: ReturnRequest) -> SalesApiResult:
    return_record = sales_repo.add(sales_repo.returns, request.model_dump(), "return")
    return result("create_return", "Return request created. Quality inspection may be required if enabled.", return_record)


@router.put("/returns/{return_id}", response_model=SalesApiResult)
def update_return(return_id: str, request: ReturnRequest) -> SalesApiResult:
    try:
        return_record = sales_repo.update(sales_repo.returns, return_id, request.model_dump())
    except KeyError as error:
        raise not_found(error) from error
    return result("update_return", "Return updated.", return_record)


@router.get("/sales/reports", response_model=SalesApiResult)
def reports() -> SalesApiResult:
    return result("reports", "Sales reports.", sales_service.reports())


@router.get("/sales/kpis", response_model=SalesApiResult)
def kpis() -> SalesApiResult:
    return result("kpis", "Sales KPIs.", sales_service.kpis())


@router.get("/sales/tasks", response_model=SalesApiResult)
def tasks() -> SalesApiResult:
    return result("tasks", "Sales task queue.", sales_repo.snapshot(sales_repo.tasks))


@router.get("/sales/notifications", response_model=SalesApiResult)
def notifications() -> SalesApiResult:
    return result("notifications", "Sales email-first notification queue.", sales_repo.snapshot(sales_repo.notifications))


@ai_router.get("/risk-center", response_model=SalesApiResult)
def ai_risk_center() -> SalesApiResult:
    return result("ai_risk_center", "Sales AI risk center.", sales_service.risk_center())


@ai_router.get("/demand-forecast", response_model=SalesApiResult)
def ai_demand_forecast() -> SalesApiResult:
    return result("ai_demand_forecast", "Rule-based demand forecast.", sales_service.demand_forecast())


@ai_router.get("/order-risk", response_model=SalesApiResult)
def ai_order_risk() -> SalesApiResult:
    return result("ai_order_risk", "Customer order risk AI.", sales_service.order_risk())


@ai_router.get("/allocation-recommendation", response_model=SalesApiResult)
def ai_allocation_recommendation() -> SalesApiResult:
    return result("ai_allocation_recommendation", "Finished goods allocation recommendation respecting protected reservations.", sales_service.allocation_recommendation())


@ai_router.get("/regional-demand", response_model=SalesApiResult)
def ai_regional_demand() -> SalesApiResult:
    return result("ai_regional_demand", "Regional demand and transfer opportunity AI.", sales_service.regional_demand())


@ai_router.get("/expiry-aware-sales", response_model=SalesApiResult)
def ai_expiry_aware_sales() -> SalesApiResult:
    return result("ai_expiry_aware_sales", "Expiry-aware sales allocation AI.", sales_service.expiry_aware_sales())


@ai_router.get("/customer-profitability", response_model=SalesApiResult)
def ai_customer_profitability() -> SalesApiResult:
    return result("ai_customer_profitability", "Customer profitability AI.", sales_service.customer_profitability())


@ai_router.get("/dispatch-optimization", response_model=SalesApiResult)
def ai_dispatch_optimization() -> SalesApiResult:
    return result("ai_dispatch_optimization", "Rule-based dispatch prioritization and grouping.", sales_service.dispatch_optimization())


@ai_router.get("/returns-analysis", response_model=SalesApiResult)
def ai_returns_analysis() -> SalesApiResult:
    return result("ai_returns_analysis", "Returns pattern and investigation AI.", sales_service.returns_analysis())


@ai_router.post("/draft-action", response_model=SalesApiResult)
def ai_draft_action(request: SalesDraftActionRequest) -> SalesApiResult:
    return result("ai_draft_action", "Sales AI draft action created. Human approval required.", sales_service.draft_action(request.model_dump()))
