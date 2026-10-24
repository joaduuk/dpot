import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LEGAL_PAGES, SUPPORT_EMAIL } from '../pages/legal/LegalLayout'

export default function Footer() {
  const { isAuthenticated } = useAuth()

  return (
    // Logged in on a phone, the fixed tab bar (see Navbar) sits at the
    // bottom of the screen, so leave room for it under the footer.
    <footer className={`border-t border-ink/10 bg-paper-dim/60 ${isAuthenticated ? 'pb-24 md:pb-0' : ''}`}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs text-ink">●</span>
            DailyPot
          </Link>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Save a little every day. DailyPot is not a bank.
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:flex sm:flex-wrap sm:gap-x-5">
          {LEGAL_PAGES.map((p) => (
            <Link key={p.to} to={p.to} className="text-ink/70 hover:text-ink transition-colors">{p.label}</Link>
          ))}
          <Link to="/contact" className="text-ink/70 hover:text-ink transition-colors">Contact us</Link>
        </nav>
      </div>

      <div className="mx-auto max-w-5xl border-t border-ink/5 px-4 py-4 text-xs text-muted sm:px-6">
        © {new Date().getFullYear()} DailyPot · <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-ink">{SUPPORT_EMAIL}</a>
      </div>
    </footer>
  )
}
