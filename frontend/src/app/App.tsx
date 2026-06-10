import { useMemo } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import {
  Activity,
  Boxes,
  BrainCircuit,
  DatabaseZap,
  Factory,
  LayoutDashboard,
  Menu,
  ShieldCheck,
} from 'lucide-react';

import { apiConfig } from '../services/api';
import { AdminPage } from '../pages/AdminPage';
import { DataHubPage } from '../pages/DataHubPage';
import { DashboardPage } from '../pages/DashboardPage';
import { IntelligencePage } from '../pages/IntelligencePage';
import { OperationsPage } from '../pages/OperationsPage';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
  { to: '/data-hub', label: 'Data Hub', icon: DatabaseZap },
  { to: '/operations', label: 'Operations', icon: Factory },
  { to: '/intelligence', label: 'AI Command', icon: BrainCircuit },
];

export function App() {
  const baseUrl = useMemo(() => apiConfig.baseUrl, []);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">MOP</p>
            <p className="text-xs text-muted-foreground">Operations Platform</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-primary' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button className="focus-ring rounded-md border border-border p-2 lg:hidden" aria-label="Open navigation">
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-sm font-semibold text-foreground">Manufacturing Operations Platform</p>
                <p className="text-xs text-muted-foreground">Backend source of truth: {baseUrl}</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs text-slate-600 sm:flex">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Live API mode
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm ${
                    isActive ? 'bg-blue-50 text-primary' : 'text-slate-700'
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
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/data-hub" element={<DataHubPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/intelligence" element={<IntelligencePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
