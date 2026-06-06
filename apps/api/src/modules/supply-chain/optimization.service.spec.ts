import { ForecastingService } from "./forecasting.service";
import { OptimizationService } from "./optimization.service";

describe("OptimizationService", () => {
  it("fills the example truck to 100% while preserving requested product load", () => {
    const service = new OptimizationService(new ForecastingService());

    const result = service.optimize({
      truckCapacity: 200,
      requestedProducts: [{ productId: "P1", quantity: 100 }],
      destinationInventory: "DI-A",
    });

    expect(result.utilizationPercent).toBe(100);
    expect(result.remainingCapacity).toBe(0);
    expect(result.finalTruckLoad.find((item) => item.productId === "P1")?.quantity).toBe(100);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
