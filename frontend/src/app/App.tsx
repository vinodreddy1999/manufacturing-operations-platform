import { FormEvent, Suspense, lazy, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  Boxes,
  DatabaseZap,
  FileText,
  Factory,
  Gauge,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Wrench,
} from 'lucide-react';

import { AccessDeniedState } from '../components/AccessDeniedState';
import { LoadingState } from '../components/LoadingState';
import { canAccessSection } from '../lib/rbac';
import { apiConfig, backend } from '../services/api';
import type { RuntimeUser } from '../types';
import { PlatformProvider, usePlatform } from '../platform/PlatformContext';

const AdminCenterPage = lazy(() => import('../pages/AdminCenterPage').then((module) => ({ default: module.AdminCenterPage })));
const DataHubPage = lazy(() => import('../pages/DataHubPage').then((module) => ({ default: module.DataHubPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const IntelligencePage = lazy(() => import('../pages/IntelligencePage').then((module) => ({ default: module.IntelligencePage })));
const InventoryModulePage = lazy(() => import('../pages/InventoryModulePage').then((module) => ({ default: module.InventoryModulePage })));
const ModuleWorkspacePage = lazy(() => import('../pages/ModuleWorkspacePage').then((module) => ({ default: module.ModuleWorkspacePage })));
const MaintenanceModulePage = lazy(() => import('../pages/MaintenanceModulePage').then((module) => ({ default: module.MaintenanceModulePage })));
const OperationsPage = lazy(() => import('../pages/OperationsPage').then((module) => ({ default: module.OperationsPage })));
const PlanningModulePage = lazy(() => import('../pages/PlanningModulePage').then((module) => ({ default: module.PlanningModulePage })));
const ProductionModulePage = lazy(() => import('../pages/ProductionModulePage').then((module) => ({ default: module.ProductionModulePage })));
const WarehouseModulePage = lazy(() => import('../pages/WarehouseModulePage').then((module) => ({ default: module.WarehouseModulePage })));
const BusinessImpactDashboard = lazy(() => import('../pages/BusinessImpactDashboard').then((module) => ({ default: module.BusinessImpactDashboard })));
const ImpactDrilldownPage = lazy(() => import('../pages/ImpactDrilldownPage').then((module) => ({ default: module.ImpactDrilldownPage })));
const PlatformDashboardPage = lazy(() => import('../pages/PlatformDashboardPage').then((module) => ({ default: module.PlatformDashboardPage })));
const PlatformModulePage = lazy(() => import('../pages/PlatformModulePage').then((module) => ({ default: module.PlatformModulePage })));

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'dashboard' as const },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, section: 'admin' as const },
  { to: '/data-hub', label: 'Data Hub', icon: DatabaseZap, section: 'data-hub' as const },
  { to: '/planning', label: 'Planning', moduleName: 'Planning', icon: Gauge, section: 'operations' as const },
  { to: '/inventory', label: 'Inventory', moduleName: 'Inventory', icon: Boxes, section: 'operations' as const },
  { to: '/warehouse', label: 'Warehouse', moduleName: 'Warehouse', icon: Boxes, section: 'operations' as const },
  { to: '/production', label: 'Production', moduleName: 'Production', icon: Factory, section: 'operations' as const },
  { to: '/maintenance', label: 'Maintenance', moduleName: 'Maintenance', icon: Wrench, section: 'operations' as const },
  { to: '/quality', label: 'Quality', moduleName: 'Quality', icon: ShieldCheck, section: 'operations' as const },
  { to: '/procurement', label: 'Procurement', moduleName: 'Procurement', icon: ShoppingCart, section: 'operations' as const },
  { to: '/sales', label: 'Sales', moduleName: 'Sales & Distribution', icon: Truck, section: 'operations' as const },
  { to: '/costing', label: 'Costing', moduleName: 'Costing & Profitability', icon: Activity, section: 'operations' as const },
  { to: '/compliance', label: 'Compliance', moduleName: 'Compliance', icon: ShieldCheck, section: 'operations' as const },
  { to: '/customer-portal', label: 'Customer Portal', moduleName: 'Customer Portal', icon: BadgeCheck, section: 'operations' as const },
  { to: '/supplier-portal', label: 'Supplier Portal', moduleName: 'Supplier Portal', icon: Truck, section: 'operations' as const },
  { to: '/reports', label: 'Reports & Analytics', moduleName: 'Reports & Analytics', icon: FileText, section: 'operations' as const },
  { to: '/documents', label: 'Documents', moduleName: 'Document Management', icon: FileText, section: 'operations' as const },
];

const platformNavItems = [
  { to: '/platform', label: 'Platform', icon: LayoutDashboard },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
];

export function App() {
  const baseUrl = useMemo(() => apiConfig.baseUrl, []);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [passwordPromptSkippedFor, setPasswordPromptSkippedFor] = useState<string | null>(null);
  const session = useQuery({
    queryKey: ['runtime-session', sessionVersion],
    queryFn: backend.currentUser,
    retry: false,
  });

  if (session.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-[28px] border border-white/15 bg-white/8 px-6 py-4 text-sm text-slate-200 shadow-[0_24px_70px_rgba(15,23,42,0.2)] backdrop-blur-xl">
          Checking secure session...
        </div>
      </div>
    );
  }

  if (session.isError || !session.data) {
    return <LoginScreen onLogin={() => setSessionVersion((value) => value + 1)} baseUrl={baseUrl} />;
  }

  const user = session.data;
  const shouldShowPasswordPrompt = (user.force_password_change || user.password_expiry_warning) && passwordPromptSkippedFor !== user.id;
  if (shouldShowPasswordPrompt) {
    return (
      <PasswordChangeGate
        user={user}
        onChanged={() => {
          setPasswordPromptSkippedFor(null);
          setSessionVersion((value) => value + 1);
        }}
        onSkip={() => setPasswordPromptSkippedFor(user.id)}
      />
    );
  }
  return <PlatformProvider runtimeUser={user}><AuthenticatedApp user={user} onLogout={() => setSessionVersion((value) => value + 1)} /></PlatformProvider>;
}

