import { Injectable } from "@nestjs/common";
import {
  DistributionStock,
  factoryInventory,
  priorityWeights,
  ShipmentRequest,
  shipmentRequests,
  trucks,
  distributionInventory,
} from "./supply-chain.data";
import { ForecastingService } from "./forecasting.service";

export interface OptimizeShipmentInput {
  requestNumber?: string;
  destinationInventory?: string;
  truckNumber?: string;
  truckCapacity?: number;
  requestedProducts?: Array<{ productId: string; quantity: number }>;
}

@Injectable()
export class OptimizationService {
  constructor(private readonly forecasting: ForecastingService) {}

  optimize(input: OptimizeShipmentInput = {}) {
    const request = this.resolveRequest(input);
    const truck = trucks.find((item) => item.truckNumber === input.truckNumber) ?? trucks[0];
    const truckCapacity = input.truckCapacity ?? truck.truckCapacity;
    const requestedProducts = input.requestedProducts ?? [
      { productId: request.productId, quantity: request.requestedQuantity },
    ];
    const reservedQuantity = requestedProducts.reduce((total, item) => total + item.quantity, 0);
    const destinationInventory = input.destinationInventory ?? request.destinationInventory;
    const fillCapacity = Math.max(truckCapacity - reservedQuantity, 0);
    let remainingCapacity = Math.max(truckCapacity - reservedQuantity, 0);

    const recommendations = this.rankCandidates(destinationInventory, requestedProducts.map((item) => item.productId))
      .map((candidate, index) => {
        const factoryProduct = factoryInventory.find((item) => item.id === candidate.productId);
        if (!factoryProduct || remainingCapacity <= 0) {
          return undefined;
        }

        const factoryAvailable = Math.max(factoryProduct.currentStock - factoryProduct.safetyStock, 0);
        const diversificationLimit = Math.ceil(fillCapacity * (index === 0 ? 0.4 : 0.3));
        const recommendedQuantity = Math.min(
          Math.ceil(candidate.inventoryGap),
          factoryAvailable,
          remainingCapacity,
          diversificationLimit,
        );

        remainingCapacity -= recommendedQuantity;

        return recommendedQuantity > 0
          ? {
              productId: candidate.productId,
              productName: factoryProduct.name,
              recommendedQuantity,
              score: candidate.score,
              reason: candidate.reason,
              costImpact: Number((recommendedQuantity * factoryProduct.unitCost).toFixed(2)),
              stockAfterShipment: factoryProduct.currentStock - recommendedQuantity,
            }
          : undefined;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const requestedLoad = requestedProducts.map((item) => {
      const product = factoryInventory.find((candidate) => candidate.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name ?? item.productId,
        quantity: item.quantity,
        costImpact: Number(((product?.unitCost ?? 0) * item.quantity).toFixed(2)),
      };
    });

    const totalLoad =
      requestedLoad.reduce((total, item) => total + item.quantity, 0) +
      recommendations.reduce((total, item) => total + item.recommendedQuantity, 0);
    const totalCost =
      requestedLoad.reduce((total, item) => total + item.costImpact, 0) +
      recommendations.reduce((total, item) => total + item.costImpact, 0);

    return {
      requestNumber: request.requestNumber,
      truckNumber: truck.truckNumber,
      destinationInventory,
      truckCapacity,
      requestedProducts: requestedLoad,
      recommendations,
      finalTruckLoad: [...requestedLoad, ...recommendations.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.recommendedQuantity,
        costImpact: item.costImpact,
      }))],
      remainingCapacity: truckCapacity - totalLoad,
      utilizationPercent: Number(((totalLoad / truckCapacity) * 100).toFixed(1)),
      costImpact: Number(totalCost.toFixed(2)),
      constraints: [
        "Factory inventory remains above safety stock",
        "Truck unit capacity is not exceeded",
        "Product compatibility rules are respected",
        "Urgent shortages are ranked first",
      ],
    };
  }

  private resolveRequest(input: OptimizeShipmentInput): ShipmentRequest {
    return (
      shipmentRequests.find((item) => item.requestNumber === input.requestNumber) ??
      shipmentRequests[0]
    );
  }

  private rankCandidates(destinationInventory: string, requestedProductIds: string[]) {
    const requestedProduct = factoryInventory.find((item) => item.id === requestedProductIds[0]);
    const rows = distributionInventory.filter((item) => item.inventoryId === destinationInventory);
    const maxGap = Math.max(...rows.map((item) => Math.max(item.maxStock - item.currentStock, 0)), 1);
    const maxConsumption = Math.max(...rows.map((item) => item.averageDailyConsumption), 1);

    return rows
      .filter((item) => !requestedProductIds.includes(item.productId))
      .filter((item) => !requestedProduct || requestedProduct.compatibleWith.includes(item.productId))
      .map((stock) => this.scoreCandidate(stock, maxGap, maxConsumption))
      .sort((left, right) => right.score - left.score);
  }

  private scoreCandidate(stock: DistributionStock, maxGap: number, maxConsumption: number) {
    const product = factoryInventory.find((item) => item.id === stock.productId);
    const forecast = this.forecasting.forecastDemand(product?.demandHistory ?? []);
    const inventoryGap = Math.max(stock.maxStock - stock.currentStock, 0);
    const nearReorderPointBoost = stock.currentStock <= stock.minStock ? 0.12 : 0;
    const forecastIndex = Math.min(forecast.next30Days / Math.max(stock.maxStock, 1), 1);
    const score =
      (inventoryGap / maxGap) * 40 +
      (stock.averageDailyConsumption / maxConsumption) * 30 +
      forecastIndex * 20 +
      priorityWeights[product?.priority ?? "MEDIUM"] * 10 +
      nearReorderPointBoost * 100;

    return {
      productId: stock.productId,
      inventoryGap,
      forecast,
      score: Number(score.toFixed(2)),
      reason: `Gap ${inventoryGap}, consumption ${stock.averageDailyConsumption}/day, forecast ${forecast.next30Days}/30 days`,
    };
  }
}
