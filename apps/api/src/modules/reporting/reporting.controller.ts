import { Controller, Get } from "@nestjs/common";
import { RequiresModule } from "../../core/decorators/module.decorator";
import { RequiresPermissions } from "../../core/decorators/permissions.decorator";
import { ReportingService } from "./reporting.service";

@Controller("reports")
@RequiresModule("FORECASTING")
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get()
  @RequiresPermissions("reporting.read")
  listReports() {
    return this.reporting.listReports();
  }
}
