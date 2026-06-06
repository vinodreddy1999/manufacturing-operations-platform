import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export enum MovementTypeDto {
  RECEIVING = "RECEIVING",
  TRANSFER = "TRANSFER",
  CONSUMPTION = "CONSUMPTION",
  ADJUSTMENT = "ADJUSTMENT",
  WRITE_OFF = "WRITE_OFF",
  RETURN = "RETURN",
  DAMAGE = "DAMAGE",
  SCRAP = "SCRAP",
}

export class CreateMovementDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsEnum(MovementTypeDto)
  movementType!: MovementTypeDto;

  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @IsOptional()
  @IsString()
  fromLocationId?: string;

  @IsOptional()
  @IsString()
  toLocationId?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

