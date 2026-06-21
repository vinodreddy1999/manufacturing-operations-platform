export type ImpactStatus = 'Improved' | 'Declined' | 'No Change';

export type ImpactHistoryPoint = { period: string; value: number };

export type ImpactMetric = {
  id: string;
  moduleKey: string;
  moduleName: string;
  metricName: string;
  previousPeriod: string;
  currentPeriod: string;
  previousValue: number;
  currentValue: number;
  difference: number;
  percentageChange: number;
  financialImpact: number;
  operationalImpact: string;
  dataSource: string;
  lastUpdated: string;
  responsibleDepartment: string;
  responsibleOwner: string;
  status: ImpactStatus;
  unit: string;
  improvementWhen: 'increase' | 'decrease';
  history: ImpactHistoryPoint[];
  relatedRecords: Array<{ id: string; name: string; status: string; value: string }>;
  notes: string[];
};

export type ModuleImpact = {
  key: string;
  name: string;
  department: string;
  outputs: string[];
  metrics: ImpactMetric[];
};

export type ImpactTotals = {
  moneySaved: number;
  costAvoided: number;
  timeSavedHours: number;
  efficiencyImprovement: number;
  improved: number;
  declined: number;
  noChange: number;
};
