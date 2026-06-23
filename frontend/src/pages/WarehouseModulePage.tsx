import { ArrowRightLeft, BarChart3, ClipboardCheck, FileText, History, PackageCheck, PackagePlus, Search, ShieldCheck, Truck, Users, Warehouse } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { ScrollableTableFrame } from '../components/ScrollableTableFrame';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../lib/format';
import { usePlatform } from '../platform/PlatformContext';
import type { RuntimeUser } from '../types';
import {
  auditEntries,
  cycleCounts,
  dispatchRecords,
  impactMetrics,
  internalMovements,
  laborRecords,
  packingRecords,
  pickingTasks,
  putawayTasks,
  receivingRecords,
  utilizationRecords,
  warehouseBins,
  warehouseCompany,
  warehouseReports,
} from '../warehouse/data';

type WarehouseSection = 'dashboard' | 'receiving' | 'putaway' | 'bins' | 'picking' | 'packing' | 'dispatch' | 'movements' | 'cycle-counts' | 'utilization' | 'labor' | 'reports' | 'audit';
type TableRow = Record<string, string | number | ReactNode>;

const warehouseNav: Array<{ section: WarehouseSection; label: string; path: string; icon: typeof Warehouse }> = [
  { section: 'dashboard', label: 'Warehouse Dashboard', path: '/warehouse', icon: Warehouse },
  { section: 'receiving', label: 'Receiving', path: '/warehouse/receiving', icon: PackagePlus },
  { section: 'putaway', label: 'Putaway', path: '/warehouse/putaway', icon: PackageCheck },
  { section: 'bins', label: 'Bin Management', path: '/warehouse/bins', icon: Warehouse },
  { section: 'picking', label: 'Picking', path: '/warehouse/picking', icon: ClipboardCheck },
  { section: 'packing', label: 'Packing', path: '/warehouse/packing', icon: PackageCheck },
  { section: 'dispatch', label: 'Dispatch', path: '/warehouse/dispatch', icon: Truck },
  { section: 'movements', label: 'Internal Movements', path: '/warehouse/movements', icon: ArrowRightLeft },
  { section: 'cycle-counts', label: 'Cycle Counts', path: '/warehouse/cycle-counts', icon: ShieldCheck },
  { section: 'utilization', label: 'Warehouse Utilization', path: '/warehouse/utilization', icon: BarChart3 },
  { section: 'labor', label: 'Warehouse Labor', path: '/warehouse/labor', icon: Users },
  { section: 'reports', label: 'Warehouse Reports', path: '/warehouse/reports', icon: FileText },
  { section: 'audit', label: 'Warehouse Audit', path: '/warehouse/audit', icon: History },
];

const sectionByPath = Object.fromEntries(warehouseNav.map((item) => [item.path, item.section])) as Record<string, WarehouseSection>;

