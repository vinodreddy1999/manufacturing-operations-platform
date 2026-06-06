import { Controller, Get, Query, Req } from "@nestjs/common";
import { RequiresModule } from "../../core/decorators/module.decorator";
import { RequiresPermissions } from "../../core/decorators/permissions.decorator";
import { WarehouseService } from "./warehouse.service";

interface TenantRequest {
  tenant: { id: string };
}

@Controller("warehouses")
@RequiresModule("WAREHOUSE")
export class WarehouseController {
  constructor(private readonly warehouses: WarehouseService) {}

  @Get()
  @RequiresPermissions("warehouse.read")
  list(@Req() request: TenantRequest) {
    return this.warehouses.list(request.tenant.id);
  }

  @Get("locations/search")
  @RequiresPermissions("warehouse.read")
  searchLocations(@Query("q") query = "", @Req() request: TenantRequest) {
    return this.warehouses.searchLocations(request.tenant.id, query);
  }
}
