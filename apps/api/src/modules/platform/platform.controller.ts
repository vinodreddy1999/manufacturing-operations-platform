import { Controller, Get, Req } from "@nestjs/common";
import { RequiresPermissions } from "../../core/decorators/permissions.decorator";
import { PlatformService } from "./platform.service";

interface TenantRequest {
  tenant: { id: string };
}

@Controller("platform")
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get("modules")
  @RequiresPermissions("features.manage")
  listModules(@Req() request: TenantRequest) {
    return this.platform.listModules(request.tenant.id);
  }

  @Get("permissions")
  @RequiresPermissions("roles.manage")
  permissionMatrix() {
    return this.platform.getPermissionMatrix();
  }
}
