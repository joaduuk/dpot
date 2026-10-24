import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <header className="border-b border-ink/10 bg-paper/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-semibold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-ink">●</span>
            DailyPot
          </Link>

          {isAuthenticated ? (
            <>
              {/* Phones: the main links live in the bottom tab bar, so the
                  header only keeps logging out. */}
              <button onClick={handleLogout} className="text-sm text-ink/50 hover:text-clay transition-colors md:hidden">
                Log out
              </button>

              <nav className="hidden items-center gap-5 text-sm md:flex">
                {/* Saving is available to anyone, regardless of role — an
                    agent or admin can also be a saver with their own pots. */}
                <Link to="/pots" className="text-ink/70 hover:text-ink transition-colors">My pots</Link>
                <Link to="/wallet" className="text-ink/70 hover:text-ink transition-colors">Wallet</Link>

                {user?.role === 'agent' && (
                  <Link to="/agent" className="text-ink/70 hover:text-ink transition-colors">Agent dashboard</Link>
                )}
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Link to="/admin" className="text-ink/70 hover:text-ink transition-colors">Admin</Link>
                )}
                {user?.role === 'saver' && (
                  <Link to="/agent/apply" className="text-ink/70 hover:text-ink transition-colors">Become an agent</Link>
                )}

                <Link to="/pots/new" className="btn-gold">New pot</Link>

                <div className="flex items-center gap-3 pl-3 border-l border-ink/10">
                  <Link to="/profile" className="text-ink/70 hover:text-ink transition-colors" title="Profile">
                    <span className="lg:hidden">Profile</span>
                    <span className="hidden lg:inline">{user?.full_name}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-ink/50 hover:text-clay transition-colors">
                    Log out
                  </button>
                </div>
              </nav>
            </>
          ) : (
            <nav className="flex items-center gap-2 text-sm sm:gap-3">
              <Link to="/login" className="btn-outline">Log in</Link>
              <Link to="/register" className="btn-primary">Get started</Link>
            </nav>
          )}
        </div>
      </header>

      {isAuthenticated && <MobileTabBar role={user?.role} />}
    </>
  )
}

// Bottom tab bar for phones — the same links as the desktop row, laid out
// like a native app. App.jsx pads <main> so content never hides behind it.
function MobileTabBar({ role }) {
  const { pathname } = useLocation()
  // "My pots" covers the list and every pot's page, but not /pots/new,
  // which has its own tab.
  const onPots = pathname.startsWith('/pots') && pathname !== '/pots/new'

  let roleTab = null
  if (role === 'agent') roleTab = { to: '/agent', label: 'Agent', icon: <IconBriefcase /> }
  else if (role === 'admin' || role === 'super_admin') roleTab = { to: '/admin', label: 'Admin', icon: <IconShield /> }
  else if (role === 'saver') roleTab = { to: '/agent/apply', label: 'Be an agent', icon: <IconBriefcase /> }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        <Tab to="/pots" label="My pots" icon={<IconPot />} active={onPots} />
        <Tab to="/wallet" label="Wallet" icon={<IconWallet />} />

        <NavLink to="/pots/new" end className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5" aria-label="New pot">
          {({ isActive }) => (
            <>
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-ink shadow-card transition-colors
                  ${isActive ? 'bg-gold-soft' : 'bg-gold'}`}
              >
                +
              </span>
              <span className="text-[11px] font-medium text-ink/70">New pot</span>
            </>
          )}
        </NavLink>

        {roleTab && <Tab to={roleTab.to} label={roleTab.label} icon={roleTab.icon} />}
        <Tab to="/profile" label="Profile" icon={<IconUser />} />
      </div>
    </nav>
  )
}

function Tab({ to, label, icon, active }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors
        ${(active ?? isActive) ? 'text-teal' : 'text-ink/50 hover:text-ink'}`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function IconPot() {
  return (
    <svg {...iconProps}>
      <path d="M5 9h14l-1.2 9.1A2 2 0 0 1 15.8 20H8.2a2 2 0 0 1-2-1.9L5 9Z" />
      <path d="M4 9h16M9 5.5h6" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M16 14.5h1.5" />
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 13h18" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg {...iconProps}>
      <path d="M12 3 5 6v5.5c0 4.2 3 7.6 7 9.5 4-1.9 7-5.3 7-9.5V6l-7-3Z" />
    </svg>
  )
}
