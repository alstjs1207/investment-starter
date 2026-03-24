import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: '홈' },
  { to: '/watchlist', label: '워치리스트' },
  { to: '/settings', label: '설정' },
  { to: '/rebalance', label: '리밸런싱' },
  { to: '/returns', label: '수익률' },
  { to: '/directory', label: '종목사전' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-sm text-white">P</span>
            Portfolio
          </NavLink>
          <div className="flex gap-1 sm:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}
