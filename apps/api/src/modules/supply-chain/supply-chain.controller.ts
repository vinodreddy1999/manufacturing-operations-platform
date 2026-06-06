import { Body, Controller, Get, Post } from "@nestjs/common";
import { ForecastingService } from "./forecasting.service";
import { OptimizeShipmentInput, OptimizationService } from "./optimization.service";
import { SupplyChainService } from "./supply-chain.service";
import { factoryInventory } from "./supply-chain.data";

@Controller("supply-chain")
export class SupplyChainController {
  constructor(
    private readonly supplyChain: SupplyChainService,
    private readonly optimization: OptimizationService,
    private readonly forecasting: ForecastingService,
  ) {}

  @Get("factory-inventory")
  factoryInventory() {
    return this.supplyChain.listFactoryInventory();
  }

  @Get("distribution-inventory")
  distributionInventory() {
    return this.supplyChain.listDistributionInventory();
  }

  @Get("trucks")
  trucks() {
    return this.supplyChain.listTrucks();
  }

  @Get("shipment-requests")
  shipmentRequests() {
    return this.supplyChain.listShipmentRequests();
  }

  @Post("optimize")
  optimize(@Body() input: OptimizeShipmentInput) {
    return this.optimization.optimize(input);
  }

  @Get("forecasting")
  forecasts() {
    return factoryInventory.map((item) => ({
      productId: item.id,
      productName: item.name,
      ...this.forecasting.forecastDemand(item.demandHistory),
    }));
  }

  @Get("dashboard")
  dashboard() {
    return this.supplyChain.dashboardMetrics();
  }
}
