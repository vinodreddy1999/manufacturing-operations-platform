from datetime import date, timedelta

from sqlalchemy.orm import Session

from .models import InventorySignal


def seed_demo_data(db: Session) -> None:
    if db.query(InventorySignal).count() > 0:
        return
    today = date.today()
    rows = [
        InventorySignal(
            item_id="item-steel",
            sku="RM-STL-001",
            item_name="Cold rolled steel coil",
            current_stock=18400,
            reserved_quantity=3200,
            incoming_quantity=9000,
            daily_consumption=1250,
            average_monthly_usage=34000,
            max_stock_level=42000,
            safety_stock=5000,
            supplier_lead_time_days=12,
            supplier_quality_rating=96.4,
            supplier_delivery_reliability=94.1,
            production_demand=22000,
            inventory_value=1518000,
            expiry_date=today + timedelta(days=68),
            last_movement_date=today - timedelta(days=4),
            batch_id="BATCH-STL-2401",
            status="AVAILABLE",
        ),
        InventorySignal(
            item_id="item-bearing",
            sku="SP-BRG-014",
            item_name="CNC spindle bearing",
            current_stock=18,
            reserved_quantity=4,
            incoming_quantity=0,
            daily_consumption=2,
            average_monthly_usage=55,
            max_stock_level=80,
            safety_stock=6,
            supplier_lead_time_days=5,
            supplier_quality_rating=92,
            supplier_delivery_reliability=90.5,
            production_demand=30,
            inventory_value=115200,
            expiry_date=None,
            last_movement_date=today - timedelta(days=96),
            batch_id=None,
            status="DAMAGED",
        ),
        InventorySignal(
            item_id="item-cleaner",
            sku="CON-CLN-005",
            item_name="Industrial cleaner",
            current_stock=90,
            reserved_quantity=0,
            incoming_quantity=0,
            daily_consumption=1.5,
            average_monthly_usage=25,
            max_stock_level=120,
            safety_stock=75,
            supplier_lead_time_days=16,
            supplier_quality_rating=88,
            supplier_delivery_reliability=82,
            production_demand=15,
            inventory_value=18900,
            expiry_date=today + timedelta(days=18),
            last_movement_date=today - timedelta(days=142),
            batch_id="CHEM-CLN-118",
            status="QUARANTINE",
        ),
    ]
    db.add_all(rows)
    db.commit()
