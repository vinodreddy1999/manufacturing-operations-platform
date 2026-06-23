import { Archive, ArrowRightLeft, BarChart3, ClipboardCheck, FileText, History, PackageCheck, PackagePlus, Search, ShieldCheck, TimerReset, Warehouse } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { ScrollableTableFrame } from '../components/ScrollableTableFrame';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../lib/format';
import {
  adjustments,
  agingBuckets,
  cycleCounts,
  deadStock,
  goodsIssues,
  goodsReceipts,
  inventoryAudit,
  inventoryCompany,
  inventoryImpact,
  inventoryItems,
  inventoryReports,
  lots,
  physicalInventorySteps,
  reorderRules,
  serials,
  slowMoving,
  stockTransfers,
  valuationRows,
} from '../inventory/data';
import { usePlatform } from '../platform/PlatformContext';
import type { RuntimeUser } from '../types';

type InventorySection = 'dashboard' | 'overview' | 'receipts' | 'issues' | 'transfers' | 'adjustments' | 'cycle-counts' | 'physical' | 'aging' | 'dead-stock' | 'slow-moving' | 'reorder' | 'lots' | 'serials' | 'valuation' | 'audit' | 'reports';
type TableRow = Record<string, string | number | ReactNode>;

const inventoryNav: Array<{ section: InventorySection; label: string; path: string; icon: typeof Archive }> = [
  { section: 'dashboard', label: 'Inventory Dashboard', path: '/inventory', icon: Archive },
  { section: 'overview', label: 'Inventory Overview', path: '/inventory/overview', icon: Warehouse },
  { section: 'receipts', label: 'Goods Receipts', path: '/inventory/receipts', icon: PackagePlus },
  { section: 'issues', label: 'Goods Issues', path: '/inventory/issues', icon: PackageCheck },
  { section: 'transfers', label: 'Stock Transfers', path: '/inventory/transfers', icon: ArrowRightLeft },
  { section: 'adjustments', label: 'Inventory Adjustments', path: '/inventory/adjustments', icon: ClipboardCheck },
  { section: 'cycle-counts', label: 'Cycle Counts', path: '/inventory/cycle-counts', icon: ShieldCheck },
  { section: 'physical', label: 'Physical Inventory', path: '/inventory/physical', icon: ClipboardCheck },
  { section: 'aging', label: 'Inventory Aging', path: '/inventory/aging', icon: TimerReset },
  { section: 'dead-stock', label: 'Dead Stock', path: '/inventory/dead-stock', icon: Archive },
  { section: 'slow-moving', label: 'Slow Moving Stock', path: '/inventory/slow-moving', icon: TimerReset },
  { section: 'reorder', label: 'Reorder Management', path: '/inventory/reorder', icon: BarChart3 },
  { section: 'lots', label: 'Lot Management', path: '/inventory/lots', icon: History },
  { section: 'serials', label: 'Serial Tracking', path: '/inventory/serials', icon: History },
  { section: 'valuation', label: 'Inventory Valuation', path: '/inventory/valuation', icon: BarChart3 },
  { section: 'audit', label: 'Inventory Audit', path: '/inventory/audit', icon: ClipboardCheck },
  { section: 'reports', label: 'Inventory Reports', path: '/inventory/reports', icon: FileText },
];

const sectionByPath: Record<string, InventorySection> = Object.fromEntries(inventoryNav.map((item) => [item.path, item.section])) as Record<string, InventorySection>;

