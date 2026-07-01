import { ClipboardCheck, Factory, FileText, Gauge, GitBranch, Hammer, PackageSearch, Search, ShoppingCart, UsersRound, Warehouse } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { LazyBarChart, LazyLineChart } from '../components/LazyCharts';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { ScrollableTableFrame } from '../components/ScrollableTableFrame';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../lib/format';
import { usePlatform } from '../platform/PlatformContext';
import {
  approvals,
  auditEntries,
  capacityPlans,
  demandPlans,
  impactMetrics,
  inventoryPlans,
  maintenancePlans,
  materialRequirements,
  planningCompany,
  planningFilters,
  procurementPlans,
  productionPlans,
  reports,
  scenarios,
  workforcePlans,
} from '../planning/data';
import type { RuntimeUser } from '../types';

type PlanningSection =
  | 'dashboard'
  | 'demand'
  | 'inventory'
  | 'production'
  | 'capacity'
  | 'materials'
  | 'procurement'
  | 'workforce'
  | 'maintenance'
  | 'scenarios'
  | 'approvals'
  | 'reports'
  | 'audit';

type TableRow = Record<string, string | number | ReactNode>;

const planningNav: Array<{ section: PlanningSection; label: string; path: string; icon: typeof Gauge }> = [
  { section: 'dashboard', label: 'Planning Dashboard', path: '/planning', icon: Gauge },
  { section: 'demand', label: 'Demand Planning', path: '/planning/demand', icon: Gauge },
  { section: 'inventory', label: 'Inventory Planning', path: '/planning/inventory', icon: Warehouse },
  { section: 'production', label: 'Production Planning', path: '/planning/production', icon: Factory },
  { section: 'capacity', label: 'Capacity Planning', path: '/planning/capacity', icon: Gauge },
  { section: 'materials', label: 'Material Planning', path: '/planning/materials', icon: PackageSearch },
  { section: 'procurement', label: 'Procurement Planning', path: '/planning/procurement', icon: ShoppingCart },
  { section: 'workforce', label: 'Workforce Planning', path: '/planning/workforce', icon: UsersRound },
  { section: 'maintenance', label: 'Maintenance Planning', path: '/planning/maintenance', icon: Hammer },
  { section: 'scenarios', label: 'Scenario Planning', path: '/planning/scenarios', icon: GitBranch },
  { section: 'approvals', label: 'Planning Approvals', path: '/planning/approvals', icon: ClipboardCheck },
  { section: 'reports', label: 'Planning Reports', path: '/planning/reports', icon: FileText },
  { section: 'audit', label: 'Planning Audit', path: '/planning/audit', icon: ClipboardCheck },
];

const sectionByPath: Record<string, PlanningSection> = {
  '/planning': 'dashboard',
  '/planning/demand': 'demand',
  '/planning/inventory': 'inventory',
  '/planning/production': 'production',
  '/planning/capacity': 'capacity',
  '/planning/materials': 'materials',
  '/planning/procurement': 'procurement',
  '/planning/workforce': 'workforce',
  '/planning/maintenance': 'maintenance',
  '/planning/scenarios': 'scenarios',
  '/planning/approvals': 'approvals',
  '/planning/reports': 'reports',
  '/planning/audit': 'audit',
};

