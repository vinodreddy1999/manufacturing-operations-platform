import type { ElementType } from 'react';
import { NavLink } from 'react-router-dom';

type ModuleNavigationItem = {
  label: string;
  path: string;
  icon: ElementType<{ className?: string }>;
};

export function ModuleNavigationTabs({ items, dashboardPath }: { items: ModuleNavigationItem[]; dashboardPath: string }) {
  return (
    <nav
      className="sticky top-16 z-10 -mx-4 border-b border-white/10 bg-slate-950/70 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6"
      aria-label="Module sections"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,0.45)_rgba(255,255,255,0.04)]">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === dashboardPath}
            className={({ isActive }) =>
              `flex min-w-max items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-cyan-300/25 bg-cyan-400/12 text-white shadow-[0_0_18px_rgba(34,211,238,0.10)]'
                  : 'border-white/10 bg-white/[0.035] text-slate-400 hover:border-cyan-300/20 hover:bg-white/[0.07] hover:text-white'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
