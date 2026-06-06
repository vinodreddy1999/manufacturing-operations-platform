import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class FeatureFlagService {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(tenantId: string, moduleKey: string) {
    if (process.env.FEATURE_FLAGS_MODE === "open") {
      return true;
    }

    try {
      const flag = await this.prisma.featureFlag.findUnique({
        where: {
          tenantId_moduleKey: {
            tenantId,
            moduleKey: moduleKey as never,
          },
        },
      });
      return flag?.enabled ?? false;
    } catch {
      return process.env.NODE_ENV !== "production";
    }
  }
}