function AuthenticatedApp({ user, onLogout }: { user: RuntimeUser; onLogout: () => void }) {
  const { state, selectedClientId, selectedClient, isPlatformContext, canSelectPlatform, selectClient, platformUser } = usePlatform();
  const allowedNavItems = isPlatformContext
    ? platformNavItems
    : navItems.filter((item) => {
        const moduleName = 'moduleName' in item ? item.moduleName : undefined;
        return canAccessSection(user, item.section)
          && (!moduleName || selectedClient?.enabledModules.includes(moduleName))
          && (!moduleName || platformUser.assignedModules.includes(moduleName));
      });

  return (
    <div className="app-shell min-h-screen bg-background text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-slate-950/70 backdrop-blur-xl xl:block">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">METAM</p>
            <p className="text-xs text-slate-400">Services</p>
          </div>
        </div>
        <div className="px-4 pt-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Signed in</p>
            <p className="mt-2 truncate text-sm font-semibold text-white">{platformUser.fullName}</p>
            <p className="mt-1 text-sm text-slate-300">{user.email}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
              <BadgeCheck className="h-3.5 w-3.5" />
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {allowedNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'border border-cyan-300/20 bg-cyan-400/10 text-white'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="xl:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button className="focus-ring rounded-xl border border-white/10 bg-white/8 p-2 text-slate-100 xl:hidden" aria-label="Open navigation">
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <select className="form-input max-w-[260px] py-1.5 text-sm" value={selectedClientId ?? 'platform'} onChange={(event) => { const value = event.target.value; selectClient(value === 'platform' ? null : value); }}>
                  {canSelectPlatform ? <option value="platform">Platform View</option> : null}
                  {state.clients.filter((client) => canSelectPlatform || client.clientId === platformUser.clientId).map((client) => <option key={client.clientId} value={client.clientId}>{client.clientName}</option>)}
                </select>
                <p className="hidden truncate text-xs text-slate-400 sm:block">{isPlatformContext ? 'Platform Context · USD' : `${selectedClient?.clientId} · ${selectedClient?.currency}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-slate-300 sm:flex">
                <Activity className="h-3.5 w-3.5 text-cyan-200" />
                {allowedNavItems.length} sections
              </div>
              <button
                className="focus-ring rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/12"
                onClick={() => {
                  backend.logout();
                  onLogout();
                }}
              >
                Sign out
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-2 xl:hidden">
            {allowedNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-w-max items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    isActive ? 'border border-cyan-300/20 bg-cyan-400/10 text-white' : 'text-slate-400'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Suspense fallback={<LoadingState label="Loading workspace view" />}>
            <Routes>
              <Route path="/" element={isPlatformContext ? <PlatformDashboardPage /> : <DashboardPage user={user} />} />
              <Route path="/platform" element={<PlatformOnly user={user}>{isPlatformContext ? <PlatformDashboardPage /> : <DashboardPage user={user} />}</PlatformOnly>} />
              <Route path="/platform/modules/:moduleName" element={<PlatformOnly user={user}><PlatformModulePage /></PlatformOnly>} />
              <Route path="/platform/widgets" element={<Navigate to="/platform?workspace=modules" replace />} />
              <Route path="/admin/clients" element={<Navigate to="/platform?workspace=clients" replace />} />
              <Route path="/admin/clients/create" element={<Navigate to="/platform?workspace=clients" replace />} />
              <Route path="/admin/clients/:clientId/edit" element={<Navigate to="/platform?workspace=clients" replace />} />
              <Route path="/admin/clients/:clientId/health" element={<Navigate to="/platform?workspace=clients" replace />} />
              <Route path="/admin/users" element={<Navigate to="/platform?workspace=users" replace />} />
              <Route path="/admin/users/create" element={<Navigate to="/platform?workspace=users" replace />} />
              <Route path="/dashboard/:focus" element={<DashboardPage user={user} />} />
              <Route path="/admin" element={<ProtectedRoute user={user} section="admin"><Navigate to="/admin/company" replace /></ProtectedRoute>} />
              <Route path="/admin/company" element={<ProtectedRoute user={user} section="admin"><AdminCenterPage section="company" user={user} /></ProtectedRoute>} />
              <Route path="/admin/roles" element={<ProtectedRoute user={user} section="admin"><AdminCenterPage section="roles" user={user} /></ProtectedRoute>} />
              <Route path="/admin/access" element={<ProtectedRoute user={user} section="admin"><AdminCenterPage section="access" user={user} /></ProtectedRoute>} />
              <Route path="/admin/modules" element={<ProtectedRoute user={user} section="admin"><AdminCenterPage section="modules" user={user} /></ProtectedRoute>} />
              <Route path="/admin/dashboards" element={<ProtectedRoute user={user} section="admin"><AdminCenterPage section="dashboards" user={user} /></ProtectedRoute>} />
              <Route path="/admin/data-scope" element={<ProtectedRoute user={user} section="admin"><AdminCenterPage section="data-scope" user={user} /></ProtectedRoute>} />
              <Route path="/admin/audit" element={<ProtectedRoute user={user} section="admin"><AdminCenterPage section="audit" user={user} /></ProtectedRoute>} />
              <Route path="/admin/business-impact" element={<ProtectedRoute user={user} section="admin"><AdminCenterPage section="business-impact" user={user} /></ProtectedRoute>} />
              <Route path="/admin/recommendations" element={<ProtectedRoute user={user} section="admin"><AdminCenterPage section="recommendations" user={user} /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute user={user} section="admin"><AdminCenterPage section="settings" user={user} /></ProtectedRoute>} />
              <Route path="/data-hub" element={<ProtectedRoute user={user} section="data-hub"><DataHubPage user={user} /></ProtectedRoute>} />
              <Route path="/operations" element={<ProtectedRoute user={user} section="operations"><OperationsPage user={user} /></ProtectedRoute>} />
              <Route path="/intelligence" element={<ProtectedRoute user={user} section="intelligence"><IntelligencePage /></ProtectedRoute>} />
              <Route path="/planning/*" element={<ProtectedRoute user={user} section="operations"><PlanningModulePage user={user} /></ProtectedRoute>} />
              <Route path="/inventory/*" element={<ProtectedRoute user={user} section="operations"><InventoryModulePage user={user} /></ProtectedRoute>} />
              <Route path="/warehouse/*" element={<ProtectedRoute user={user} section="operations"><WarehouseModulePage user={user} /></ProtectedRoute>} />
              <Route path="/production/*" element={<ProtectedRoute user={user} section="operations"><ProductionModulePage user={user} /></ProtectedRoute>} />
              <Route path="/maintenance/*" element={<ProtectedRoute user={user} section="operations"><MaintenanceModulePage user={user} /></ProtectedRoute>} />
              <Route path="/quality" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="quality" user={user} /></ProtectedRoute>} />
              <Route path="/procurement" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="procurement" user={user} /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="sales" user={user} /></ProtectedRoute>} />
              <Route path="/costing" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="costing" user={user} /></ProtectedRoute>} />
              <Route path="/compliance" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="compliance" user={user} /></ProtectedRoute>} />
              <Route path="/customer-portal" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="customer-portal" user={user} /></ProtectedRoute>} />
              <Route path="/supplier-portal" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="supplier-portal" user={user} /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute user={user} section="operations"><BusinessImpactDashboard /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="documents" user={user} /></ProtectedRoute>} />
              <Route path="/impact/:module/:metric" element={<ProtectedRoute user={user} section="operations"><ImpactDrilldownPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({
  user,
  section,
  children,
}: {
  user: RuntimeUser;
  section: 'admin' | 'data-hub' | 'operations' | 'intelligence';
  children: ReactNode;
}) {
  if (!canAccessSection(user, section)) {
    return (
      <AccessDeniedState
        title="This workspace is not enabled for your role"
        description={`Your ${user.role.replace('_', ' ')} account is active, but it does not include the ${section.replace('-', ' ')} workspace.`}
      />
    );
  }

  return children;
}

function PlatformOnly({ user, children }: { user: RuntimeUser; children: ReactNode }) {
  if (user.role !== 'super_admin') {
    return (
      <AccessDeniedState
        title="Platform administration is restricted"
        description="Only a Super Admin can access cross-client platform controls."
      />
    );
  }

  return children;
}

function LoginScreen({ onLogin, baseUrl }: { onLogin: () => void; baseUrl: string }) {
  const resetToken = new URLSearchParams(window.location.search).get('token');
  const isResetPath = window.location.pathname.includes('reset-password');
  const [email, setEmail] = useState('super@metam.local');
  const [password, setPassword] = useState('SuperAdmin123!');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  if (isResetPath && resetToken) {
    return <ResetPasswordScreen token={resetToken} onComplete={() => { window.history.replaceState({}, '', '/'); setForgotMode(false); }} />;
  }

  if (forgotMode) {
    return <ForgotPasswordScreen onBack={() => setForgotMode(false)} />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await backend.login(email, password);
      onLogin();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-[36px] border border-white/12 bg-white/8 p-7 shadow-[0_30px_90px_rgba(15,23,42,0.24)] backdrop-blur-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/15 text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.24)]">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Metam Services</h1>
            <p className="text-sm text-slate-300">Full-stack runtime: {baseUrl}</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-200">
            Email
            <input className="mt-1 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-sm outline-none placeholder:text-slate-500" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Password
            <input className="mt-1 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white shadow-sm outline-none placeholder:text-slate-500" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
          <button className="focus-ring w-full rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-4 py-3 text-sm font-semibold text-cyan-50 shadow-[0_0_30px_rgba(34,211,238,0.2)] disabled:opacity-60" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
          <button type="button" className="w-full text-center text-sm font-medium text-cyan-200 hover:text-cyan-100" onClick={() => setForgotMode(true)}>
            Forgot password?
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/8 p-4 text-xs text-slate-300">
          <p className="font-semibold uppercase tracking-[0.18em] text-slate-100">Seeded access</p>
          <p>Super admin: super@metam.local / SuperAdmin123!</p>
          <p>Admin: admin@metam.local / ChangeMe123!</p>
          <p>User: user@metam.local / User12345!</p>
        </div>
      </div>
    </div>
  );
}

function PasswordChangeGate({ user, onChanged, onSkip }: { user: RuntimeUser; onChanged: () => void; onSkip: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generated, setGenerated] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const criteria = loginPasswordCriteria(newPassword);
  const force = Boolean(user.force_password_change);

  async function generate() {
    try {
      const response = await backend.generatePassword();
      setNewPassword(response.password);
      setConfirmPassword(response.password);
      setGenerated(response.password);
    } catch {
      const fallback = generateBrowserPassword();
      setNewPassword(fallback);
      setConfirmPassword(fallback);
      setGenerated(fallback);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await backend.changePassword({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword });
      setMessage('Password updated successfully.');
      onChanged();
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Password update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-[36px] border border-white/12 bg-white/8 p-7 shadow-[0_30px_90px_rgba(15,23,42,0.24)] backdrop-blur-2xl">
        <h1 className="text-xl font-semibold text-white">{force ? 'Create a new password to continue' : 'Your password expires soon'}</h1>
        <p className="mt-2 text-sm text-slate-300">
          {force ? 'Your administrator requires a password change before entering the platform.' : `Your password expires in ${user.password_days_to_expiry ?? 'a few'} days. You can update it now or skip this reminder.`}
        </p>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <input className="form-input w-full" type="password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input className="form-input w-full" type="password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <button type="button" className="form-button-subtle" onClick={generate}>Auto Generate</button>
          </div>
          <input className="form-input w-full" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          {generated ? <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Generated password: <span className="font-mono font-semibold">{generated}</span></div> : null}
          <div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">{criteria.map((item) => <span key={item.label} className={item.met ? 'text-emerald-200' : 'text-slate-500'}>{item.met ? '[OK]' : '[ ]'} {item.label}</span>)}</div>
          {error ? <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
          {message ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
          <div className="flex flex-wrap justify-end gap-2">
            {!force ? <button type="button" className="form-button-subtle" onClick={onSkip}>Skip for now</button> : null}
            <button className="form-button-primary" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const response = await backend.forgotPassword(email);
      setResult(response.reset_link ? `Demo reset link: ${window.location.origin}${response.reset_link}` : 'If this email exists, a reset link will be sent.');
    } catch (forgotError) {
      setError(forgotError instanceof Error ? forgotError.message : 'Unable to request password reset');
    }
  }

  return (
    <AuthCard title="Forgot Password" subtitle="Enter your email. A secure reset link is sent to the registered mailbox.">
      <form className="space-y-4" onSubmit={submit}>
        <input className="form-input w-full" type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
        {result ? <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{result}</div> : null}
        {error ? <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
        <button className="form-button-primary w-full">Send Reset Link</button>
        <button type="button" className="form-button-subtle w-full" onClick={onBack}>Back to Sign In</button>
      </form>
    </AuthCard>
  );
}

function ResetPasswordScreen({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await backend.resetPassword({ token, new_password: newPassword, confirm_password: confirmPassword });
      setMessage('Password updated. Return to sign in with your new password.');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to reset password');
    }
  }

  return (
    <AuthCard title="Create New Password" subtitle="Use the reset link to create a protected password.">
      <form className="space-y-4" onSubmit={submit}>
        <input className="form-input w-full" type="password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        <input className="form-input w-full" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        <div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">{loginPasswordCriteria(newPassword).map((item) => <span key={item.label} className={item.met ? 'text-emerald-200' : 'text-slate-500'}>{item.met ? '[OK]' : '[ ]'} {item.label}</span>)}</div>
        {message ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
        <button className="form-button-primary w-full">Update Password</button>
        {message ? <button type="button" className="form-button-subtle w-full" onClick={onComplete}>Back to Sign In</button> : null}
      </form>
    </AuthCard>
  );
}

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-[36px] border border-white/12 bg-white/8 p-7 shadow-[0_30px_90px_rgba(15,23,42,0.24)] backdrop-blur-2xl">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function loginPasswordCriteria(password: string) {
  return [
    { label: 'At least 12 characters', met: password.length >= 12 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function generateBrowserPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%^&*';
  const all = upper + lower + numbers + special;
  const chars = [upper, lower, numbers, special].map((set) => set[Math.floor(Math.random() * set.length)]);
  while (chars.length < 16) chars.push(all[Math.floor(Math.random() * all.length)]);
  return chars.sort(() => Math.random() - 0.5).join('');
}
