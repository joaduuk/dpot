import { useState } from 'react'
import { sendContactMessage } from '../api/contact'
import { extractErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import { SUPPORT_EMAIL } from './legal/LegalLayout'

export default function Contact() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    subject: '',
    message: '',
    website: '', // honeypot — hidden from people, bots fill it in
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendContactMessage({ ...form, email: form.email.trim() })
      setSent(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold">Contact us</h1>
      <p className="mt-1 text-muted">
        Questions about your pot, a payment or a payout? Send us a message, or email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-teal hover:underline">{SUPPORT_EMAIL}</a>.
      </p>

      {sent ? (
        <div className="card mt-8" role="status">
          <p className="font-semibold">Thanks — your message has been sent.</p>
          <p className="mt-1 text-sm text-muted">
            We'll reply to <strong>{form.email}</strong> as soon as we can.
          </p>
          <button
            type="button"
            className="btn-outline mt-4"
            onClick={() => {
              setForm((prev) => ({ ...prev, subject: '', message: '' }))
              setSent(false)
            }}
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card mt-8 flex flex-col gap-4">
          <div>
            <label className="field-label" htmlFor="name">Name</label>
            <input
              id="name"
              required
              maxLength={100}
              autoComplete="name"
              className="field-input"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="field-input"
              placeholder="ama@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="subject">Subject</label>
            <input
              id="subject"
              required
              maxLength={150}
              className="field-input"
              value={form.subject}
              onChange={(e) => update('subject', e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="message">Message</label>
            <textarea
              id="message"
              required
              minLength={10}
              maxLength={5000}
              rows={6}
              className="field-input resize-y"
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
            />
          </div>

          {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
            {loading ? <Spinner className="border-paper/30 border-t-paper" /> : 'Send message'}
          </button>
        </form>
      )}
    </div>
  )
}
