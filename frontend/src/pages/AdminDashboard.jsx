import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  listPendingAgents, approveAgent, rejectAgent,
  listPendingPayments, confirmPayment, disputePayment,
  listPendingPayouts, completePayout,
  listSavers,
  listAdmins, suspendAdmin, activateAdmin, deleteAdmin,
  listAllAgents, suspendAgentFull, deleteAgent,
} from '../api/admin'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import StatusPill from '../components/StatusPill'
import Money from '../components/Money'

export default function AdminDashboard() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const TABS = [
    { key: 'agents', label: 'Agents' },
    { key: 'payments', label: 'Payments' },
    { key: 'payouts', label: 'Payouts' },
    { key: 'savers', label: 'Savers' },
    ...(isSuperAdmin ? [
      { key: 'admins', label: 'Admins' },
      { key: 'manageAgents', label: 'Manage agents' },
    ] : []),
  ]

  const [tab, setTab] = useState('agents')
  const [agents, setAgents] = useState(null)
  const [payments, setPayments] = useState(null)
  const [payouts, setPayouts] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function loadQueues() {
    setError('')
    Promise.all([listPendingAgents(), listPendingPayments(), listPendingPayouts()])
      .then(([a, p, o]) => {
        setAgents(a)
        setPayments(p)
        setPayouts(o)
      })
      .catch((err) => setError(extractErrorMessage(err)))
  }

  useEffect(() => {
    loadQueues()
  }, [])

  async function runAction(id, action) {
    setBusyId(id)
    setError('')
    try {
      await action()
      loadQueues()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const loading = !agents || !payments || !payouts

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Admin</h1>
      <p className="mt-1 text-muted">Approve agents, confirm payments, complete payouts, and manage accounts.</p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-ink/10">
        {TABS.map((t) => {
          const count = { agents: agents?.length, payments: payments?.length, payouts: payouts?.length }[t.key]
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
              {!!count && <span className="ml-1.5 text-xs text-gold-deep">({count})</span>}
              {tab === t.key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />}
            </button>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
          {error}
        </p>
      )}

      {tab === 'agents' && (
        loading ? <Loading /> : (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex justify-end">
              <Link to="/admin/agents/register" className="btn-gold">Register an agent</Link>
            </div>
            {agents.length === 0 && <EmptyRow text="No pending agent applications." />}
            {agents.map((a) => (
              <div key={a.id} className="card flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{a.market_name}</p>
                  <p className="text-sm text-muted">{a.location}, {a.city} &middot; {a.agent_code}</p>
                  <p className="mt-1 text-sm">{a.applicant_name} &middot; {a.applicant_phone}</p>
                  {a.mobile_money_number && (
                    <p className="text-sm text-muted">{a.mobile_money_provider}: {a.mobile_money_number}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button disabled={busyId === a.id} onClick={() => runAction(a.id, () => rejectAgent(a.id))} className="btn-outline px-3 py-1.5 text-xs">
                    Reject
                  </button>
                  <button disabled={busyId === a.id} onClick={() => runAction(a.id, () => approveAgent(a.id))} className="btn-primary px-3 py-1.5 text-xs">
                    {busyId === a.id ? <Spinner className="h-4 w-4 border-paper/30 border-t-paper" /> : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'payments' && (
        loading ? <Loading /> : (
          <div className="mt-6 flex flex-col gap-4">
            {payments.length === 0 && <EmptyRow text="No pending payments." />}
            {payments.map((p) => (
              <div key={p.id} className="card flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{p.saver_name} &middot; {p.pot_name}</p>
                  <p className="text-sm text-muted">
                    {p.days_covered} day{p.days_covered !== 1 ? 's' : ''} &middot; {p.method}
                    {p.agent_market_name && <> &middot; via {p.agent_market_name}</>}
                  </p>
                  {p.reference && <p className="text-sm text-muted">Ref: {p.reference}</p>}
                  <p className="mt-1"><Money amount={p.amount} className="font-semibold" /></p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button disabled={busyId === p.id} onClick={() => runAction(p.id, () => disputePayment(p.id))} className="btn-outline px-3 py-1.5 text-xs">
                    Dispute
                  </button>
                  <button disabled={busyId === p.id} onClick={() => runAction(p.id, () => confirmPayment(p.id))} className="btn-primary px-3 py-1.5 text-xs">
                    {busyId === p.id ? <Spinner className="h-4 w-4 border-paper/30 border-t-paper" /> : 'Confirm'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'payouts' && (
        loading ? <Loading /> : (
          <div className="mt-6 flex flex-col gap-4">
            {payouts.length === 0 && <EmptyRow text="No pending payouts." />}
            {payouts.map((p) => (
              <div key={p.id} className="card flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{p.saver_name} &middot; {p.pot_name}</p>
                  <p className="text-sm text-muted">
                    {p.days_paid} days &middot; {p.method}
                    {p.requested_payout_date && <> &middot; for {new Date(p.requested_payout_date).toLocaleDateString()}</>}
                  </p>
                  <p className="mt-1 text-sm">
                    Gross <Money amount={p.gross_amount} /> &minus; fee <Money amount={p.platform_fee} />
                    {p.agent_commission > 0 && <> &minus; commission <Money amount={p.agent_commission} /></>}
                    {' '}= <Money amount={p.net_payout} className="font-semibold" />
                  </p>
                </div>
                <button disabled={busyId === p.id} onClick={() => runAction(p.id, () => completePayout(p.pot_id))} className="btn-primary shrink-0 px-3 py-1.5 text-xs">
                  {busyId === p.id ? <Spinner className="h-4 w-4 border-paper/30 border-t-paper" /> : 'Mark paid'}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'savers' && <SaversTab />}
      {tab === 'admins' && isSuperAdmin && <AdminsTab />}
      {tab === 'manageAgents' && isSuperAdmin && <ManageAgentsTab />}
    </div>
  )
}

function Loading() {
  return (
    <div className="mt-16 flex justify-center">
      <Spinner />
    </div>
  )
}

function EmptyRow({ text }) {
  return <p className="card py-8 text-center text-sm text-muted">{text}</p>
}

// ── Savers tab ───────────────────────────────────────────────────────────

function SaversTab() {
  const [query, setQuery] = useState('')
  const [savers, setSavers] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function runSearch(e) {
    e?.preventDefault()
    setLoading(true)
    setError('')
    listSavers(query.trim())
      .then(setSavers)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    runSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mt-6">
      <form onSubmit={runSearch} className="flex gap-2">
        <input
          className="field-input"
          placeholder="Search by name or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={loading}>
          {loading ? <Spinner className="border-paper/30 border-t-paper" /> : 'Search'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
          {error}
        </p>
      )}

      {savers && savers.length === 0 && <EmptyRow text="No savers found." />}

      {savers && savers.length > 0 && (
        <ul className="card mt-4 divide-y divide-ink/5">
          {savers.map((s) => (
            <li key={s.id}>
              <Link to={`/admin/savers/${s.id}`} className="flex items-center justify-between py-3 text-sm hover:opacity-70">
                <div>
                  <p className="font-medium">{s.full_name}</p>
                  <p className="text-muted">{s.phone}{s.email && <> &middot; {s.email}</>}</p>
                </div>
                <StatusPill status={s.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Admins tab (super_admin only) ───────────────────────────────────────

function AdminsTab() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    setError('')
    listAdmins().then(setAdmins).catch((err) => setError(extractErrorMessage(err)))
  }

  useEffect(() => {
    load()
  }, [])

  async function runAction(id, action) {
    setBusyId(id)
    setError('')
    try {
      await action()
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mt-6">
      <div className="flex justify-end">
        <Link to="/admin/admins/new" className="btn-gold">Add admin</Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
          {error}
        </p>
      )}

      {!admins && !error && <Loading />}
      {admins && admins.length === 0 && <EmptyRow text="No admins yet." />}

      {admins && admins.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {admins.map((a) => {
            const isSelf = a.id === user?.id
            return (
              <div key={a.id} className="card flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {a.full_name} {isSelf && <span className="text-xs text-muted">(you)</span>}
                  </p>
                  <p className="text-sm text-muted">{a.phone}{a.email && <> &middot; {a.email}</>}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs capitalize text-muted">{a.role.replace('_', ' ')}</span>
                  <StatusPill status={a.status} />
                  {!isSelf && (
                    <>
                      {a.status === 'suspended' ? (
                        <button disabled={busyId === a.id} onClick={() => runAction(a.id, () => activateAdmin(a.id))} className="btn-outline px-3 py-1.5 text-xs">
                          Reactivate
                        </button>
                      ) : (
                        <button disabled={busyId === a.id} onClick={() => runAction(a.id, () => suspendAdmin(a.id))} className="btn-outline px-3 py-1.5 text-xs">
                          Suspend
                        </button>
                      )}
                      <button
                        disabled={busyId === a.id}
                        onClick={() => {
                          if (confirm(`Delete ${a.full_name}'s admin account? This can't be undone.`)) {
                            runAction(a.id, () => deleteAdmin(a.id))
                          }
                        }}
                        className="text-xs text-clay hover:underline"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Manage agents tab (super_admin only — full list, not just pending) ──

function ManageAgentsTab() {
  const [agents, setAgents] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    setError('')
    listAllAgents().then(setAgents).catch((err) => setError(extractErrorMessage(err)))
  }

  useEffect(() => {
    load()
  }, [])

  async function runAction(id, action) {
    setBusyId(id)
    setError('')
    try {
      await action()
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mt-6">
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
          {error}
        </p>
      )}

      {!agents && !error && <Loading />}
      {agents && agents.length === 0 && <EmptyRow text="No agents yet." />}

      {agents && agents.length > 0 && (
        <div className="flex flex-col gap-3">
          {agents.map((a) => (
            <div key={a.id} className="card flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{a.market_name}</p>
                <p className="text-sm text-muted">{a.location}, {a.city} &middot; {a.agent_code}</p>
                <p className="text-sm text-muted">{a.applicant_name} &middot; {a.applicant_phone} &middot; {a.total_savers} savers</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusPill status={a.status} />
                {a.status !== 'suspended' && (
                  <button disabled={busyId === a.id} onClick={() => runAction(a.id, () => suspendAgentFull(a.id))} className="btn-outline px-3 py-1.5 text-xs">
                    Suspend
                  </button>
                )}
                <button
                  disabled={busyId === a.id}
                  onClick={() => {
                    if (confirm(`Delete ${a.market_name}? This only works if they have no assigned pots.`)) {
                      runAction(a.id, () => deleteAgent(a.id))
                    }
                  }}
                  className="text-xs text-clay hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
