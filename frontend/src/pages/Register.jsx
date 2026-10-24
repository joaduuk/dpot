import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import PasswordInput from '../components/PasswordInput'

const COUNTRIES = [
  { code: 'GH', label: 'Ghana' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'KE', label: 'Kenya' },
  { code: 'ZA', label: 'South Africa' },
]

export default function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    country: 'GH',
    role: 'saver',
  })
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await register(form)
      navigate('/pots', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-3xl font-semibold">Start your pot</h1>
      <p className="mt-1 text-muted">Small daily savings, one bead at a time.</p>

      <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="full_name">Full name</label>
          <input
            id="full_name"
            required
            className="field-input"
            placeholder="Ama Owusu"
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              required
              className="field-input"
              placeholder="024 123 4567"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="country">Country</label>
            <select
              id="country"
              className="field-input"
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            className="field-input"
            placeholder="ama@example.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
          {loading ? <Spinner className="border-paper/30 border-t-paper" /> : 'Create account'}
        </button>

        <p className="text-center text-xs text-muted">
          By creating an account you agree to our{' '}
          <Link to="/terms" className="text-teal hover:underline">Terms of Use</Link> and{' '}
          <Link to="/privacy" className="text-teal hover:underline">Privacy Policy</Link>.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already saving with us?{' '}
        <Link to="/login" className="font-semibold text-teal hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
