import { scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const tenantSlug = "precision-components";

function hashPassword(password, salt = "local-demo-salt") {
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: {},
    create: { name: "Precision Components Demo", slug: tenantSlug, strategy: "SHARED_DATABASE" },
  });

  const permissionKeys = [
    "platform.admin", "features.manage", "roles.manage", "inventory.read", "inventory.items.manage", "inventory.movements.create", "warehouse.read", "warehouse.locations.manage", "supplier.read", "supplier.manage", "procurement.read", "production.read", "maintenance.read", "quality.read", "reporting.read", "ai.recommendations.read", "ai.drafts.create",
  ];

  const permissions = [];
  for (const key of permissionKeys) {
    permissions.push(await prisma.permission.upsert({ where: { key }, update: {}, create: { key, description: key } }));
  }

  const adminRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Admin" } },
    update: {},
    create: { tenantId: tenant.id, name: "Admin" },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id },
    });
  }

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@mop.local" } },
    update: { isActive: true },
    create: { tenantId: tenant.id, email: "admin@mop.local", name: "MOP Admin", passwordHash: hashPassword("ChangeMe123!") },
  });

  await prisma.userRole.upsert({ where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } }, update: {}, create: { userId: admin.id, roleId: adminRole.id } });

  for (const moduleKey of ["INVENTORY", "WAREHOUSE", "SUPPLIER", "PROCUREMENT", "PRODUCTION", "MAINTENANCE", "QUALITY", "FORECASTING", "AI_COPILOT"]) {
    await prisma.featureFlag.upsert({ where: { tenantId_moduleKey: { tenantId: tenant.id, moduleKey } }, update: { enabled: true }, create: { tenantId: tenant.id, moduleKey, enabled: true } });
  }

  const company = await prisma.company.upsert({ where: { tenantId_code: { tenantId: tenant.id, code: "CO-C" } }, update: {}, create: { tenantId: tenant.id, code: "CO-C", name: "Company C" } });
  const plant = await prisma.plant.upsert({ where: { tenantId_code: { tenantId: tenant.id, code: "PLANT-NORTH" } }, update: {}, create: { tenantId: tenant.id, companyId: company.id, code: "PLANT-NORTH", name: "North Plant", timezone: "Asia/Kolkata" } });
  await prisma.department.upsert({ where: { tenantId_plantId_code: { tenantId: tenant.id, plantId: plant.id, code: "OPS" } }, update: {}, create: { tenantId: tenant.id, plantId: plant.id, code: "OPS", name: "Operations" } });

  const warehouse = await prisma.warehouse.upsert({ where: { tenantId_code: { tenantId: tenant.id, code: "WH-NORTH" } }, update: {}, create: { tenantId: tenant.id, plantId: plant.id, code: "WH-NORTH", name: "North Plant Warehouse" } });
  const bin = await prisma.warehouseLocation.upsert({ where: { tenantId_warehouseId_code: { tenantId: tenant.id, warehouseId: warehouse.id, code: "A-01-01" } }, update: {}, create: { tenantId: tenant.id, warehouseId: warehouse.id, type: "BIN", code: "A-01-01", name: "Aisle A Rack 01 Bin 01", capacity: 25000, mapX: 12, mapY: 18 } });

  const item = await prisma.inventoryItem.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "RM-STL-001" } },
    update: {},
    create: { tenantId: tenant.id, sku: "RM-STL-001", itemCode: "RM-STL-001", description: "Cold rolled steel coil", uom: "KG", category: "RAW_MATERIALS", trackingType: "BATCH", costMethod: "WEIGHTED_AVERAGE", reorderLevel: 8000, safetyStock: 5000, leadTimeDays: 12 },
  });

  await prisma.inventoryBalance.create({ data: { tenantId: tenant.id, itemId: item.id, locationId: bin.id, batchNumber: "BATCH-DEMO-001", physicalQuantity: 18400, reservedQuantity: 3200, allocatedQuantity: 1400, incomingQuantity: 9000 } }).catch(() => undefined);

  const supplier = await prisma.supplier.create({ data: { tenantId: tenant.id, name: "Apex Steel Components", leadTimeDays: 12, qualityRating: 96.4, deliveryReliability: 94.1 } }).catch(() => undefined);
  if (supplier) await prisma.supplierItem.create({ data: { tenantId: tenant.id, supplierId: supplier.id, itemId: item.id, role: "PRIMARY" } });

  console.log("Seeded demo tenant. Login admin@mop.local / ChangeMe123! / precision-components");
}

main().finally(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
