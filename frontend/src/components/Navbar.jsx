import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="border-b border-ink/10 bg-paper/90 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-ink">●</span>
          DailyPot
        </Link>

        {isAuthenticated ? (
          <nav className="flex items-center gap-5 text-sm">
            <Link to="/pots" className="text-ink/70 hover:text-ink transition-colors">My pots</Link>
            <Link to="/wallet" className="text-ink/70 hover:text-ink transition-colors">Wallet</Link>
            <Link to="/pots/new" className="btn-gold">New pot</Link>
            <div className="flex items-center gap-3 pl-3 border-l border-ink/10">
              <span className="hidden sm:block text-ink/60">{user?.full_name}</span>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="text-ink/50 hover:text-clay transition-colors"
              >
                Log out
              </button>
            </div>
          </nav>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/login" className="btn-outline">Log in</Link>
            <Link to="/register" className="btn-primary">Get started</Link>
          </nav>
        )}
      </div>
    </header>
  )
}
