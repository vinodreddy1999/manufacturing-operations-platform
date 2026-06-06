import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";
import { AuditService } from "../../core/services/audit.service";
import { CreateInventoryItemDto } from "./dto/create-inventory-item.dto";
import { CreateMovementDto } from "./dto/create-movement.dto";

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listItems(tenantId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId, isActive: true },
      include: { balances: true, supplierItems: { include: { supplier: true } } },
      orderBy: { sku: "asc" },
    });

    return items.map((item) => {
      const totals = item.balances.reduce(
        (acc, balance) => ({
          physicalQuantity: acc.physicalQuantity + Number(balance.physicalQuantity),
          reservedQuantity: acc.reservedQuantity + Number(balance.reservedQuantity),
          allocatedQuantity: acc.allocatedQuantity + Number(balance.allocatedQuantity),
          incomingQuantity: acc.incomingQuantity + Number(balance.incomingQuantity),
        }),
        { physicalQuantity: 0, reservedQuantity: 0, allocatedQuantity: 0, incomingQuantity: 0 },
      );

      return {
        id: item.id,
        sku: item.sku,
        itemCode: item.itemCode,
        description: item.description,
        uom: item.uom,
        category: item.category,
        trackingType: item.trackingType,
        preferredSuppliers: item.supplierItems.map((entry) => ({
          role: entry.role,
          supplierName: entry.supplier.name,
        })),
        ...totals,
        availableQuantity: totals.physicalQuantity - totals.reservedQuantity - totals.allocatedQuantity,
      };
    });
  }

  async createItem(tenantId: string, actorId: string, dto: CreateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.create({
      data: {
        tenantId,
        sku: dto.sku,
        itemCode: dto.itemCode,
        description: dto.description,
        uom: dto.uom,
        category: dto.category as never,
        trackingType: dto.trackingType as never,
        costMethod: dto.costMethod,
        reorderLevel: dto.reorderLevel,
        safetyStock: dto.safetyStock,
        leadTimeDays: dto.leadTimeDays,
      },
    });

    await this.audit.record({
      tenantId,
      actorId,
      entityType: "InventoryItem",
      entityId: item.id,
      action: "CREATE",
      newValue: item,
      source: "api",
    });
    return item;
  }

  async createMovement(tenantId: string, actorId: string, dto: CreateMovementDto) {
    const movement = await this.prisma.inventoryMovement.create({
      data: {
        tenantId,
        itemId: dto.itemId,
        movementType: dto.movementType as never,
        quantity: dto.quantity,
        fromLocationId: dto.fromLocationId,
        toLocationId: dto.toLocationId,
        reason: dto.reason,
        createdById: actorId,
      },
    });

    await this.audit.record({
      tenantId,
      actorId,
      entityType: "InventoryMovement",
      entityId: movement.id,
      action: dto.movementType,
      newValue: movement,
      source: "api",
    });
    return movement;
  }
}