export function PlanningModulePage({ user }: { user: RuntimeUser }) {
  const { selectedClient, platformUser } = usePlatform();
  const location = useLocation();
  const section = sectionByPath[location.pathname] ?? 'dashboard';
  const company = selectedClient ?? planningCompany;
  const planningAllowed = platformUser.assignedModules.includes('Planning') && (!selectedClient || selectedClient.enabledModules.includes('Planning'));

  if (!planningAllowed) {
    return (
      <Panel title="Planning is not enabled" description="Your role, company, or assigned module list does not include Planning.">
        <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          Planning requires tenant, company, role, and user assignment before the Company Admin view is visible.
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Company Admin Planning"
        title={section === 'dashboard' ? 'Planning Control Tower' : planningNav.find((item) => item.section === section)?.label ?? 'Planning'}
        description="Company-level planning view for demand, production, materials, capacity, workforce, and maintenance risks."
      />
      <CompanyContext company={company} />
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-slate-950/35 p-2 xl:sticky xl:top-24">
          <div className="mb-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-sm font-semibold text-white">Planning Module</p>
            <p className="text-xs text-slate-500">Company context fixed</p>
          </div>
          <nav className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
            {planningNav.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === '/planning'} className={({ isActive }) => planningLinkClass(isActive)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="min-w-0">
          <PlanningSectionContent section={section} user={user} />
        </section>
      </div>
    </div>
  );
}

function PlanningSectionContent({ section, user }: { section: PlanningSection; user: RuntimeUser }) {
  if (section === 'dashboard') return <PlanningDashboard />;
  if (section === 'demand') return <PlanRegister title="Demand Planning" description="Manage demand plans for ABC Manufacturing only." rows={demandRows()} searchKeys={['Demand Plan ID', 'Product', 'Customer', 'Owner']} action="Create Demand Plan" />;
  if (section === 'inventory') return <PlanRegister title="Inventory Planning" description="Target inventory, safety stock, reorder points, shortage risk, and excess inventory risk." rows={inventoryRows()} searchKeys={['Inventory Plan ID', 'Product', 'Plant', 'Warehouse', 'Owner']} action="Create Inventory Plan" extra={<InventoryWidgets />} />;
  if (section === 'production') return <PlanRegister title="Production Planning" description="Convert demand and inventory gaps into executable production plans." rows={productionRows()} searchKeys={['Production Plan ID', 'Product', 'Plant', 'Line', 'Owner']} action="Create Production Plan" extra={<ProductionWidgets />} />;
  if (section === 'capacity') return <PlanRegister title="Capacity Planning" description="Check whether plants, lines, machines, shifts, and labor can support the production plan." rows={capacityRows()} searchKeys={['Capacity Plan ID', 'Plant', 'Line', 'Work Center', 'Owner']} action="Create Capacity Plan" extra={<CapacityWidgets />} />;
  if (section === 'materials') return <PlanRegister title="Material Requirement Planning" description="Calculate material requirements from production plans and BOM demand." rows={materialRows()} searchKeys={['MRP ID', 'Material', 'Product', 'Supplier']} action="Create Material Plan" />;
  if (section === 'procurement') return <PlanRegister title="Procurement Planning" description="Convert material shortages into procurement plans and purchase schedules." rows={procurementRows()} searchKeys={['Procurement Plan ID', 'Material', 'Supplier', 'Owner']} action="Create Procurement Plan" />;
  if (section === 'workforce') return <PlanRegister title="Workforce Planning" description="Calculate workforce required to execute the production plan." rows={workforceRows()} searchKeys={['Workforce Plan ID', 'Plant', 'Line', 'Shift', 'Owner']} action="Create Workforce Plan" />;
  if (section === 'maintenance') return <PlanRegister title="Maintenance Planning" description="Align maintenance windows with production plan and asset availability." rows={maintenanceRows()} searchKeys={['Maintenance Plan ID', 'Asset', 'Plant', 'Line', 'Owner']} action="Create Maintenance Plan" />;
  if (section === 'scenarios') return <ScenarioPlanning />;
  if (section === 'approvals') return <ApprovalsPanel user={user} />;
  if (section === 'reports') return <ReportsPanel />;
  return <AuditPanel />;
}

function PlanningDashboard() {
  const navigate = useNavigate();
  const shortageCount = materialRequirements.filter((item) => item.shortageQty > 0).length;
  const openRisks = [...materialRequirements, ...capacityPlans, ...workforcePlans, ...maintenancePlans].filter((item) => ['Critical', 'Warning', 'Review'].includes(item.status)).length;
  const totalDemand = demandPlans.reduce((sum, item) => sum + item.forecastQty, 0);
  const plannedProduction = productionPlans.reduce((sum, item) => sum + item.plannedProduction, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Forecast Demand" value={totalDemand.toLocaleString()} helper="Monthly demand quantity" accent="blue" />
        <StatCard label="Planned Production" value={plannedProduction.toLocaleString()} helper="Approved and draft plan" accent="emerald" />
        <StatCard label="Material Shortages" value={shortageCount} helper="Shortage rows requiring action" accent="amber" onClick={() => navigate('/planning/materials')} />
        <StatCard label="Inventory Coverage" value="17 days" helper="Weighted coverage" accent="violet" onClick={() => navigate('/planning/inventory')} />
        <StatCard label="Capacity Utilization" value="97%" helper="Across work centers" accent="amber" onClick={() => navigate('/planning/capacity')} />
        <StatCard label="Workforce Utilization" value="91%" helper="Shift labor utilization" accent="blue" onClick={() => navigate('/planning/workforce')} />
        <StatCard label="Open Planning Risks" value={openRisks} helper="Capacity, material, labor, maintenance" accent="amber" />
        <StatCard label="Planning Accuracy" value="91%" helper="Forecast versus actual orders" accent="emerald" />
      </div>
      <PlanningFilterSidebar />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Demand vs Production Plan" description="Demand quantity, planned production quantity, and gap." action={<button className="form-button-subtle" onClick={() => navigate('/planning/production')}>Open Production</button>}>
          <PlanningTrendChart data={productionPlans.map((item) => ({ name: item.product, demand: item.forecastDemand, production: item.plannedProduction, gap: item.plannedProduction - item.forecastDemand }))} bars={['demand', 'production', 'gap']} />
        </Panel>
        <Panel title="Capacity Load" description="Available capacity, required capacity, and utilization." action={<button className="form-button-subtle" onClick={() => navigate('/planning/capacity')}>Open Capacity</button>}>
          <PlanningTrendChart data={capacityPlans.map((item) => ({ name: item.workCenter, available: item.availableCapacity, required: item.requiredCapacity, utilization: item.utilization }))} bars={['available', 'required']} />
        </Panel>
        <Panel title="Material Shortage Summary" description="Materials short against production requirements." action={<button className="form-button-subtle" onClick={() => navigate('/planning/materials')}>Open Materials</button>}>
          <PlanningDataTable rows={materialRows().filter((row) => Number(row['Shortage Qty']) > 0)} />
        </Panel>
        <Panel title="Inventory Coverage" description="Current stock versus forecast demand and coverage days." action={<button className="form-button-subtle" onClick={() => navigate('/planning/inventory')}>Open Inventory</button>}>
          <PlanningDataTable rows={inventoryRows()} />
        </Panel>
      </div>
      <Panel title="Planning Actions" description="Draft actions that require human approval before execution.">
        <PlanningDataTable rows={[
          { Action: 'Generate purchase requisition', Module: 'Procurement', Owner: 'Rohan Patel', Priority: 'High', 'Due Date': '2026-06-24', Status: <StatusBadge status="Pending Approval" /> },
          { Action: 'Resolve Line 2 capacity gap', Module: 'Capacity', Owner: 'Pavan Reddy', Priority: 'Critical', 'Due Date': '2026-06-25', Status: <StatusBadge status="Critical" /> },
          { Action: 'Move maintenance window', Module: 'Maintenance', Owner: 'Meera Iyer', Priority: 'High', 'Due Date': '2026-06-26', Status: <StatusBadge status="Review" /> },
          { Action: 'Approve cake demand plan', Module: 'Demand', Owner: 'Company Admin', Priority: 'Medium', 'Due Date': '2026-06-27', Status: <StatusBadge status="Pending Approval" /> },
        ]} />
      </Panel>
      <PlanningImpactGrid />
    </div>
  );
}

function PlanRegister({ title, description, rows, searchKeys, action, extra }: { title: string; description: string; rows: TableRow[]; searchKeys: string[]; action: string; extra?: ReactNode }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [drawer, setDrawer] = useState(false);
  const filteredRows = useMemo(() => rows.filter((row) => {
    const searchable = searchKeys.map((key) => String(row[key] ?? '')).join(' ').toLowerCase();
    const statusText = String(row.Status ?? '').toLowerCase();
    return (!search || searchable.includes(search.toLowerCase())) && (!status || statusText.includes(status.toLowerCase()));
  }), [rows, search, searchKeys, status]);
  return (
    <div className="space-y-5">
      <Panel title={title} description={description} action={<button className="form-button-primary" onClick={() => setDrawer(true)}>{action}</button>}>
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input className="form-input w-full pl-10" placeholder={`Search ${searchKeys.join(', ').toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {planningFilters.statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button className="form-button-subtle" onClick={() => { setSearch(''); setStatus(''); }}>Clear</button>
        </div>
        <PlanningDataTable rows={filteredRows} />
      </Panel>
      {extra}
      {drawer ? <PlanningFormDrawer title={action} onClose={() => setDrawer(false)} /> : null}
    </div>
  );
}

function ScenarioPlanning() {
  const [drawer, setDrawer] = useState(false);
  return (
    <div className="space-y-5">
      <Panel title="Scenario Planning" description="Run rule-based what-if scenarios. AI simulation is intentionally not enabled yet." action={<button className="form-button-primary" onClick={() => setDrawer(true)}>Create Scenario</button>}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((item) => <PlanningScenarioCard key={item.id} scenario={item} />)}
        </div>
      </Panel>
      {drawer ? <PlanningFormDrawer title="Create Scenario" onClose={() => setDrawer(false)} /> : null}
    </div>
  );
}

function ApprovalsPanel({ user }: { user: RuntimeUser }) {
  const [notice, setNotice] = useState('');
  const rows = approvals.map((item) => ({
    'Approval ID': item.id,
    'Plan Type': item.type,
    'Plan ID': item.planId,
    'Requested By': item.requestedBy,
    Approver: item.approver,
    'Submitted Date': item.submittedDate,
    Status: <StatusBadge status={item.status} />,
    Comments: item.comments,
    Actions: (
      <div className="flex gap-2">
        {['Approve', 'Reject', 'Request Changes'].map((action) => <button key={action} className="form-button-subtle py-1 text-xs" onClick={() => setNotice(`${action} drafted by ${user.name}. Human confirmation is required before execution.`)}>{action}</button>)}
      </div>
    ),
  }));
  return <Panel title="Planning Approvals" description="Approve, reject, or request changes for company planning records.">{notice ? <div className="mb-4 rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">{notice}</div> : null}<PlanningDataTable rows={rows} /></Panel>;
}

function ReportsPanel() {
  return (
    <div className="space-y-5">
      <PlanningFilterSidebar />
      <Panel title="Planning Reports" description="Preview and export planning reports by date, plant, warehouse, product, owner, and status.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <div key={report} className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <p className="font-medium text-white">{report}</p>
              <p className="mt-2 text-sm text-slate-400">Supports preview, PDF, Excel, and CSV export.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Preview', 'PDF', 'Excel', 'CSV'].map((item) => <button key={item} className="form-button-subtle py-1 text-xs">{item}</button>)}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AuditPanel() {
  return <Panel title="Planning Audit" description="Business-friendly audit history without raw backend IDs."><PlanningDataTable rows={auditEntries.map((item) => ({ Timestamp: item.timestamp, User: item.user, Action: item.action, 'Plan Type': item.planType, 'Plan ID': item.planId, 'Previous Value': item.previousValue, 'New Value': item.newValue, Reason: item.reason }))} /></Panel>;
}

function PlanningFilterSidebar() {
  return (
    <Panel title="Planning Filters" description="Company context is fixed. No company or client filter is shown for Company Admin.">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Filter label="Plant" options={planningFilters.plants} />
        <Filter label="Warehouse" options={planningFilters.warehouses} />
        <Filter label="Product" options={planningFilters.products} />
        <Filter label="Category" options={planningFilters.categories} />
        <Filter label="Planner" options={planningFilters.planners} />
        <Filter label="Status" options={planningFilters.statuses} />
      </div>
    </Panel>
  );
}

function PlanningDataTable({ rows }: { rows: TableRow[] }) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  return (
    <ScrollableTableFrame count={rows.length}>
      <table className="min-w-[1100px] w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
            {headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(Object.values(row)[0] ?? index)} className="border-b border-white/10 hover:bg-white/[0.04]">
              {headers.map((header) => <td key={header} className="px-3 py-3 text-slate-300">{header === 'Status' && typeof row[header] === 'string' ? <StatusBadge status={String(row[header])} /> : row[header]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollableTableFrame>
  );
}

function PlanningTrendChart({ data, bars }: { data: Array<Record<string, string | number>>; bars: string[] }) {
  return <LazyBarChart data={data} bars={bars} showLegend />;
}

function PlanningLineChart({ data }: { data: Array<Record<string, string | number>> }) {
  return <LazyLineChart data={data} />;
}

function PlanningImpactGrid() {
  return (
    <Panel title="Planning Business Impact" description="Measured impact delivered by planning improvements.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {impactMetrics.map((item) => <PlanningImpactCard key={item.metric} item={item} />)}
      </div>
    </Panel>
  );
}

function PlanningImpactCard({ item }: { item: typeof impactMetrics[number] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-white">{item.metric}</p>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Detail label="Previous" value={item.previous} />
        <Detail label="Current" value={item.current} />
        <Detail label="Difference" value={item.difference} />
        <Detail label="Impact" value={formatCurrency(item.financialImpact, planningCompany.currency)} />
      </div>
      <p className="mt-3 text-xs text-slate-500">Owner: {item.owner}</p>
    </div>
  );
}

function PlanningScenarioCard({ scenario }: { scenario: typeof scenarios[number] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{scenario.name}</p>
          <p className="mt-1 text-xs text-slate-500">{scenario.id} · {scenario.type}</p>
        </div>
        <StatusBadge status={scenario.status} />
      </div>
      <p className="mt-4 text-sm text-slate-300">{scenario.estimatedImpact}</p>
      <p className="mt-2 text-xs text-slate-500">{scenario.basePlan} · {scenario.impactArea} · {scenario.owner}</p>
      <div className="mt-4 flex gap-2">
        <button className="form-button-subtle py-1 text-xs">Run Scenario</button>
        <button className="form-button-subtle py-1 text-xs">Export</button>
      </div>
    </div>
  );
}

function PlanningFormDrawer({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#091225] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400">Draft-only mock form. Critical actions still require human approval.</p>
          </div>
          <button className="form-button-subtle" onClick={onClose}>Close</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Product"><select className="form-input mt-1 w-full">{planningCompany.products.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Owner"><select className="form-input mt-1 w-full">{planningFilters.planners.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Plant"><select className="form-input mt-1 w-full">{planningCompany.plants.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Status"><select className="form-input mt-1 w-full">{planningFilters.statuses.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Forecast Quantity"><input className="form-input mt-1 w-full" min={0} type="number" defaultValue={0} /></Field>
          <Field label="Required Date"><input className="form-input mt-1 w-full" type="date" defaultValue="2026-07-01" /></Field>
          <Field label="Notes" className="md:col-span-2"><textarea className="form-input mt-1 min-h-24 w-full" placeholder="Business reason or planning notes" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="form-button-subtle" onClick={onClose}>Cancel</button>
          <button className="form-button-primary" onClick={onClose}>Save Draft</button>
        </div>
      </section>
    </div>
  );
}

function InventoryWidgets() {
  return <Panel title="Inventory Coverage Chart" description="Coverage days by product."><PlanningLineChart data={inventoryPlans.map((item) => ({ name: item.product, value: item.coverageDays }))} /></Panel>;
}

function ProductionWidgets() {
  return <Panel title="Production Plan vs Demand" description="Required and planned production by product."><PlanningTrendChart data={productionPlans.map((item) => ({ name: item.product, required: item.requiredProduction, planned: item.plannedProduction }))} bars={['required', 'planned']} /></Panel>;
}

function CapacityWidgets() {
  return <Panel title="Overloaded Lines" description="Capacity utilization by work center."><PlanningTrendChart data={capacityPlans.map((item) => ({ name: item.workCenter, utilization: item.utilization }))} bars={['utilization']} /></Panel>;
}

function CompanyContext({ company }: { company: { clientName: string; clientId: string; currency: string; region: string; market: string } }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:grid-cols-4">
      <Detail label="Company" value={company.clientName} />
      <Detail label="Client ID" value={company.clientId} />
      <Detail label="Currency" value={company.currency} />
      <Detail label="Region / Market" value={`${company.region} / ${company.market}`} />
    </div>
  );
}

function Filter({ label, options }: { label: string; options: string[] }) {
  return <label className="text-sm text-slate-300">{label}<select className="form-input mt-1 w-full"><option>All {label.toLowerCase()}</option>{options.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`text-sm text-slate-300 ${className}`}>{label}{children}</label>;
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return <div><p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 font-medium text-white">{value}</p></div>;
}

function planningLinkClass(active: boolean) {
  return `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'border border-cyan-300/20 bg-cyan-400/10 text-white' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`;
}

function demandRows() { return demandPlans.map((item) => ({ 'Demand Plan ID': item.id, Product: item.product, Customer: item.customer, Region: item.region, Market: item.market, 'Forecast Period': item.period, 'Forecast Qty': item.forecastQty, 'Confirmed Orders': item.confirmedOrders, Variance: item.variance, Status: item.status, Owner: item.owner, 'Last Updated': item.updated, Actions: <RowActions /> })); }
function inventoryRows() { return inventoryPlans.map((item) => ({ 'Inventory Plan ID': item.id, Product: item.product, Plant: item.plant, Warehouse: item.warehouse, 'Current Stock': item.currentStock, 'Forecast Demand': item.forecastDemand, 'Safety Stock': item.safetyStock, 'Reorder Point': item.reorderPoint, 'Target Stock': item.targetStock, 'Coverage Days': item.coverageDays, Status: item.status, Owner: item.owner, Actions: <RowActions /> })); }
function productionRows() { return productionPlans.map((item) => ({ 'Production Plan ID': item.id, Product: item.product, 'Forecast Demand': item.forecastDemand, 'Current Stock': item.currentStock, 'Required Production': item.requiredProduction, 'Planned Production': item.plannedProduction, Plant: item.plant, Line: item.line, 'Start Date': item.startDate, 'End Date': item.endDate, Status: item.status, Owner: item.owner, Actions: <RowActions /> })); }
function capacityRows() { return capacityPlans.map((item) => ({ 'Capacity Plan ID': item.id, Plant: item.plant, Line: item.line, 'Work Center': item.workCenter, 'Available Capacity': item.availableCapacity, 'Required Capacity': item.requiredCapacity, 'Utilization %': `${item.utilization}%`, 'Capacity Gap': item.capacityGap, Status: item.status, Owner: item.owner, Actions: <RowActions /> })); }
function materialRows() { return materialRequirements.map((item) => ({ 'MRP ID': item.id, Material: item.material, Product: item.product, 'Required Qty': item.requiredQty, 'Available Qty': item.availableQty, 'On Order Qty': item.onOrderQty, 'Shortage Qty': item.shortageQty, 'Required Date': item.requiredDate, Supplier: item.supplier, Status: item.status, Actions: <RowActions labels={['Create PR', 'View BOM', 'Export']} /> })); }
function procurementRows() { return procurementPlans.map((item) => ({ 'Procurement Plan ID': item.id, Material: item.material, Supplier: item.supplier, 'Required Qty': item.requiredQty, 'Purchase Qty': item.purchaseQty, 'Lead Time': `${item.leadTime} days`, 'Required Date': item.requiredDate, 'Suggested PO Date': item.suggestedPoDate, Status: item.status, Owner: item.owner, Actions: <RowActions labels={['Generate PR', 'Approve', 'Export']} /> })); }
function workforceRows() { return workforcePlans.map((item) => ({ 'Workforce Plan ID': item.id, Plant: item.plant, Line: item.line, Shift: item.shift, 'Required Workers': item.requiredWorkers, 'Available Workers': item.availableWorkers, Gap: item.gap, 'Overtime Hours': item.overtimeHours, Status: item.status, Owner: item.owner, Actions: <RowActions /> })); }
function maintenanceRows() { return maintenancePlans.map((item) => ({ 'Maintenance Plan ID': item.id, Asset: item.asset, Plant: item.plant, Line: item.line, 'Maintenance Type': item.type, 'Planned Date': item.plannedDate, 'Production Impact': item.productionImpact, 'Downtime Hours': item.downtimeHours, Status: item.status, Owner: item.owner, Actions: <RowActions /> })); }

function RowActions({ labels = ['View', 'Edit', 'Submit'] }: { labels?: string[] }) {
  return <div className="flex gap-2">{labels.map((label) => <button key={label} className="form-button-subtle py-1 text-xs">{label}</button>)}</div>;
}
