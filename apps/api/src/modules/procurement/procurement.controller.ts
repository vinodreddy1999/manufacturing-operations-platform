import { Controller, Get } from "@nestjs/common";
import { RequiresModule } from "../../core/decorators/module.decorator";
import { RequiresPermissions } from "../../core/decorators/permissions.decorator";
import { ProcurementService } from "./procurement.service";

@Controller("procurement")
@RequiresModule("PROCUREMENT")
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  @Get("requisitions")
  @RequiresPermissions("procurement.read")
  listRequisitions() {
    return this.procurement.listRequisitions();
  }
}
