import type { ImpactMetric, ImpactStatus, ImpactTotals, ModuleImpact } from './types';

export function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function calculateDifference(previousValue: number, currentValue: number) {
  return round(currentValue - previousValue);
}

export function calculatePercentageChange(previousValue: number, currentValue: number) {
  if (!previousValue) return currentValue ? 100 : 0;
  return round(((currentValue - previousValue) / Math.abs(previousValue)) * 100);
}

export function calculateStatus(previousValue: number, currentValue: number, improvementWhen: ImpactMetric['improvementWhen']): ImpactStatus {
  const difference = currentValue - previousValue;
  if (Math.abs(difference) < 0.05) return 'No Change';
  const improved = improvementWhen === 'increase' ? difference > 0 : difference < 0;
  return improved ? 'Improved' : 'Declined';
}

export function calculateFinancialImpact(previousValue: number, currentValue: number, improvementWhen: ImpactMetric['improvementWhen'], valuePerUnit: number) {
  const improvement = improvementWhen === 'increase' ? currentValue - previousValue : previousValue - currentValue;
  return Math.max(0, Math.round(improvement * valuePerUnit));
}

export function calculateModuleSavings(module: ModuleImpact) {
  return module.metrics.reduce((total, metric) => total + metric.financialImpact, 0);
}

export function calculateImpactTotals(modules: ModuleImpact[]): ImpactTotals {
  const metrics = modules.flatMap((module) => module.metrics);
  const improvedMetrics = metrics.filter((metric) => metric.status === 'Improved');
  const financialTotal = metrics.reduce((total, metric) => total + metric.financialImpact, 0);
  const timeMetrics = metrics.filter((metric) => /time|hours|downtime|cycle|lead/i.test(metric.metricName));
  const efficiencyMetrics = improvedMetrics.filter((metric) => metric.unit === '%');
  return {
    moneySaved: Math.round(financialTotal * 0.64),
    costAvoided: Math.round(financialTotal * 0.36),
    timeSavedHours: Math.round(timeMetrics.reduce((total, metric) => total + Math.abs(metric.difference), 0) * 18),
    efficiencyImprovement: round(efficiencyMetrics.reduce((total, metric) => total + Math.abs(metric.percentageChange), 0) / Math.max(1, efficiencyMetrics.length)),
    improved: improvedMetrics.length,
    declined: metrics.filter((metric) => metric.status === 'Declined').length,
    noChange: metrics.filter((metric) => metric.status === 'No Change').length,
  };
}

export function formatMetricValue(value: number, unit: string, currency = 'INR') {
  if (unit === 'INR') return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  if (unit === '%') return `${round(value)}%`;
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value)} ${unit}`.trim();
}
