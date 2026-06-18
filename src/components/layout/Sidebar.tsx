import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  KanbanSquare,
  BarChart3,
  LayoutTemplate,
  Users,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../lib/auth'

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/contacts', label: 'Contacts', icon: Users },
]

function Sidebar() {
  const { session, signOut } = useAuth()
  const email = session?.user?.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-[var(--shadow-primary)]">
          <KanbanSquare size={19} strokeWidth={2.25} />
        </div>
        <span className="font-display text-[15px] font-bold tracking-tight text-ink">
          Murtaza's CRM
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-on-primary shadow-[var(--shadow-primary)]'
                  : 'text-secondary hover:bg-surface-2 hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={
                    isActive
                      ? 'text-on-primary'
                      : 'text-muted transition-colors group-hover:text-ink'
                  }
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User / sign out */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-[10px] px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-active">
            {initials}
          </div>
          <span className="min-w-0 flex-1 truncate text-xs text-secondary" title={email}>
            {email}
          </span>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
