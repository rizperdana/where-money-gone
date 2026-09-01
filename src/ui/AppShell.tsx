import { NavLink, Outlet } from 'react-router-dom';
import { FaChartPie, FaGear, FaList } from 'react-icons/fa6';
import type { IconType } from 'react-icons';

const TABS: { to: string; label: string; Icon: IconType }[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: FaChartPie },
  { to: '/receipts', label: 'Receipts', Icon: FaList },
  { to: '/settings', label: 'Settings', Icon: FaGear },
];

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 bg-background text-foreground">
      <header className="hidden md:block border-b px-4 py-3 flex justify-between items-center">
        <div className="text-sm font-medium">Where Money Gone</div>
        <nav className="flex gap-4 text-sm">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 ${
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <t.Icon /> {t.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 px-4">
        <Outlet />
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex justify-around py-2 text-xs">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${
                isActive
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              }`
            }
          >
            <t.Icon size={20} />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
