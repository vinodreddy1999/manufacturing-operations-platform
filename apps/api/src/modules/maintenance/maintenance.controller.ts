import { Controller, Get } from "@nestjs/common";
import { RequiresModule } from "../../core/decorators/module.decorator";
import { RequiresPermissions } from "../../core/decorators/permissions.decorator";
import { MaintenanceService } from "./maintenance.service";

@Controller("maintenance")
@RequiresModule("MAINTENANCE")
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Get("work-orders")
  @RequiresPermissions("maintenance.read")
  listWorkOrders() {
    return this.maintenance.listWorkOrders();
  }
}