export function WarehouseModulePage({ user }: { user: RuntimeUser }) {
  void user;
  const { selectedClient, platformUser } = usePlatform();
  const location = useLocation();
  const section = sectionByPath[location.pathname] ?? 'dashboard';
  const company = selectedClient ?? warehouseCompany;
  const warehouseAllowed = platformUser.assignedModules.includes('Warehouse') && (!selectedClient || selectedClient.enabledModules.includes('Warehouse'));

  if (!warehouseAllowed) {
    return (
      <Panel title="Warehouse is not enabled" description="Your role, company, or assigned module list does not include Warehouse.">
        <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          Warehouse requires tenant, company, role, and user assignment before the Company Admin view is visible.
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Company Admin Warehouse"
        title={section === 'dashboard' ? 'Warehouse Control Tower' : warehouseNav.find((item) => item.section === section)?.label ?? 'Warehouse'}
        description="Company-level warehouse execution view for receiving, putaway, storage, picking, packing, dispatch, utilization, labor, and warehouse risks."
      />
      <CompanyContext company={company} />
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-slate-950/35 p-2 xl:sticky xl:top-24">
          <div className="mb-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-sm font-semibold text-white">Warehouse Module</p>
            <p className="text-xs text-slate-500">Company context fixed</p>
          </div>
          <nav className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
            {warehouseNav.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === '/warehouse'} className={({ isActive }) => linkClass(isActive)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="min-w-0"><WarehouseSectionContent section={section} /></section>
      </div>
    </div>
  );
}

function WarehouseSectionContent({ section }: { section: WarehouseSection }) {
  if (section === 'dashboard') return <WarehouseDashboard />;
  if (section === 'receiving') return <WarehouseRegister title="Receiving" description="Inbound receipts from purchase orders, production receipts, transfers, and customer returns." rows={receivingRows()} searchKeys={['Receipt ID', 'Source Reference', 'Supplier / Source', 'Item']} action="Create Receipt" />;
  if (section === 'putaway') return <WarehouseRegister title="Putaway" description="Move received inventory into storage zones, racks, shelves, and bins." rows={putawayRows()} searchKeys={['Putaway Task ID', 'Receipt ID', 'Item', 'Suggested Bin']} action="Create Putaway Task" />;
  if (section === 'bins') return <WarehouseRegister title="Bin Management" description="Manage exact storage hierarchy, occupancy, capacity, and location availability." rows={binRows()} searchKeys={['Bin ID', 'Warehouse', 'Zone', 'Bin Code', 'Storage Type']} action="Create Bin" />;
  if (section === 'picking') return <WarehouseRegister title="Picking" description="Pick inventory for sales, production, maintenance, and transfer demand." rows={pickingRows()} searchKeys={['Pick Task ID', 'Source Reference', 'Item', 'Picker']} action="Create Pick Task" />;
  if (section === 'packing') return <WarehouseRegister title="Packing" description="Pack picked inventory, validate package details, and create dispatch-ready records." rows={packingRows()} searchKeys={['Packing ID', 'Pick Task ID', 'Order / Source Reference', 'Packed By']} action="Create Packing Record" />;
  if (section === 'dispatch') return <WarehouseRegister title="Dispatch" description="Dispatch packed goods to customers, plants, warehouses, departments, and production lines." rows={dispatchRows()} searchKeys={['Dispatch ID', 'Destination', 'Source Reference', 'Carrier', 'Vehicle']} action="Create Dispatch" />;
  if (section === 'movements') return <WarehouseRegister title="Internal Movements" description="Track bin-to-bin, zone-to-zone, warehouse, replenishment, and quality-hold movement." rows={movementRows()} searchKeys={['Movement ID', 'Item', 'From Location', 'To Location']} action="Create Movement" />;
  if (section === 'cycle-counts') return <WarehouseRegister title="Cycle Counts" description="Verify bin and location accuracy, capture variance, and prepare inventory corrections." rows={cycleRows()} searchKeys={['Count ID', 'Bin', 'Item', 'Counted By']} action="Create Count" />;
  if (section === 'utilization') return <UtilizationPanel />;
  if (section === 'labor') return <LaborPanel />;
  if (section === 'reports') return <ReportsPanel />;
  return <WarehouseRegister title="Warehouse Audit" description="Business-friendly audit history for warehouse execution changes." rows={auditRows()} searchKeys={['Timestamp', 'User', 'Action', 'Warehouse Area', 'Reference ID']} action="Export Audit" />;
}

function WarehouseDashboard() {
  const pendingReceipts = receivingRecords.filter((item) => item.pendingQty > 0).length;
  const pendingPutaway = putawayTasks.filter((item) => !['Completed'].includes(item.status)).length;
  const dispatchReady = dispatchRecords.filter((item) => item.status === 'Ready').length;
  const openTasks = [...putawayTasks, ...pickingTasks, ...internalMovements].filter((item) => !['Completed', 'Received', 'Delivered', 'Dispatched'].includes(item.status)).length;
  const avgUtilization = Math.round(utilizationRecords.reduce((sum, item) => sum + item.utilization, 0) / utilizationRecords.length);
  const avgCycleAccuracy = Math.round((cycleCounts.filter((item) => item.variance === 0).length / cycleCounts.length) * 100);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Pending Receipts" value={pendingReceipts} helper="Inbound records with pending qty" accent="amber" />
        <StatCard label="Pending Putaway" value={pendingPutaway} helper="Open storage tasks" accent="amber" />
        <StatCard label="Picking Accuracy" value="97.6%" helper="Task weighted" accent="emerald" />
        <StatCard label="Packing Accuracy" value="98.3%" helper="Package validation" accent="emerald" />
        <StatCard label="Dispatch Readiness" value={dispatchReady} helper="Ready outbound loads" accent="blue" />
        <StatCard label="Warehouse Utilization" value={`${avgUtilization}%`} helper="Average occupied space" accent={avgUtilization > 85 ? 'amber' : 'emerald'} />
        <StatCard label="Bin Utilization" value="82%" helper="Occupied bin capacity" accent="blue" />
        <StatCard label="Cycle Count Accuracy" value={`${avgCycleAccuracy}%`} helper="Zero-variance locations" accent="emerald" />
        <StatCard label="Open Warehouse Tasks" value={openTasks} helper="Putaway, picks, moves" accent="violet" />
        <StatCard label="Warehouse Health Score" value="88%" helper="Risk adjusted score" accent="emerald" />
      </div>
      <WarehouseFilters />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Receiving Status" description="Expected, received, pending, and delayed inbound quantities."><WarehouseBarChart data={receivingStatusChart()} bars={['received', 'pending', 'delayed']} /></Panel>
        <Panel title="Putaway Queue" description="Open putaway tasks by receipt, item, suggested bin, and priority."><WarehouseDataTable rows={putawayRows().filter((row) => row.Status !== 'Completed')} /></Panel>
        <Panel title="Bin Utilization" description="Capacity, occupied space, available space, and utilization by zone."><WarehouseBarChart data={utilizationRecords.map((item) => ({ name: item.zone, occupied: item.occupied, available: item.available }))} bars={['occupied', 'available']} /></Panel>
        <Panel title="Picking Performance" description="Pick task accuracy and status by order and picker."><WarehouseDataTable rows={pickingRows().slice(0, 6)} /></Panel>
        <Panel title="Dispatch Readiness" description="Packed and pending items by dispatch date."><WarehouseDataTable rows={dispatchRows().slice(0, 6)} /></Panel>
        <Panel title="Warehouse Performance Trend" description="Handling time and readiness trend."><WarehouseLineChart data={[{ name: 'Jan', value: 70 }, { name: 'Feb', value: 74 }, { name: 'Mar', value: 79 }, { name: 'Apr', value: 83 }, { name: 'May', value: 86 }, { name: 'Jun', value: 88 }]} /></Panel>
      </div>
      <WarehouseImpactGrid />
    </div>
  );
}

function WarehouseRegister({ title, description, rows, searchKeys, action }: { title: string; description: string; rows: TableRow[]; searchKeys: string[]; action: string }) {
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
      <WarehouseFilters compact />
      <Panel title={title} description={description} action={<button className="form-button-primary" onClick={() => setDrawer(true)}>{action}</button>}>
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input className="form-input w-full pl-10" placeholder={`Search ${searchKeys.join(', ').toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {['Open', 'Pending', 'In Progress', 'Completed', 'Received', 'Packed', 'Ready', 'Warning', 'Critical', 'Review', 'Blocked'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <button className="form-button-subtle" onClick={() => { setSearch(''); setStatus(''); }}>Clear</button>
        </div>
        <WarehouseDataTable rows={filteredRows} />
      </Panel>
      {drawer ? <WarehouseFormDrawer title={action} onClose={() => setDrawer(false)} /> : null}
    </div>
  );
}

function UtilizationPanel() {
  const totalCapacity = utilizationRecords.reduce((sum, item) => sum + item.capacity, 0);
  const occupied = utilizationRecords.reduce((sum, item) => sum + item.occupied, 0);
  const available = utilizationRecords.reduce((sum, item) => sum + item.available, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Capacity" value={totalCapacity.toLocaleString()} helper="Warehouse capacity units" accent="blue" />
        <StatCard label="Occupied Capacity" value={occupied.toLocaleString()} helper="Stored volume" accent="emerald" />
        <StatCard label="Available Capacity" value={available.toLocaleString()} helper="Open space" accent="blue" />
        <StatCard label="Overloaded Bins" value={warehouseBins.filter((item) => item.utilization > 95).length} helper="Critical capacity risk" accent="amber" />
      </div>
      <Panel title="Warehouse Utilization" description="Measure warehouse space efficiency, overcapacity risk, and optimization opportunities.">
        <WarehouseBarChart data={utilizationRecords.map((item) => ({ name: item.zone, utilization: item.utilization, available: item.available }))} bars={['utilization', 'available']} />
        <div className="mt-5"><WarehouseDataTable rows={utilizationRows()} /></div>
      </Panel>
    </div>
  );
}

function LaborPanel() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Tasks Assigned" value={laborRecords.reduce((sum, item) => sum + item.assignedTasks, 0)} helper="Current shift workload" accent="violet" />
        <StatCard label="Tasks Completed" value={laborRecords.reduce((sum, item) => sum + item.completedTasks, 0)} helper="Closed by warehouse team" accent="emerald" />
        <StatCard label="Average Accuracy" value="97.2%" helper="User weighted accuracy" accent="emerald" />
      </div>
      <Panel title="Warehouse Labor Productivity" description="Workload, completion time, task progress, and accuracy by warehouse user.">
        <WarehouseBarChart data={laborRecords.map((item) => ({ name: item.user, assigned: item.assignedTasks, completed: item.completedTasks, pending: item.pendingTasks }))} bars={['assigned', 'completed', 'pending']} />
        <div className="mt-5"><WarehouseDataTable rows={laborRows()} /></div>
      </Panel>
    </div>
  );
}

function ReportsPanel() {
  return (
    <div className="space-y-5">
      <WarehouseFilters />
      <Panel title="Warehouse Reports" description="Preview and export warehouse reports as PDF, Excel, or CSV.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {warehouseReports.map((report) => (
            <div key={report} className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <p className="font-medium text-white">{report}</p>
              <p className="mt-2 text-sm text-slate-400">Company-scoped report for ABC Manufacturing.</p>
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

function WarehouseDataTable({ rows }: { rows: TableRow[] }) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  return (
    <ScrollableTableFrame count={rows.length}>
      <table className="min-w-[1120px] w-full text-sm">
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

function WarehouseFilters({ compact = false }: { compact?: boolean }) {
  return (
    <Panel title="Warehouse Filters" description="Company context is fixed. No client or company filter is shown for Company Admin.">
      <div className={`grid gap-3 ${compact ? 'md:grid-cols-4 xl:grid-cols-8' : 'md:grid-cols-4 xl:grid-cols-8'}`}>
        <Filter label="Plant" options={warehouseCompany.plants} />
        <Filter label="Warehouse" options={warehouseCompany.warehouses} />
        <Filter label="Zone" options={warehouseCompany.zones} />
        <Filter label="Bin" options={warehouseCompany.bins} />
        <Filter label="Product" options={warehouseCompany.products} />
        <Filter label="Category" options={['Finished Goods', 'Raw Material', 'Spare Parts', 'Consumables']} />
        <Field label="Date Range"><input className="form-input mt-1 w-full" type="date" defaultValue="2026-06-24" /></Field>
        <Filter label="Owner" options={['Receiving Lead', 'Putaway Lead', 'Picking Lead', 'Dispatch Lead', 'Company Admin']} />
      </div>
    </Panel>
  );
}

function WarehouseFormDrawer({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#091225] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400">Draft-only mock form. Warehouse confirmations still require human approval.</p>
          </div>
          <button className="form-button-subtle" onClick={onClose}>Close</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Warehouse"><select className="form-input mt-1 w-full">{warehouseCompany.warehouses.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Zone"><select className="form-input mt-1 w-full">{warehouseCompany.zones.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Item"><select className="form-input mt-1 w-full">{[...warehouseCompany.products, ...warehouseCompany.materials].map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Status"><select className="form-input mt-1 w-full">{['Open', 'In Progress', 'Pending Approval', 'Completed', 'Blocked'].map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Quantity"><input className="form-input mt-1 w-full" min={0} type="number" defaultValue={0} /></Field>
          <Field label="Required Date"><input className="form-input mt-1 w-full" type="date" defaultValue="2026-06-24" /></Field>
          <Field label="Business Reason" className="md:col-span-2"><textarea className="form-input mt-1 min-h-24 w-full" placeholder="Reason required before changing warehouse execution status" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="form-button-subtle" onClick={onClose}>Cancel</button>
          <button className="form-button-primary" onClick={onClose}>Save Draft</button>
        </div>
      </section>
    </div>
  );
}

function WarehouseBarChart({ data, bars }: { data: Array<Record<string, string | number>>; bars: string[] }) {
  const colors = ['#22d3ee', '#34d399', '#f59e0b', '#f43f5e'];
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
          {bars.map((bar, index) => <Bar key={bar} dataKey={bar} fill={colors[index % colors.length]} radius={[6, 6, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WarehouseLineChart({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
          <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={3} dot={{ fill: '#22d3ee' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function WarehouseImpactGrid() {
  return (
    <Panel title="Warehouse Business Impact" description="Measurable operational and financial impact from warehouse execution improvements.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {impactMetrics.map((item) => <WarehouseImpactCard key={item.metric} item={item} />)}
      </div>
    </Panel>
  );
}

function WarehouseImpactCard({ item }: { item: typeof impactMetrics[number] }) {
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
        <Detail label="Impact" value={formatCurrency(item.financialImpact, warehouseCompany.currency)} />
      </div>
      <p className="mt-3 text-xs text-slate-500">Owner: {item.owner}</p>
    </div>
  );
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

function linkClass(active: boolean) {
  return `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'border border-cyan-300/20 bg-cyan-400/10 text-white' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`;
}

function RowActions({ labels = ['View', 'Edit', 'Submit'] }: { labels?: string[] }) {
  return <div className="flex gap-2">{labels.map((label) => <button key={label} className="form-button-subtle py-1 text-xs">{label}</button>)}</div>;
}

function receivingStatusChart() {
  return [
    { name: 'Expected', received: 0, pending: receivingRecords.reduce((sum, item) => sum + item.expectedQty, 0), delayed: 0 },
    { name: 'Received', received: receivingRecords.reduce((sum, item) => sum + item.receivedQty, 0), pending: 0, delayed: 0 },
    { name: 'Pending', received: 0, pending: receivingRecords.reduce((sum, item) => sum + item.pendingQty, 0), delayed: 0 },
    { name: 'Delayed', received: 0, pending: 0, delayed: receivingRecords.filter((item) => item.status === 'Delayed').reduce((sum, item) => sum + item.pendingQty, 0) },
  ];
}

function receivingRows() { return receivingRecords.map((item) => ({ 'Receipt ID': item.id, 'Source Type': item.sourceType, 'Source Reference': item.sourceReference, 'Supplier / Source': item.source, Warehouse: item.warehouse, Item: item.item, 'Expected Qty': item.expectedQty, 'Received Qty': item.receivedQty, 'Pending Qty': item.pendingQty, 'Received Date': item.receivedDate, Status: item.status, Owner: item.owner, Actions: <RowActions labels={['View Receipt', 'Confirm', 'Putaway']} /> })); }
function putawayRows() { return putawayTasks.map((item) => ({ 'Putaway Task ID': item.id, 'Receipt ID': item.receiptId, Item: item.item, Quantity: item.quantity, 'Suggested Zone': item.suggestedZone, 'Suggested Bin': item.suggestedBin, 'Assigned User': item.assignedUser, Priority: item.priority, 'Created Date': item.createdDate, 'Completed Date': item.completedDate, Status: item.status, Actions: <RowActions labels={['Assign', 'Confirm', 'Change Bin']} /> })); }
function binRows() { return warehouseBins.map((item) => ({ 'Bin ID': item.id, Warehouse: item.warehouse, Zone: item.zone, Aisle: item.aisle, Rack: item.rack, Shelf: item.shelf, 'Bin Code': item.binCode, Capacity: item.capacity, Occupied: item.occupied, Available: item.available, 'Utilization %': `${item.utilization}%`, 'Storage Type': item.storageType, Status: item.status, Actions: <RowActions labels={['View Contents', 'Move Stock', 'Disable']} /> })); }
function pickingRows() { return pickingTasks.map((item) => ({ 'Pick Task ID': item.id, 'Source Type': item.sourceType, 'Source Reference': item.sourceReference, Item: item.item, 'Required Qty': item.requiredQty, 'Picked Qty': item.pickedQty, Warehouse: item.warehouse, Bin: item.bin, Picker: item.picker, Priority: item.priority, 'Due Date': item.dueDate, Status: item.status, Actions: <RowActions labels={['Assign', 'Confirm', 'Short Pick']} /> })); }
function packingRows() { return packingRecords.map((item) => ({ 'Packing ID': item.id, 'Pick Task ID': item.pickTaskId, 'Order / Source Reference': item.orderReference, 'Item Count': item.itemCount, 'Packed Qty': item.packedQty, 'Package Type': item.packageType, 'Packed By': item.packedBy, 'Packing Date': item.packingDate, Status: item.status, Actions: <RowActions labels={['Confirm', 'Print Label', 'View']} /> })); }
function dispatchRows() { return dispatchRecords.map((item) => ({ 'Dispatch ID': item.id, 'Destination Type': item.destinationType, Destination: item.destination, 'Source Reference': item.sourceReference, Warehouse: item.warehouse, 'Packed Items': item.packedItems, 'Dispatch Date': item.dispatchDate, Carrier: item.carrier, Vehicle: item.vehicle, Status: item.status, Actions: <RowActions labels={['Confirm', 'Track', 'Cancel']} /> })); }
function movementRows() { return internalMovements.map((item) => ({ 'Movement ID': item.id, 'Movement Type': item.type, Item: item.item, Quantity: item.quantity, 'From Location': item.from, 'To Location': item.to, 'Moved By': item.movedBy, 'Movement Date': item.movementDate, Status: item.status, Actions: <RowActions labels={['Confirm', 'Cancel', 'Export']} /> })); }
function cycleRows() { return cycleCounts.map((item) => ({ 'Count ID': item.id, Warehouse: item.warehouse, Zone: item.zone, Bin: item.bin, Item: item.item, 'System Qty': item.systemQty, 'Counted Qty': item.countedQty, Variance: item.variance, 'Counted By': item.countedBy, 'Count Date': item.countDate, Status: item.status, Actions: <RowActions labels={['Submit', 'Approve Variance', 'Post']} /> })); }
function utilizationRows() { return utilizationRecords.map((item) => ({ Warehouse: item.warehouse, Zone: item.zone, Capacity: item.capacity, Occupied: item.occupied, Available: item.available, 'Utilization %': `${item.utilization}%`, Status: item.status })); }
function laborRows() { return laborRecords.map((item) => ({ User: item.user, Role: item.role, 'Assigned Tasks': item.assignedTasks, 'Completed Tasks': item.completedTasks, 'Pending Tasks': item.pendingTasks, 'Average Completion Time': item.avgCompletionTime, 'Accuracy %': `${item.accuracy}%`, Status: item.status })); }
function auditRows() { return auditEntries.map((item) => ({ Timestamp: item.timestamp, User: item.user, Action: item.action, 'Warehouse Area': item.area, 'Reference ID': item.referenceId, 'Previous Value': item.previousValue, 'New Value': item.newValue, Reason: item.reason })); }
