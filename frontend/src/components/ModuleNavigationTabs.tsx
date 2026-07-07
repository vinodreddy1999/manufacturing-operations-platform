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
      className="sticky top-16 z-10 -mx-4 border-y border-white/10 bg-slate-950/78 px-4 py-2 shadow-[0_18px_50px_rgba(2,6,23,0.22)] backdrop-blur-xl sm:-mx-6 sm:px-6 2xl:-mx-8 2xl:px-8"
      aria-label="Module sections"
    >
      <div className="flex w-full gap-2 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.025] p-1.5 [scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,0.45)_rgba(255,255,255,0.04)]">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === dashboardPath}
            className={({ isActive }) =>
              `flex min-w-max items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'border-cyan-300/30 bg-cyan-400/14 text-white shadow-[0_0_22px_rgba(34,211,238,0.14)]'
                  : 'border-white/10 bg-white/[0.035] text-slate-400 hover:border-cyan-300/20 hover:bg-white/[0.075] hover:text-white'
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
