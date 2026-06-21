import { calculateDifference, calculateFinancialImpact, calculatePercentageChange, calculateStatus, round } from './calculations';
import type { ImpactMetric, ModuleImpact } from './types';

type ModuleDefinition = { key: string; name: string; department: string; outputs: string[]; metrics: string[] };

const definitions: ModuleDefinition[] = [
  { key: 'inventory', name: 'Inventory', department: 'Inventory Control', outputs: ['Money saved', 'Working capital released', 'Days of stock improved', 'Inventory turnover improvement'], metrics: ['Inventory value reduction', 'Carrying cost reduction', 'Dead stock reduction', 'Slow-moving stock reduction', 'Stockout reduction', 'Warehouse utilization improvement', 'Reorder accuracy improvement', 'Stock adjustment reduction', 'Inventory accuracy improvement'] },
  { key: 'production', name: 'Production', department: 'Production Operations', outputs: ['Extra units produced', 'Lost hours avoided', 'Production cost saved', 'Throughput improvement'], metrics: ['Production output increase', 'Plan vs actual improvement', 'OEE improvement', 'Downtime reduction', 'Capacity utilization improvement', 'Schedule adherence improvement', 'Scrap reduction', 'Rework reduction', 'Cycle time reduction'] },
  { key: 'maintenance', name: 'Maintenance', department: 'Asset Maintenance', outputs: ['Downtime cost avoided', 'Maintenance cost saved', 'Asset uptime gained', 'Emergency repair reduction'], metrics: ['Downtime reduction', 'Breakdown reduction', 'Preventive maintenance compliance improvement', 'Work order closure improvement', 'Spare parts cost reduction', 'Asset availability improvement', 'Maintenance response time improvement', 'MTTR improvement', 'MTBF improvement'] },
  { key: 'quality', name: 'Quality', department: 'Quality Assurance', outputs: ['Quality cost saved', 'Scrap money saved', 'Customer complaint reduction', 'Compliance improvement'], metrics: ['Defect reduction', 'Rejection reduction', 'Scrap cost reduction', 'Rework cost reduction', 'Complaint reduction', 'Inspection pass rate improvement', 'CAPA closure improvement', 'NCR reduction', 'Quality audit score improvement'] },
  { key: 'procurement', name: 'Procurement', department: 'Strategic Sourcing', outputs: ['Purchase cost saved', 'Lead time days saved', 'Better supplier performance', 'Expedited cost avoided'], metrics: ['Purchase price variance improvement', 'Vendor lead time reduction', 'On-time delivery improvement', 'Supplier quality improvement', 'RFQ cycle time reduction', 'PO approval time reduction', 'Material shortage reduction', 'Emergency purchase reduction'] },
  { key: 'sales', name: 'Sales & Distribution', department: 'Sales and Logistics', outputs: ['Revenue protected', 'Logistics cost saved', 'Delivery time saved', 'Customer service improvement'], metrics: ['Order fulfillment improvement', 'Delivery delay reduction', 'Dispatch efficiency improvement', 'Logistics cost reduction', 'Revenue increase', 'Order backlog reduction', 'Customer complaint reduction', 'On-time delivery improvement'] },
  { key: 'costing', name: 'Costing & Profitability', department: 'Finance and Costing', outputs: ['Margin improved', 'Cost per unit saved', 'Profit increase', 'Loss-making product identification'], metrics: ['Material cost reduction', 'Labor cost reduction', 'Machine cost reduction', 'Energy cost reduction', 'Logistics cost reduction', 'Cost per unit reduction', 'Gross margin improvement', 'Product profitability improvement', 'Customer profitability improvement', 'Plant profitability improvement'] },
  { key: 'planning', name: 'Planning', department: 'Integrated Planning', outputs: ['Planning error reduced', 'Better resource utilization', 'Fewer shortages', 'Fewer excesses'], metrics: ['Plan accuracy improvement', 'Demand plan variance reduction', 'Capacity plan accuracy improvement', 'Procurement plan accuracy improvement', 'Production plan adherence improvement', 'Inventory plan adherence improvement', 'Workforce plan utilization improvement'] },
  { key: 'warehouse', name: 'Warehouse', department: 'Warehouse Operations', outputs: ['Warehouse cost saved', 'Labor hours saved', 'Faster movement', 'Better stock accuracy'], metrics: ['Space utilization improvement', 'Picking accuracy improvement', 'Receiving time reduction', 'Dispatch time reduction', 'Cycle count accuracy improvement', 'Bin utilization improvement', 'Material handling time reduction'] },
  { key: 'compliance', name: 'Compliance', department: 'Risk and Compliance', outputs: ['Compliance risk reduced', 'Audit readiness improved', 'Penalty risk avoided', 'Faster approvals'], metrics: ['Audit findings reduction', 'Compliance score improvement', 'Document approval time reduction', 'Electronic signature completion improvement', 'Non-compliance reduction', 'Corrective action closure improvement'] },
  { key: 'customer-portal', name: 'Customer Portal', department: 'Customer Experience', outputs: ['Support workload reduced', 'Customer satisfaction improved', 'Faster query resolution'], metrics: ['Customer self-service usage', 'Support ticket reduction', 'Order visibility improvement', 'Invoice query reduction', 'Delivery query reduction', 'Customer response time improvement'] },
  { key: 'supplier-portal', name: 'Supplier Portal', department: 'Supplier Collaboration', outputs: ['Procurement cycle improved', 'Supplier communication improved', 'Manual follow-up reduced'], metrics: ['Supplier response time improvement', 'RFQ response improvement', 'PO acknowledgement time reduction', 'Delivery update improvement', 'Supplier document completion', 'Supplier dispute reduction'] },
  { key: 'integration-hub', name: 'Integration Hub', department: 'Enterprise Integration', outputs: ['Admin time saved', 'Data errors reduced', 'Faster data availability', 'Integration reliability improved'], metrics: ['Manual data entry reduction', 'Sync success rate improvement', 'Failed sync reduction', 'Data import time reduction', 'Integration uptime improvement', 'Duplicate data reduction'] },
  { key: 'data-hub', name: 'Manufacturing Data Hub', department: 'Data Governance', outputs: ['Cleaner data', 'Faster reporting', 'Fewer mismatches', 'Better operational trust'], metrics: ['Data quality improvement', 'Missing data reduction', 'Duplicate record reduction', 'Data mapping completion', 'Reconciliation accuracy', 'Data freshness improvement', 'Pending update closure'] },
  { key: 'admin', name: 'Admin', department: 'Platform Administration', outputs: ['Admin time saved', 'Better governance', 'Faster user access', 'Fewer configuration errors'], metrics: ['User onboarding time reduction', 'Approval time reduction', 'Permission issue reduction', 'Support tickets reduction', 'Audit issue reduction', 'Workflow completion improvement'] },
  { key: 'documents', name: 'Document Management', department: 'Document Control', outputs: ['Time saved', 'Compliance improved', 'Better document control'], metrics: ['Document approval time reduction', 'Expired document reduction', 'Version conflict reduction', 'Search time reduction', 'SOP acknowledgement improvement'] },
];

