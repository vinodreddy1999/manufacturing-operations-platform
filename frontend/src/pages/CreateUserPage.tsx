import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { MultiSelectAccessGrid } from '../components/MultiSelectAccessGrid';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { platformApplications, platformModules, platformRoles } from '../platform/data';
import { usePlatform } from '../platform/PlatformContext';

type UserForm = {
  firstName: string; lastName: string; loginName: string; email: string; clientId: string | null;
  region: string; market: string; department: string; plant: string; warehouse: string;
  roles: string[]; assignedApplications: string[]; assignedModules: string[]; status: 'Active' | 'Disabled';
};

export function CreateUserPage() {
  const navigate = useNavigate();
  const { state, selectedClient, canSelectPlatform, createUser } = usePlatform();
  const initialClient = selectedClient ?? state.clients[0];
  const [form, setForm] = useState<UserForm>({ firstName: '', lastName: '', loginName: '', email: '', clientId: initialClient.clientId, region: initialClient.region, market: initialClient.market, department: 'Operations', plant: 'Plant A', warehouse: 'Warehouse A', roles: ['Viewer'], assignedApplications: [...initialClient.enabledApplications], assignedModules: [...initialClient.enabledModules], status: 'Active' });
  const client = form.clientId ? state.clients.find((item) => item.clientId === form.clientId) : undefined;
  const roleOptions = platformRoles.filter((role) => canSelectPlatform || role !== 'Super Admin');
  const clientOptions = canSelectPlatform ? state.clients : state.clients.filter((item) => item.clientId === initialClient.clientId);
  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const invalidModules = useMemo(() => form.assignedModules.filter((module) => client?.disabledModules.includes(module)), [form.assignedModules, client]);

  function selectClient(clientId: string | null) {
    if (!clientId) { setForm((current) => ({ ...current, clientId: null, region: 'Global', market: 'Global', department: 'Platform Operations', plant: 'All Plants', warehouse: 'All Warehouses', roles: ['Super Admin'], assignedApplications: platformApplications, assignedModules: platformModules })); return; }
    const next = state.clients.find((item) => item.clientId === clientId)!;
    setForm((current) => ({ ...current, clientId, region: next.region, market: next.market, assignedApplications: next.enabledApplications, assignedModules: next.enabledModules, roles: current.roles.includes('Super Admin') ? ['Company Admin'] : current.roles }));
  }
  function selectRole(role: string) { if (role === 'Super Admin') selectClient(null); else setForm((current) => ({ ...current, roles: [role] })); }
  function submit(event: FormEvent) { event.preventDefault(); if (invalidModules.length) return; createUser(form); navigate('/admin/users'); }

  return <div className="space-y-6"><PageHeader eyebrow="User Management" title="Create User" description="Create a client-scoped user with role, workplace, application, and module assignments." /><Panel title="User profile and access" description={`Generated automatically: User ID and ${fullName || 'First Name + Last Name'}`}><form className="space-y-6" onSubmit={submit}><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Field label="First Name" value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} /><Field label="Last Name" value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} /><Field label="Login Name" value={form.loginName} onChange={(value) => setForm({ ...form, loginName: value })} /><Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><label className="text-sm text-slate-300">Client<select className="form-input mt-1 w-full" value={form.clientId ?? 'platform'} onChange={(event) => selectClient(event.target.value === 'platform' ? null : event.target.value)} disabled={!canSelectPlatform}>{canSelectPlatform ? <option value="platform">Platform</option> : null}{clientOptions.map((item) => <option key={item.clientId} value={item.clientId}>{item.clientName}</option>)}</select></label><label className="text-sm text-slate-300">Role<select className="form-input mt-1 w-full" value={form.roles[0]} onChange={(event) => selectRole(event.target.value)}>{roleOptions.map((role) => <option key={role}>{role}</option>)}</select></label><Field label="Region" value={form.region} readOnly onChange={() => undefined} /><Field label="Market" value={form.market} readOnly onChange={() => undefined} /><Field label="Currency" value={client?.currency ?? 'USD'} readOnly onChange={() => undefined} /><Field label="Department" value={form.department} onChange={(value) => setForm({ ...form, department: value })} /><Field label="Plant" value={form.plant} onChange={(value) => setForm({ ...form, plant: value })} /><Field label="Warehouse" value={form.warehouse} onChange={(value) => setForm({ ...form, warehouse: value })} /><label className="text-sm text-slate-300">Status<select className="form-input mt-1 w-full" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as UserForm['status'] })}><option>Active</option><option>Disabled</option></select></label></div><MultiSelectAccessGrid title="Assigned Applications" description="Only applications enabled for the selected company are available." items={client?.enabledApplications ?? platformApplications} selectedItems={form.assignedApplications} onChange={(assignedApplications) => setForm({ ...form, assignedApplications })} searchPlaceholder="Search applications..." columns={3} /><MultiSelectAccessGrid title="Assigned Modules" description="Only company-enabled functional capabilities can be assigned." items={client?.enabledModules ?? platformModules} selectedItems={form.assignedModules} onChange={(assignedModules) => setForm({ ...form, assignedModules })} searchPlaceholder="Search modules..." columns={3} />{invalidModules.length ? <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100">Disabled modules cannot be assigned: {invalidModules.join(', ')}</p> : null}<div className="flex justify-end gap-3"><button type="button" className="form-button-subtle" onClick={() => navigate('/admin/users')}>Cancel</button><button className="form-button-primary" disabled={Boolean(invalidModules.length)}>Create User</button></div></form></Panel></div>;
}

function Field({ label, value, onChange, type = 'text', readOnly = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; readOnly?: boolean }) { return <label className="text-sm text-slate-300">{label}<input className="form-input mt-1 w-full" type={type} value={value} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} required={!readOnly} /></label>; }
