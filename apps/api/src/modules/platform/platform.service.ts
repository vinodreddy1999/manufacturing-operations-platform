import { Injectable } from "@nestjs/common";
import { apiModuleRegistry } from "../../core/module-registry";
import { FeatureFlagService } from "../../core/services/feature-flag.service";

@Injectable()
export class PlatformService {
  constructor(private readonly featureFlags: FeatureFlagService) {}

  async listModules(tenantId: string) {
    const modules = await Promise.all(
      apiModuleRegistry.map(async (module) => ({
        ...module,
        enabled: await this.featureFlags.isEnabled(tenantId, module.key),
      })),
    );

    return {
      tenantId,
      modules,
      coreEngines: [
        "task-engine",
        "approval-engine",
        "notification-engine",
        "document-management",
        "audit-engine",
      ],
    };
  }

  getPermissionMatrix() {
    return apiModuleRegistry.map((module) => ({
      moduleKey: module.key,
      label: module.label,
      permissions: module.permissions,
      dependencies: module.dependencies,
    }));
  }
}
