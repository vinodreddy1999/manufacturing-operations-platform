import { Controller, Get, Req } from "@nestjs/common";
import { RequiresModule } from "../../core/decorators/module.decorator";
import { RequiresPermissions } from "../../core/decorators/permissions.decorator";
import { SupplierService } from "./supplier.service";

interface TenantRequest {
  tenant: { id: string };
}

@Controller("suppliers")
@RequiresModule("SUPPLIER")
export class SupplierController {
  constructor(private readonly suppliers: SupplierService) {}

  @Get()
  @RequiresPermissions("supplier.read")
  listSuppliers(@Req() request: TenantRequest) {
    return this.suppliers.listSuppliers(request.tenant.id);
  }
}
