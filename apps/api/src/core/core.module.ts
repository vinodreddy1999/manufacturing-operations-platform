import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "./database/prisma.service";
import { AuditService } from "./services/audit.service";
import { FeatureFlagService } from "./services/feature-flag.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { ModuleGuard } from "./guards/module.guard";
import { PermissionsGuard } from "./guards/permissions.guard";
import { TenantGuard } from "./guards/tenant.guard";

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? "local-development-access-secret",
      signOptions: { expiresIn: process.env.JWT_ACCESS_TTL ?? "15m" },
    }),
  ],
  providers: [
    PrismaService,
    AuditService,
    FeatureFlagService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: ModuleGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [PrismaService, AuditService, FeatureFlagService, JwtModule],
})
export class CoreModule {}
