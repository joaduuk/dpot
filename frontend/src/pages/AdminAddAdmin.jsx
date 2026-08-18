import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createAdmin } from '../api/admin'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import PasswordInput from '../components/PasswordInput'

export default function AdminAddAdmin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    role: 'admin',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createAdmin(form)
      navigate('/admin', { replace: true, state: { tab: 'admins' } })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Link to="/admin" className="text-sm text-muted hover:text-ink">&larr; Admin</Link>
      <h1 className="mt-3 text-3xl font-semibold">Add an admin</h1>
      <p className="mt-1 text-muted">Create a new admin or super admin account directly.</p>

      <form onSubmit={handleSubmit} className="card mt-6 flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="full_name">Full name</label>
          <input
            id="full_name"
            required
            className="field-input"
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
          />
        </div>

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
          <label className="field-label" htmlFor="email">Email (optional)</label>
          <input
            id="email"
            type="email"
            className="field-input"
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
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="role">Role</label>
          <select
            id="role"
            className="field-input"
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
          </select>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
          {loading ? <Spinner className="border-paper/30 border-t-paper" /> : 'Create account'}
        </button>
      </form>
    </div>
  )
}
