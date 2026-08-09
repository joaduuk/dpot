import { apiClient } from './client'

/** GET /pots/ — list the current saver's pots */
export function listPots() {
  return apiClient.get('/pots/').then((res) => res.data)
}

/**
 * POST /pots/
 * body: { name, daily_amount, currency, payment_method, start_date, agent_id }
 */
export function createPot(payload) {
  return apiClient.post('/pots/', payload).then((res) => res.data)
}

/** GET /pots/{pot_id} */
export function getPot(potId) {
  return apiClient.get(`/pots/${potId}`).then((res) => res.data)
}

/**
 * GET /pots/{pot_id}/board
 * Returns the 31-dot board: days 1-30 are saving days, day 31 is the platform fee day.
 */
export function getPotBoard(potId) {
  return apiClient.get(`/pots/${potId}/board`).then((res) => res.data)
}
