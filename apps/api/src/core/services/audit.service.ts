import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

export interface AuditEventInput {
  tenantId: string;
  actorId?: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  source: string;
  ipAddress?: string;
  device?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(event: AuditEventInput) {
    return this.prisma.auditEvent.create({
      data: {
        tenantId: event.tenantId,
        actorId: event.actorId,
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        oldValue: event.oldValue as never,
        newValue: event.newValue as never,
        reason: event.reason,
        source: event.source,
        ipAddress: event.ipAddress,
        device: event.device,
      },
    });
  }
}
