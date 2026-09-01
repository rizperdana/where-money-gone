import { NavLink, Outlet } from 'react-router-dom';
import {
  FaChartPie,
  FaGear,
  FaList,
  FaStar,
  FaChevronRight,
} from 'react-icons/fa6';
import type { IconType } from 'react-icons';

const TABS: { to: string; label: string; Icon: IconType }[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: FaChartPie },
  { to: '/receipts', label: 'Receipts', Icon: FaList },
  { to: '/roadmap', label: 'Roadmap', Icon: FaStar },
  { to: '/settings', label: 'Settings', Icon: FaGear },
];

// ponytail: top nav (>=768px) + bottom tab (<768px); NavLink drives active state.
export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <header className="hidden md:block wmg-panel wmg-scanlines mb-4 px-4 py-2 flex justify-between items-center relative">
        <div className="wmg-pixel text-sm relative z-10 flex items-center gap-2">
          WMG v2.2 <FaChevronRight />
        </div>
        <nav className="flex gap-3 text-sm">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 ${isActive ? 'wmg-pixel' : 'opacity-70 hover:opacity-100'}`
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 wmg-panel wmg-scanlines flex justify-around py-2 text-xs relative z-10">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${isActive ? 'wmg-pixel' : 'opacity-70'}`
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