export function InventoryModulePage({ user }: { user: RuntimeUser }) {
  void user;
  const { selectedClient, platformUser } = usePlatform();
  const location = useLocation();
  const section = sectionByPath[location.pathname] ?? 'dashboard';
  const company = selectedClient ?? inventoryCompany;
  const inventoryAllowed = platformUser.assignedModules.includes('Inventory') && (!selectedClient || selectedClient.enabledModules.includes('Inventory'));

  if (!inventoryAllowed) {
    return (
      <Panel title="Inventory is not enabled" description="Your role, company, or assigned module list does not include Inventory.">
        <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">Inventory requires tenant, company, role, and user assignment before the Company Admin view is visible.</div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Company Admin Inventory" title={section === 'dashboard' ? 'Inventory Control Tower' : inventoryNav.find((item) => item.section === section)?.label ?? 'Inventory'} description="Company-level stock, valuation, movement, traceability, risk, and working-capital control." />
      <CompanyContext company={company} />
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-slate-950/35 p-2 xl:sticky xl:top-24">
          <div className="mb-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-sm font-semibold text-white">Inventory Module</p>
            <p className="text-xs text-slate-500">Company context fixed</p>
          </div>
          <nav className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
            {inventoryNav.map((item) => <NavLink key={item.path} to={item.path} end={item.path === '/inventory'} className={({ isActive }) => linkClass(isActive)}><item.icon className="h-4 w-4" />{item.label}</NavLink>)}
          </nav>
        </aside>
        <section className="min-w-0"><InventorySectionContent section={section} /></section>
      </div>
    </div>
  );
}

function InventorySectionContent({ section }: { section: InventorySection }) {
  if (section === 'dashboard') return <InventoryDashboard />;
  if (section === 'overview') return <InventoryRegister title="Inventory Overview" description="What inventory exists, where it exists, availability, reservation, and value." rows={overviewRows()} searchKeys={['Item Code', 'Item Name', 'Warehouse', 'Category']} action="Create Inventory Item" />;
  if (section === 'receipts') return <InventoryRegister title="Goods Receipts" description="Purchase, production, transfer, and return receipts that increase inventory and value." rows={receiptRows()} searchKeys={['Receipt Number', 'Supplier', 'PO Number', 'Item']} action="Create Receipt" />;
  if (section === 'issues') return <InventoryRegister title="Goods Issues" description="Production, maintenance, sales, sample, and scrap issues that reduce inventory." rows={issueRows()} searchKeys={['Issue Number', 'Warehouse', 'Department', 'Item']} action="Create Issue" />;
  if (section === 'transfers') return <InventoryRegister title="Stock Transfers" description="Warehouse, plant, and bin transfers with source and destination visibility." rows={transferRows()} searchKeys={['Transfer Number', 'Source', 'Destination', 'Item']} action="Create Transfer" />;
  if (section === 'adjustments') return <InventoryRegister title="Inventory Adjustments" description="Damage, loss, found stock, and audit corrections with approval workflow." rows={adjustmentRows()} searchKeys={['Adjustment Number', 'Reason', 'Item', 'Warehouse']} action="Create Adjustment" />;
  if (section === 'cycle-counts') return <InventoryRegister title="Cycle Counts" description="Cycle count variance, accuracy, and posting status." rows={cycleRows()} searchKeys={['Count Number', 'Warehouse', 'Item']} action="Create Count" />;
  if (section === 'physical') return <PhysicalInventory />;
  if (section === 'aging') return <InventoryRegister title="Inventory Aging" description="Aging quantity and value by bucket." rows={agingRows()} searchKeys={['Bucket']} action="Export Aging" />;
  if (section === 'dead-stock') return <InventoryRegister title="Dead Stock" description="No movement for 180+ days." rows={deadStockRows()} searchKeys={['Item', 'Warehouse']} action="Create Disposal Review" />;
  if (section === 'slow-moving') return <InventoryRegister title="Slow Moving Inventory" description="Low movement count, high coverage days, and trapped cash." rows={slowMovingRows()} searchKeys={['Item']} action="Create Optimization Action" />;
  if (section === 'reorder') return <InventoryRegister title="Reorder Management" description="Reorder points, safety stock, min/max, and stockout status." rows={reorderRows()} searchKeys={['Item', 'Status']} action="Create Reorder Draft" />;
  if (section === 'lots') return <InventoryRegister title="Lot Management" description="Lot number, manufacturing date, expiry date, quantity, and trace actions." rows={lotRows()} searchKeys={['Lot Number', 'Item', 'Status']} action="Create Lot" />;
  if (section === 'serials') return <InventoryRegister title="Serial Tracking" description="Serial-level status and movement history." rows={serialRows()} searchKeys={['Serial Number', 'Item', 'Warehouse', 'Status']} action="Create Serial" />;
  if (section === 'valuation') return <InventoryRegister title="Inventory Valuation" description="FIFO, LIFO, weighted average, standard cost, value, unit cost, and cost variance." rows={valuationTableRows()} searchKeys={['Item', 'Method']} action="Run Valuation" />;
  if (section === 'audit') return <InventoryRegister title="Inventory Audit" description="Business-friendly audit history for stock and value changes." rows={auditRows()} searchKeys={['Timestamp', 'User', 'Action', 'Item']} action="Export Audit" />;
  return <ReportsPanel />;
}

function InventoryDashboard() {
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.value, 0);
  const available = inventoryItems.reduce((sum, item) => sum + item.availableQty, 0);
  const reserved = inventoryItems.reduce((sum, item) => sum + item.reservedQty, 0);
  const deadValue = deadStock.reduce((sum, item) => sum + item.value, 0);
  const slowValue = slowMoving.reduce((sum, item) => sum + item.inventoryValue, 0);
  const stockoutRisk = reorderRules.filter((item) => ['Critical', 'Stockout'].includes(item.status)).length;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Inventory Value" value={formatCurrency(totalValue, inventoryCompany.currency)} helper="Company inventory value" accent="blue" />
        <StatCard label="Available Inventory" value={available.toLocaleString()} helper="Qty available" accent="emerald" />
        <StatCard label="Reserved Inventory" value={reserved.toLocaleString()} helper="Committed to demand" accent="amber" />
        <StatCard label="Inventory Accuracy" value="98.1%" helper="Cycle count weighted" accent="emerald" />
        <StatCard label="Coverage Days" value="17" helper="Weighted coverage" accent="violet" />
        <StatCard label="Inventory Turns" value="8.4" helper="Annualized" accent="blue" />
        <StatCard label="Dead Stock Value" value={formatCurrency(deadValue, inventoryCompany.currency)} helper="No movement 180+ days" accent="amber" />
        <StatCard label="Slow Moving Value" value={formatCurrency(slowValue, inventoryCompany.currency)} helper="Low movement stock" accent="amber" />
        <StatCard label="Stockout Risk" value={stockoutRisk} helper="Critical reorder items" accent="amber" />
        <StatCard label="Inventory Health Score" value="91%" helper="Risk adjusted" accent="emerald" />
      </div>
      <InventoryFilters />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Inventory Value Trend" description="Mock trend from inventory reduction and value optimization."><InventoryLineChart data={[{ name: 'Jan', value: 10000000 }, { name: 'Feb', value: 9400000 }, { name: 'Mar', value: 9100000 }, { name: 'Apr', value: 8700000 }, { name: 'May', value: 8300000 }, { name: 'Jun', value: 8000000 }]} /></Panel>
        <Panel title="Inventory by Warehouse" description="Current value by warehouse."><InventoryBarChart data={warehouseValueRows()} bars={['value']} /></Panel>
        <Panel title="Inventory Coverage" description="Coverage days by item."><InventoryBarChart data={inventoryItems.slice(0, 8).map((item) => ({ name: item.name, coverage: item.coverageDays }))} bars={['coverage']} /></Panel>
        <Panel title="Stockout Risk" description="Items below reorder point or safety stock."><InventoryDataTable rows={reorderRows().filter((row) => ['Critical', 'Stockout'].includes(String(row.Status)))} /></Panel>
        <Panel title="Dead Stock Summary" description="Items with no movement for 180+ days."><InventoryDataTable rows={deadStockRows()} /></Panel>
        <Panel title="Slow Moving Inventory" description="Low movement count and high coverage days."><InventoryDataTable rows={slowMovingRows()} /></Panel>
      </div>
      <InventoryImpactGrid />
    </div>
  );
}

