import { Controller, Get } from "@nestjs/common";
import { RequiresModule } from "../../core/decorators/module.decorator";
import { RequiresPermissions } from "../../core/decorators/permissions.decorator";
import { ProductionService } from "./production.service";

@Controller("production")
@RequiresModule("PRODUCTION")
export class ProductionController {
  constructor(private readonly production: ProductionService) {}

  @Get("schedule")
  @RequiresPermissions("production.read")
  getSchedule() {
    return this.production.getSchedule();
  }
}
