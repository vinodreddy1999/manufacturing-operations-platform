import { Controller, Get } from "@nestjs/common";
import { RequiresModule } from "../../core/decorators/module.decorator";
import { RequiresPermissions } from "../../core/decorators/permissions.decorator";
import { QualityService } from "./quality.service";

@Controller("quality")
@RequiresModule("QUALITY")
export class QualityController {
  constructor(private readonly quality: QualityService) {}

  @Get("inspections")
  @RequiresPermissions("quality.read")
  listInspections() {
    return this.quality.listInspections();
  }
}
