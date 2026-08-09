import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-2xl">●</span>
      <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
        Save a little every day.<br />Watch the pot fill up.
      </h1>
      <p className="mt-4 max-w-lg text-lg text-muted">
        DailyPot turns saving into 30 small, manageable beads instead of one big number —
        with a buffer for the days you're short, and a payout when the pot is full.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to={isAuthenticated ? '/pots' : '/register'} className="btn-primary">
          {isAuthenticated ? 'Go to my pots' : 'Start saving'}
        </Link>
        {!isAuthenticated && (
          <Link to="/login" className="btn-outline">Log in</Link>
        )}
      </div>
    </div>
  )
}