function hash(value: string) {
  return [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 9973, 17);
}

function metricUnit(metricName: string) {
  if (/cost|value|revenue|profit|margin|price/i.test(metricName)) return 'INR';
  if (/time|days|lead time|MTTR|MTBF/i.test(metricName)) return 'hours';
  if (/output|units|ticket|complaint|breakdown|finding|record|purchase|shortage|conflict|query/i.test(metricName)) return 'count';
  return '%';
}

function improvementDirection(metricName: string): ImpactMetric['improvementWhen'] {
  return /reduction|cost|downtime|scrap|rework|delay|variance|time|error|shortage|excess|finding|expired|conflict|complaint|backlog|failed|duplicate|issue|breakdown|NCR|non-compliance/i.test(metricName) ? 'decrease' : 'increase';
}

function buildMetric(definition: ModuleDefinition, metricName: string, index: number): ImpactMetric {
  const seed = hash(`${definition.key}-${metricName}`);
  const unit = metricUnit(metricName);
  const improvementWhen = improvementDirection(metricName);
  const previousValue = unit === 'INR' ? 900000 + seed * 730 : unit === '%' ? 55 + (seed % 29) : unit === 'hours' ? 26 + (seed % 70) : 18 + (seed % 140);
  const scenario = seed % 9;
  const movement = scenario === 0 ? 0 : 4 + (seed % 18);
  const preferredDirection = scenario < 7;
  const signedMovement = improvementWhen === 'increase' ? (preferredDirection ? movement : -movement) : (preferredDirection ? -movement : movement);
  const currentValue = round(Math.max(0, previousValue + (unit === 'INR' ? signedMovement * 12500 : signedMovement)));
  const status = calculateStatus(previousValue, currentValue, improvementWhen);
  const financialImpact = calculateFinancialImpact(previousValue, currentValue, improvementWhen, unit === 'INR' ? 1 : 3200 + (seed % 8) * 750);
  return {
    id: metricName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), moduleKey: definition.key, moduleName: definition.name, metricName,
    previousPeriod: 'Q1 2026', currentPeriod: 'Q2 2026', previousValue, currentValue,
    difference: calculateDifference(previousValue, currentValue), percentageChange: calculatePercentageChange(previousValue, currentValue), financialImpact,
    operationalImpact: status === 'Improved' ? `${definition.outputs[index % definition.outputs.length]} with controlled operational risk` : status === 'Declined' ? 'Corrective action and owner review required' : 'Performance held at the previous-period baseline',
    dataSource: `${definition.name} operational ledger`, lastUpdated: '2026-06-20 18:30 IST', responsibleDepartment: definition.department, responsibleOwner: `${definition.department} Manager`, status, unit, improvementWhen,
    history: Array.from({ length: 6 }, (_, historyIndex) => ({ period: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][historyIndex], value: round(previousValue + (currentValue - previousValue) * (historyIndex / 5) + (((seed + historyIndex * 13) % 5) - 2) * (unit === 'INR' ? 2500 : 0.35)) })),
    relatedRecords: Array.from({ length: 3 }, (_, recordIndex) => ({ id: `${definition.key.toUpperCase()}-${String(index + 1).padStart(2, '0')}-${recordIndex + 1}`, name: `${metricName} action ${recordIndex + 1}`, status: recordIndex === 0 ? 'Completed' : recordIndex === 1 ? 'In Progress' : 'Pending Review', value: unit === 'INR' ? `INR ${Math.round(financialImpact / (recordIndex + 2)).toLocaleString('en-IN')}` : `${round(Math.abs(currentValue - previousValue) / (recordIndex + 1))} ${unit}` })),
    notes: [`Baseline approved by ${definition.department}.`, status === 'Improved' ? 'Improvement sustained for two reporting cycles.' : 'Owner action is tracked for the next review.', 'Values are simulated until the backend impact API is connected.'],
  };
}

export const moduleImpacts: ModuleImpact[] = definitions.map((definition) => ({ ...definition, metrics: definition.metrics.map((metricName, index) => buildMetric(definition, metricName, index)) }));
export function getModuleImpact(moduleKey: string) { return moduleImpacts.find((module) => module.key === moduleKey); }
export function getImpactMetric(moduleKey: string, metricId: string) { return getModuleImpact(moduleKey)?.metrics.find((metric) => metric.id === metricId); }
