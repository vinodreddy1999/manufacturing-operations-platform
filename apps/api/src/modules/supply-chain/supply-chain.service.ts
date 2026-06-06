import { Injectable } from "@nestjs/common";
import {
  distributionInventory,
  factoryInventory,
  shipmentRequests,
  trucks,
} from "./supply-chain.data";
import { ForecastingService } from "./forecasting.service";
import { OptimizationService } from "./optimization.service";

@Injectable()
export class SupplyChainService {
  constructor(
    private readonly forecasting: ForecastingService,
    private readonly optimization: OptimizationService,
  ) {}

  listFactoryInventory() {
    return factoryInventory;
  }

  listDistributionInventory() {
    return distributionInventory;
  }

  listTrucks() {
    return trucks;
  }

  listShipmentRequests() {
    return shipmentRequests;
  }

  dashboardMetrics() {
    const totalInventoryValue = factoryInventory.reduce(
      (total, item) => total + item.currentStock * item.unitCost,
      0,
    );
    const openRecommendation = this.optimization.optimize();
    const stockoutRisk = distributionInventory.filter(
      (item) => item.currentStock <= item.minStock,
    ).length;
    const warehouseFillRate =
      distributionInventory.reduce((total, item) => total + item.currentStock / item.maxStock, 0) /
      distributionInventory.length;

    return {
      totalInventoryValue,
      truckUtilizationPercent: openRecommendation.utilizationPercent,
      inventoryTurnover: 5.8,
      stockoutRisk,
      shipmentEfficiency: 94,
      warehouseFillRate: Number((warehouseFillRate * 100).toFixed(1)),
      inventoryLevels: factoryInventory.map((item) => ({
        productId: item.id,
        currentStock: item.currentStock,
        safetyStock: item.safetyStock,
        reorderPoint: item.reorderPoint,
      })),
      demandTrend: factoryInventory.map((item) => ({
        productId: item.id,
        forecast: this.forecasting.forecastDemand(item.demandHistory),
      })),
      truckUtilizationTrend: [72, 81, 88, 91, 96, openRecommendation.utilizationPercent],
    };
  }
}
