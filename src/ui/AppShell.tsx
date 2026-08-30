import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/dashboard', label: 'Dashboard', icon: '◐' },
  { to: '/receipts', label: 'Receipts', icon: '☰' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

// ponytail: top nav (>=768px) + bottom tab (<768px); NavLink drives active state.
export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <header className="hidden md:block wmg-panel mb-4 px-4 py-2 flex justify-between items-center">
        <div className="wmg-pixel text-sm">C:\RECEIPTS\&gt;</div>
        <nav className="flex gap-3 text-sm">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) => (isActive ? 'wmg-pixel' : 'opacity-70 hover:opacity-100')}
            >
              [{t.icon} {t.label}]
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 px-4">
        <Outlet />
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 wmg-panel flex justify-around py-2 text-xs">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => (isActive ? 'wmg-pixel' : 'opacity-70')}
          >
            {t.icon}
            <br />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
