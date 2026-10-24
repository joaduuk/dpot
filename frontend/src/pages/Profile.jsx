import { useEffect, useState } from 'react'
import { getMe, updateMe, changePassword } from '../api/auth'
import { getMyAgentProfile } from '../api/agents'
import { extractErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import StatusPill from '../components/StatusPill'
import PasswordInput from '../components/PasswordInput'

const ROLE_LABELS = {
  saver: 'Saver',
  agent: 'Agent',
  admin: 'Admin',
  super_admin: 'Super admin',
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [agent, setAgent] = useState(null)
  const [loaded, setLoaded] = useState(false)

  // Refresh from the server before showing the forms, so they never start
  // from a stale stored copy. Falls back to the stored user if this fails.
  useEffect(() => {
    getMe()
      .then(updateUser)
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [updateUser])

  useEffect(() => {
    if (user?.role !== 'agent') return
    getMyAgentProfile().then(setAgent).catch(() => {})
  }, [user?.role])

  if (!user || !loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Profile</h1>
      <p className="mt-1 text-muted">Your account details.</p>

      <div className="card mt-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Email" value={user.email || '—'} />
          <Detail label="Role" value={ROLE_LABELS[user.role] || user.role} />
          {agent && (
            <>
              <Detail label="Agent code" value={<span className="font-mono">{agent.agent_code || '—'}</span>} />
              <Detail label="Agent status" value={<StatusPill status={agent.status} />} />
            </>
          )}
          {user.created_at && (
            <Detail label="Member since" value={new Date(user.created_at).toLocaleDateString()} />
          )}
        </dl>
        <p className="mt-4 text-xs text-muted">Your email can't be changed here yet.</p>
      </div>

      <DetailsForm user={user} onSaved={updateUser} />
      <PasswordForm />
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words text-ink">{value}</dd>
    </div>
  )
}

function DetailsForm({ user, onSaved }) {
  const [fullName, setFullName] = useState(user.full_name)
  const [phone, setPhone] = useState(user.phone)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const dirty = fullName.trim() !== user.full_name || phone.trim() !== user.phone

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      const updated = await updateMe({ full_name: fullName.trim(), phone: phone.trim() })
      onSaved(updated)
      setFullName(updated.full_name)
      setPhone(updated.phone)
      setSaved(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-6 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Your details</h2>

      <div>
        <label className="field-label" htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          className="field-input"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setSaved(false) }}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="phone">Phone</label>
        <input
          id="phone"
          type="tel"
          className="field-input"
          required
          autoComplete="tel"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setSaved(false) }}
        />
        <p className="mt-1 text-xs text-muted">You can log in with this number, and agents use it to find you.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      )}
      {saved && (
        <p role="status" className="rounded-lg bg-teal-pale px-3 py-2 text-sm text-teal">Details saved.</p>
      )}

      <button type="submit" disabled={saving || !dirty} className="btn-primary self-start disabled:opacity-50">
        {saving ? <Spinner className="border-paper/30 border-t-paper" /> : 'Save changes'}
      </button>
    </form>
  )
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match")
      return
    }

    setSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSaved(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-6 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Change password</h2>

      <div>
        <label className="field-label" htmlFor="current_password">Current password</label>
        <PasswordInput
          id="current_password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="new_password">New password</label>
        <PasswordInput
          id="new_password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="confirm_password">Confirm new password</label>
        <PasswordInput
          id="confirm_password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      )}
      {saved && (
        <p role="status" className="rounded-lg bg-teal-pale px-3 py-2 text-sm text-teal">Password changed.</p>
      )}

      <button type="submit" disabled={saving} className="btn-primary self-start">
        {saving ? <Spinner className="border-paper/30 border-t-paper" /> : 'Change password'}
      </button>
    </form>
  )
}
