import { FormEvent, Suspense, lazy, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Route, Routes } from 'react-router-dom';
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

const AdminPage = lazy(() => import('../pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const DataHubPage = lazy(() => import('../pages/DataHubPage').then((module) => ({ default: module.DataHubPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const IntelligencePage = lazy(() => import('../pages/IntelligencePage').then((module) => ({ default: module.IntelligencePage })));
const ModuleWorkspacePage = lazy(() => import('../pages/ModuleWorkspacePage').then((module) => ({ default: module.ModuleWorkspacePage })));
const OperationsPage = lazy(() => import('../pages/OperationsPage').then((module) => ({ default: module.OperationsPage })));

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'dashboard' as const },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, section: 'admin' as const },
  { to: '/data-hub', label: 'Data Hub', icon: DatabaseZap, section: 'data-hub' as const },
  { to: '/planning', label: 'Planning', icon: Gauge, section: 'operations' as const },
  { to: '/inventory', label: 'Inventory', icon: Boxes, section: 'operations' as const },
  { to: '/production', label: 'Production', icon: Factory, section: 'operations' as const },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, section: 'operations' as const },
  { to: '/quality', label: 'Quality', icon: ShieldCheck, section: 'operations' as const },
  { to: '/procurement', label: 'Procurement', icon: ShoppingCart, section: 'operations' as const },
  { to: '/sales', label: 'Sales', icon: Truck, section: 'operations' as const },
  { to: '/costing', label: 'Costing', icon: Activity, section: 'operations' as const },
  { to: '/compliance', label: 'Compliance', icon: ShieldCheck, section: 'operations' as const },
  { to: '/customer-portal', label: 'Customer Portal', icon: BadgeCheck, section: 'operations' as const },
  { to: '/supplier-portal', label: 'Supplier Portal', icon: Truck, section: 'operations' as const },
  { to: '/reports', label: 'Reports', icon: FileText, section: 'operations' as const },
  { to: '/documents', label: 'Documents', icon: FileText, section: 'operations' as const },
];

export function App() {
  const baseUrl = useMemo(() => apiConfig.baseUrl, []);
  const [sessionVersion, setSessionVersion] = useState(0);
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
  const allowedNavItems = navItems.filter((item) => canAccessSection(user, item.section));

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
            <p className="mt-2 truncate text-sm font-semibold text-white">{user.name}</p>
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
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">Metam Services</p>
                <p className="hidden text-xs text-slate-400 sm:block">Backend: {baseUrl}</p>
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
                  setSessionVersion((value) => value + 1);
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
              <Route path="/" element={<DashboardPage user={user} />} />
              <Route path="/dashboard/:focus" element={<DashboardPage user={user} />} />
              <Route path="/admin" element={<ProtectedRoute user={user} section="admin"><AdminPage user={user} /></ProtectedRoute>} />
              <Route path="/data-hub" element={<ProtectedRoute user={user} section="data-hub"><DataHubPage user={user} /></ProtectedRoute>} />
              <Route path="/operations" element={<ProtectedRoute user={user} section="operations"><OperationsPage user={user} /></ProtectedRoute>} />
              <Route path="/intelligence" element={<ProtectedRoute user={user} section="intelligence"><IntelligencePage /></ProtectedRoute>} />
              <Route path="/planning" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="planning" user={user} /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="inventory" user={user} /></ProtectedRoute>} />
              <Route path="/production" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="production" user={user} /></ProtectedRoute>} />
              <Route path="/maintenance" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="maintenance" user={user} /></ProtectedRoute>} />
              <Route path="/quality" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="quality" user={user} /></ProtectedRoute>} />
              <Route path="/procurement" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="procurement" user={user} /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="sales" user={user} /></ProtectedRoute>} />
              <Route path="/costing" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="costing" user={user} /></ProtectedRoute>} />
              <Route path="/compliance" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="compliance" user={user} /></ProtectedRoute>} />
              <Route path="/customer-portal" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="customer-portal" user={user} /></ProtectedRoute>} />
              <Route path="/supplier-portal" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="supplier-portal" user={user} /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="reports" user={user} /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute user={user} section="operations"><ModuleWorkspacePage moduleKey="documents" user={user} /></ProtectedRoute>} />
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

function LoginScreen({ onLogin, baseUrl }: { onLogin: () => void; baseUrl: string }) {
  const [email, setEmail] = useState('super@mop.local');
  const [password, setPassword] = useState('SuperAdmin123!');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        </form>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/8 p-4 text-xs text-slate-300">
          <p className="font-semibold uppercase tracking-[0.18em] text-slate-100">Seeded access</p>
          <p>Super admin: super@mop.local / SuperAdmin123!</p>
          <p>Admin: admin@mop.local / ChangeMe123!</p>
          <p>User: user@mop.local / User12345!</p>
        </div>
      </div>
    </div>
  );
}
