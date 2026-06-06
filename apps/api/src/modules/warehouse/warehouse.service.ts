import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.warehouse.findMany({
      where: { tenantId },
      include: {
        plant: true,
        locations: {
          orderBy: { code: "asc" },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  async searchLocations(tenantId: string, query: string) {
    const normalized = query.trim();
    const results = await this.prisma.warehouseLocation.findMany({
      where: {
        tenantId,
        OR: normalized
          ? [
              { code: { contains: normalized, mode: "insensitive" } },
              { name: { contains: normalized, mode: "insensitive" } },
              { type: { contains: normalized, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: { warehouse: true, balances: true },
      orderBy: { code: "asc" },
      take: 50,
    });

    return {
      query,
      results: results.map((location) => {
        const usedCapacity = location.balances.reduce(
          (total, balance) => total + Number(balance.physicalQuantity),
          0,
        );
        const capacity = location.capacity ? Number(location.capacity) : null;
        return {
          id: location.id,
          code: location.code,
          name: location.name,
          type: location.type,
          warehouseCode: location.warehouse.code,
          capacity,
          usedCapacity,
          occupancyPercent: capacity ? Math.round((usedCapacity / capacity) * 100) : null,
        };
      }),
    };
  }
}