function InventoryRegister({ title, description, rows, searchKeys, action }: { title: string; description: string; rows: TableRow[]; searchKeys: string[]; action: string }) {
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
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input className="form-input w-full pl-10" placeholder={`Search ${searchKeys.join(', ').toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{['Healthy', 'Warning', 'Critical', 'Review', 'Posted', 'Approved', 'Pending Approval', 'Dead Stock', 'Slow Moving'].map((item) => <option key={item}>{item}</option>)}</select>
          <button className="form-button-subtle" onClick={() => { setSearch(''); setStatus(''); }}>Clear</button>
        </div>
        <InventoryDataTable rows={filteredRows} />
      </Panel>
      {drawer ? <InventoryFormDrawer title={action} onClose={() => setDrawer(false)} /> : null}
    </div>
  );
}

function InventoryDataTable({ rows }: { rows: TableRow[] }) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  return (
    <ScrollableTableFrame count={rows.length}>
      <table className="min-w-[1100px] w-full text-sm">
        <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.08em] text-slate-500">{headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={String(Object.values(row)[0] ?? index)} className="border-b border-white/10 hover:bg-white/[0.04]">{headers.map((header) => <td key={header} className="px-3 py-3 text-slate-300">{header === 'Status' && typeof row[header] === 'string' ? <StatusBadge status={String(row[header])} /> : row[header]}</td>)}</tr>)}</tbody>
      </table>
    </ScrollableTableFrame>
  );
}

function PhysicalInventory() {
  return (
    <Panel title="Physical Inventory" description="Freeze, count, verify, approve, and post adjustments.">
      <div className="mb-5 grid gap-3 md:grid-cols-5">{physicalInventorySteps.map((step, index) => <div key={step.step} className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><p className="text-xs text-slate-500">Step {index + 1}</p><p className="mt-1 font-medium text-white">{step.step}</p><p className="mt-2 text-sm text-slate-400">{step.owner}</p><div className="mt-3"><StatusBadge status={step.status} /></div></div>)}</div>
      <InventoryDataTable rows={physicalInventorySteps.map((step) => ({ Step: step.step, Owner: step.owner, Status: step.status, 'Completed On': step.completedOn }))} />
    </Panel>
  );
}

function ReportsPanel() {
  return (
    <div className="space-y-5">
      <InventoryFilters />
      <Panel title="Inventory Reports" description="Preview and export inventory reports as PDF, Excel, or CSV.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {inventoryReports.map((report) => <div key={report} className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><p className="font-medium text-white">{report}</p><p className="mt-2 text-sm text-slate-400">Company-scoped report for ABC Manufacturing.</p><div className="mt-4 flex flex-wrap gap-2">{['Preview', 'PDF', 'Excel', 'CSV'].map((item) => <button key={item} className="form-button-subtle py-1 text-xs">{item}</button>)}</div></div>)}
        </div>
      </Panel>
    </div>
  );
}

function InventoryFilters() {
  return (
    <Panel title="Inventory Filters" description="Company context is fixed. No client or company filter is shown for Company Admin.">
      <div className="grid gap-3 md:grid-cols-5">
        <Filter label="Plant" options={inventoryCompany.plants} />
        <Filter label="Warehouse" options={inventoryCompany.warehouses} />
        <Filter label="Product" options={inventoryCompany.products} />
        <Filter label="Category" options={inventoryCompany.categories} />
        <Field label="Date Range"><input className="form-input mt-1 w-full" type="date" defaultValue="2026-06-24" /></Field>
      </div>
    </Panel>
  );
}

function InventoryImpactGrid() {
  return (
    <Panel title="Inventory Business Impact" description="Working capital and savings impact from inventory improvements.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{inventoryImpact.map((item) => <div key={item.metric} className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><div className="flex items-start justify-between gap-3"><p className="font-medium text-white">{item.metric}</p><StatusBadge status={item.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Detail label="Previous" value={item.previous} /><Detail label="Current" value={item.current} /><Detail label="Difference" value={item.difference} /><Detail label="Impact" value={formatCurrency(item.financialImpact, inventoryCompany.currency)} /></div><p className="mt-3 text-xs text-slate-500">Owner: {item.owner}</p></div>)}</div>
    </Panel>
  );
}

function InventoryLineChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} /><Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={3} dot={{ fill: '#22d3ee' }} /></LineChart></ResponsiveContainer></div>;
}

function InventoryBarChart({ data, bars }: { data: Array<Record<string, string | number>>; bars: string[] }) {
  const colors = ['#22d3ee', '#34d399', '#f59e0b'];
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} /><YAxis stroke="#94a3b8" /><Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />{bars.map((bar, index) => <Bar key={bar} dataKey={bar} fill={colors[index % colors.length]} radius={[6, 6, 0, 0]} />)}</BarChart></ResponsiveContainer></div>;
}

function InventoryFormDrawer({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#091225] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between"><div><h3 className="text-lg font-semibold text-white">{title}</h3><p className="text-sm text-slate-400">Draft-only mock form. Critical inventory actions require approval.</p></div><button className="form-button-subtle" onClick={onClose}>Close</button></div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Item"><select className="form-input mt-1 w-full">{inventoryItems.map((item) => <option key={item.code}>{item.name}</option>)}</select></Field>
          <Field label="Warehouse"><select className="form-input mt-1 w-full">{inventoryCompany.warehouses.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Quantity"><input className="form-input mt-1 w-full" min={0} type="number" defaultValue={0} /></Field>
          <Field label="Reason"><select className="form-input mt-1 w-full">{['Production', 'Maintenance', 'Sales', 'Damage', 'Audit Correction'].map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Notes" className="md:col-span-2"><textarea className="form-input mt-1 min-h-24 w-full" placeholder="Business reason or inventory notes" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button className="form-button-subtle" onClick={onClose}>Cancel</button><button className="form-button-primary" onClick={onClose}>Save Draft</button></div>
      </section>
    </div>
  );
}

function CompanyContext({ company }: { company: { clientName: string; clientId: string; currency: string; region: string; market: string } }) {
  return <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:grid-cols-4"><Detail label="Company" value={company.clientName} /><Detail label="Client ID" value={company.clientId} /><Detail label="Currency" value={company.currency} /><Detail label="Region / Market" value={`${company.region} / ${company.market}`} /></div>;
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

function RowActions({ labels = ['View', 'History', 'Export'] }: { labels?: string[] }) {
  return <div className="flex gap-2">{labels.map((label) => <button key={label} className="form-button-subtle py-1 text-xs">{label}</button>)}</div>;
}

function linkClass(active: boolean) {
  return `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'border border-cyan-300/20 bg-cyan-400/10 text-white' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`;
}

function overviewRows() { return inventoryItems.map((item) => ({ 'Item Code': item.code, 'Item Name': item.name, Category: item.category, Plant: item.plant, Warehouse: item.warehouse, 'Available Qty': item.availableQty, 'Reserved Qty': item.reservedQty, 'Blocked Qty': item.blockedQty, 'In Transit Qty': item.inTransitQty, UOM: item.uom, 'Inventory Value': formatCurrency(item.value, inventoryCompany.currency), Status: item.status, Actions: <RowActions labels={['View', 'History', 'Transfer', 'Reserve', 'Export']} /> })); }
function receiptRows() { return goodsReceipts.map((item) => ({ 'Receipt Number': item.receiptNo, Source: item.source, Supplier: item.supplier, 'PO Number': item.poNumber, Warehouse: item.warehouse, Item: item.item, Quantity: item.quantity, 'Lot Number': item.lotNumber, 'Expiry Date': item.expiryDate, 'Value Update': formatCurrency(item.valueUpdate, inventoryCompany.currency), Status: item.status, Actions: <RowActions /> })); }
function issueRows() { return goodsIssues.map((item) => ({ 'Issue Number': item.issueNo, Type: item.type, Warehouse: item.warehouse, Department: item.department, Item: item.item, Quantity: item.quantity, Reason: item.reason, Status: item.status, Actions: <RowActions /> })); }
function transferRows() { return stockTransfers.map((item) => ({ 'Transfer Number': item.transferNo, Type: item.type, Source: item.source, Destination: item.destination, Item: item.item, Quantity: item.quantity, 'Transfer Date': item.transferDate, Status: item.status, Actions: <RowActions /> })); }
function adjustmentRows() { return adjustments.map((item) => ({ 'Adjustment Number': item.adjustmentNo, Reason: item.reason, Item: item.item, Warehouse: item.warehouse, Quantity: item.quantity, Workflow: item.workflow, Status: item.status, Actions: <RowActions labels={['View', 'Approve', 'Reject']} /> })); }
function cycleRows() { return cycleCounts.map((item) => ({ 'Count Number': item.countNo, Warehouse: item.warehouse, Item: item.item, 'System Qty': item.systemQty, 'Counted Qty': item.countedQty, Variance: item.variance, 'Accuracy %': `${item.accuracy}%`, Status: item.status, Actions: <RowActions labels={['View', 'Post', 'Export']} /> })); }
function agingRows() { return agingBuckets.map((item) => ({ Bucket: item.bucket, 'Aging Quantity': item.quantity, 'Aging Value': formatCurrency(item.value, inventoryCompany.currency), Status: item.status })); }
function deadStockRows() { return deadStock.map((item) => ({ Item: item.item, Warehouse: item.warehouse, 'Last Movement Date': item.lastMovementDate, 'Days Since Movement': item.daysSinceMovement, Value: formatCurrency(item.value, inventoryCompany.currency), Status: item.status, Actions: <RowActions labels={['Review', 'Dispose', 'Transfer']} /> })); }
function slowMovingRows() { return slowMoving.map((item) => ({ Item: item.item, 'Movement Count': item.movementCount, 'Inventory Value': formatCurrency(item.inventoryValue, inventoryCompany.currency), 'Coverage Days': item.coverageDays, Status: item.status, Actions: <RowActions labels={['Review', 'Reduce', 'Transfer']} /> })); }
function reorderRows() { return reorderRules.map((item) => ({ Item: item.item, 'Reorder Point': item.reorderPoint, 'Safety Stock': item.safetyStock, 'Minimum Stock': item.minimumStock, 'Maximum Stock': item.maximumStock, Status: item.status, Actions: <RowActions labels={['Create Draft', 'Approve', 'Export']} /> })); }
function lotRows() { return lots.map((item) => ({ 'Lot Number': item.lotNumber, Item: item.item, 'Manufacturing Date': item.manufacturingDate, 'Expiry Date': item.expiryDate, Quantity: item.quantity, Status: item.status, Actions: <RowActions labels={['Trace Forward', 'Trace Backward', 'History']} /> })); }
function serialRows() { return serials.map((item) => ({ 'Serial Number': item.serialNumber, Item: item.item, Warehouse: item.warehouse, Status: item.status, History: item.history, Actions: <RowActions labels={['View History', 'Transfer', 'Export']} /> })); }
function valuationTableRows() { return valuationRows.map((item) => ({ Item: item.item, Method: item.method, 'Inventory Value': formatCurrency(item.inventoryValue, inventoryCompany.currency), 'Unit Cost': formatCurrency(item.unitCost, inventoryCompany.currency), 'Cost Variance %': `${item.costVariance}%`, Status: item.status, Actions: <RowActions labels={['View', 'Revalue', 'Export']} /> })); }
function auditRows() { return inventoryAudit.map((item) => ({ Timestamp: item.timestamp, User: item.user, Action: item.action, Item: item.item, 'Previous Value': item.previousValue, 'New Value': item.newValue })); }
function warehouseValueRows() { return inventoryCompany.warehouses.map((warehouse) => ({ name: warehouse.replace(' Warehouse', ''), value: inventoryItems.filter((item) => item.warehouse === warehouse).reduce((sum, item) => sum + item.value, 0) })); }
