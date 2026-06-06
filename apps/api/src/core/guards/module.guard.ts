import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MODULE_KEY } from "../decorators/module.decorator";
import { PUBLIC_ROUTE_KEY } from "../decorators/public.decorator";
import { FeatureFlagService } from "../services/feature-flag.service";

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlags: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const moduleKey = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!moduleKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    return this.featureFlags.isEnabled(request.tenant.id, moduleKey);
  }
}
