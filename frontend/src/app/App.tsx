import { FormEvent, Suspense, lazy, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Route, Routes } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  Boxes,
  BrainCircuit,
  DatabaseZap,
  Factory,
  LayoutDashboard,
  Menu,
  ShieldCheck,
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
const OperationsPage = lazy(() => import('../pages/OperationsPage').then((module) => ({ default: module.OperationsPage })));

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'dashboard' as const },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, section: 'admin' as const },
  { to: '/data-hub', label: 'Data Hub', icon: DatabaseZap, section: 'data-hub' as const },
  { to: '/operations', label: 'Operations', icon: Factory, section: 'operations' as const },
  { to: '/intelligence', label: 'AI Command', icon: BrainCircuit, section: 'intelligence' as const },
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-slate-950/45 backdrop-blur-2xl xl:block">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/15 text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">MOP</p>
            <p className="text-sm text-slate-300">Enterprise operations cockpit</p>
          </div>
        </div>
        <div className="px-6 pt-6">
          <div className="rounded-[28px] border border-white/10 bg-white/8 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Signed in as</p>
            <p className="mt-2 text-lg font-semibold text-white">{user.name}</p>
            <p className="mt-1 text-sm text-slate-300">{user.email}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
              <BadgeCheck className="h-3.5 w-3.5" />
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>
        <nav className="space-y-2 p-4">
          {allowedNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'border border-white/10 bg-white/12 text-white shadow-[0_0_28px_rgba(34,211,238,0.15)]'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/35 backdrop-blur-2xl">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button className="focus-ring rounded-2xl border border-white/10 bg-white/8 p-2.5 text-slate-100 xl:hidden" aria-label="Open navigation">
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Release control</p>
                <p className="text-xl font-semibold tracking-tight text-white">Manufacturing Operations Platform</p>
                <p className="text-sm text-slate-300">Live backend source: {baseUrl}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-slate-200 sm:flex">
                <Activity className="h-3.5 w-3.5 text-cyan-200" />
                {allowedNavItems.length} sections available
              </div>
              <button
                className="focus-ring rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100 hover:bg-white/12"
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
                  `flex min-w-max items-center gap-2 rounded-2xl px-3 py-2 text-sm ${
                    isActive ? 'border border-white/10 bg-white/12 text-white' : 'text-slate-300'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Suspense fallback={<LoadingState label="Loading workspace view" />}>
            <Routes>
              <Route path="/" element={<DashboardPage user={user} />} />
              <Route path="/dashboard/:focus" element={<DashboardPage user={user} />} />
              <Route path="/admin" element={<ProtectedRoute user={user} section="admin"><AdminPage user={user} /></ProtectedRoute>} />
              <Route path="/data-hub" element={<ProtectedRoute user={user} section="data-hub"><DataHubPage user={user} /></ProtectedRoute>} />
              <Route path="/operations" element={<ProtectedRoute user={user} section="operations"><OperationsPage user={user} /></ProtectedRoute>} />
              <Route path="/intelligence" element={<ProtectedRoute user={user} section="intelligence"><IntelligencePage /></ProtectedRoute>} />
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
            <h1 className="text-xl font-semibold tracking-tight text-white">Manufacturing Operations Platform</h1>
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
