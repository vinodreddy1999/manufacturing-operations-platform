import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  listSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      include: { contacts: true, items: { include: { item: true } } },
      orderBy: { name: "asc" },
    });
  }
}
