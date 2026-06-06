import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { RequiresModule } from "../../core/decorators/module.decorator";
import { RequiresPermissions } from "../../core/decorators/permissions.decorator";
import { CreateInventoryItemDto } from "./dto/create-inventory-item.dto";
import { CreateMovementDto } from "./dto/create-movement.dto";
import { InventoryService } from "./inventory.service";

interface TenantRequest {
  tenant: { id: string };
  user: { id: string };
}

@Controller("inventory")
@RequiresModule("INVENTORY")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get("items")
  @RequiresPermissions("inventory.read")
  listItems(@Req() request: TenantRequest) {
    return this.inventory.listItems(request.tenant.id);
  }

  @Post("items")
  @RequiresPermissions("inventory.items.manage")
  createItem(@Body() dto: CreateInventoryItemDto, @Req() request: TenantRequest) {
    return this.inventory.createItem(request.tenant.id, request.user.id, dto);
  }

  @Post("movements")
  @RequiresPermissions("inventory.movements.create")
  createMovement(@Body() dto: CreateMovementDto, @Req() request: TenantRequest) {
    return this.inventory.createMovement(request.tenant.id, request.user.id, dto);
  }
}
