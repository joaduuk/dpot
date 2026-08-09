import { useEffect, useState } from 'react'
import { getMyWallet } from '../api/payments'
import { extractErrorMessage } from '../api/client'
import Spinner from '../components/Spinner'
import Money from '../components/Money'

/**
 * NOTE ON THE API SHAPE: the Swagger doc for GET /payments/wallet only shows
 * a generic string example, so the exact response fields aren't pinned down
 * yet. This page defensively reads a few likely field names (balance /
 * wallet_balance, currency / wallet_currency, transactions) — adjust the
 * field names below once you confirm the live response.
 */
export default function Wallet() {
  const [wallet, setWallet] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyWallet()
      .then(setWallet)
      .catch((err) => setError(extractErrorMessage(err)))
  }, [])

  if (!wallet && !error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      </div>
    )
  }

  const balance = wallet.balance ?? wallet.wallet_balance ?? 0
  const currency = wallet.currency ?? wallet.wallet_currency ?? ''
  const transactions = wallet.transactions ?? wallet.recent_transactions ?? []

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Wallet</h1>
      <p className="mt-1 text-muted">Credit from overpayments and refunds lives here.</p>

      <div className="card mt-6 flex flex-col items-center gap-1 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Balance</p>
        <Money amount={balance} currency={currency} className="text-4xl font-semibold" />
      </div>

      <div className="card mt-6">
        <h2 className="mb-4 text-lg font-semibold">Recent transactions</h2>
        {transactions.length === 0 && (
          <p className="text-sm text-muted">No wallet activity yet.</p>
        )}
        {transactions.length > 0 && (
          <ul className="divide-y divide-ink/5">
            {transactions.map((t, i) => (
              <li key={t.id ?? i} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium capitalize">{t.type || t.description || 'Transaction'}</p>
                  {t.created_at && <p className="text-muted">{new Date(t.created_at).toLocaleString()}</p>}
                </div>
                <Money amount={t.amount} currency={currency} className="font-semibold" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
