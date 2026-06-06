import { Module } from "@nestjs/common";
import { ForecastingService } from "./forecasting.service";
import { OptimizationService } from "./optimization.service";
import { SupplyChainController } from "./supply-chain.controller";
import { SupplyChainService } from "./supply-chain.service";

@Module({
  controllers: [SupplyChainController],
  providers: [ForecastingService, OptimizationService, SupplyChainService],
  exports: [ForecastingService, OptimizationService],
})
export class SupplyChainModule {}
