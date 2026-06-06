import { Injectable } from "@nestjs/common";

@Injectable()
export class ForecastingService {
  movingAverage(history: number[], windowSize = 7) {
    const window = history.slice(-windowSize);
    return window.reduce((total, value) => total + value, 0) / Math.max(window.length, 1);
  }

  weightedMovingAverage(history: number[]) {
    const window = history.slice(-7);
    const denominator = window.reduce((total, _value, index) => total + index + 1, 0);
    return window.reduce((total, value, index) => total + value * (index + 1), 0) / Math.max(denominator, 1);
  }

  forecastDemand(history: number[]) {
    const dailyMovingAverage = this.movingAverage(history);
    const dailyWeightedAverage = this.weightedMovingAverage(history);
    const blendedDailyDemand = dailyMovingAverage * 0.45 + dailyWeightedAverage * 0.55;

    return {
      dailyMovingAverage: Number(dailyMovingAverage.toFixed(2)),
      dailyWeightedAverage: Number(dailyWeightedAverage.toFixed(2)),
      next7Days: Math.round(blendedDailyDemand * 7),
      next30Days: Math.round(blendedDailyDemand * 30),
      next90Days: Math.round(blendedDailyDemand * 90),
    };
  }
}
