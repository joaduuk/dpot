import { apiClient } from './client'

/**
 * POST /pots/{pot_id}/payout/request
 * body: { method, mobile_money_number, bank_account, requested_payout_date }
 * Allowed any time days_paid > 0 — early/partial cashout is supported, not
 * just once the pot is fully paid.
 */
export function requestPayout(potId, payload) {
  return apiClient.post(`/pots/${potId}/payout/request`, payload).then((res) => res.data)
}

/**
 * GET /pots/{pot_id}/payout — current payout status for this pot.
 * Returns null (instead of throwing) when no payout has been requested yet
 * — the backend 404s in that case, which just means "nothing to show."
 */
export function getPayoutStatus(potId) {
  return apiClient
    .get(`/pots/${potId}/payout`)
    .then((res) => res.data)
    .catch((err) => {
      if (err.response?.status === 404) return null
      throw err
    })
}

