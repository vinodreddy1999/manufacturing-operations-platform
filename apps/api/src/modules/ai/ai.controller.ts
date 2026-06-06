import { Controller, Get } from "@nestjs/common";
import { RequiresModule } from "../../core/decorators/module.decorator";
import { RequiresPermissions } from "../../core/decorators/permissions.decorator";
import { AiService } from "./ai.service";

@Controller("ai")
@RequiresModule("AI_COPILOT")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get("draft-actions")
  @RequiresPermissions("ai.recommendations.read")
  listDraftActions() {
    return this.ai.listDraftActions();
  }
}
