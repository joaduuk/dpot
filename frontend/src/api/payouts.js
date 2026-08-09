import { apiClient } from './client'

/**
 * POST /pots/{pot_id}/payout/request
 * body: { payout_date, method, account_details }
 * Only allowed once the pot's status is "completed" (30/30 days + fee paid).
 */
export function requestPayout(potId, payload) {
  return apiClient.post(`/pots/${potId}/payout/request`, payload).then((res) => res.data)
}

/** GET /pots/{pot_id}/payout — current payout status for this pot */
export function getPayoutStatus(potId) {
  return apiClient.get(`/pots/${potId}/payout`).then((res) => res.data)
}
