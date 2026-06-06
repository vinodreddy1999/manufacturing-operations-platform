import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiModule } from "./modules/ai/ai.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CoreModule } from "./core/core.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { PlatformModule } from "./modules/platform/platform.module";
import { ProcurementModule } from "./modules/procurement/procurement.module";
import { ProductionModule } from "./modules/production/production.module";
import { QualityModule } from "./modules/quality/quality.module";
import { ReportingModule } from "./modules/reporting/reporting.module";
import { SupplierModule } from "./modules/supplier/supplier.module";
import { SupplyChainModule } from "./modules/supply-chain/supply-chain.module";
import { WarehouseModule } from "./modules/warehouse/warehouse.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CoreModule,
    AuthModule,
    PlatformModule,
    InventoryModule,
    SupplierModule,
    SupplyChainModule,
    WarehouseModule,
    ProcurementModule,
    ProductionModule,
    MaintenanceModule,
    QualityModule,
    ReportingModule,
    AiModule,
  ],
})
export class AppModule {}
