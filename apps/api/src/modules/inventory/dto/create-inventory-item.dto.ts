import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export enum InventoryCategoryDto {
  RAW_MATERIALS = "RAW_MATERIALS",
  WIP = "WIP",
  FINISHED_GOODS = "FINISHED_GOODS",
  CONSUMABLES = "CONSUMABLES",
  SPARE_PARTS = "SPARE_PARTS",
}

export enum TrackingTypeDto {
  NONE = "NONE",
  BATCH = "BATCH",
  SERIAL = "SERIAL",
  BATCH_AND_SERIAL = "BATCH_AND_SERIAL",
}

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsNotEmpty()
  itemCode!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  uom!: string;

  @IsEnum(InventoryCategoryDto)
  category!: InventoryCategoryDto;

  @IsEnum(TrackingTypeDto)
  trackingType!: TrackingTypeDto;

  @IsString()
  costMethod!: string;

  @IsNumber()
  @Min(0)
  reorderLevel!: number;

  @IsNumber()
  @Min(0)
  safetyStock!: number;

  @IsNumber()
  @Min(0)
  leadTimeDays!: number;
}

