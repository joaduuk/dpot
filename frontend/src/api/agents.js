import { apiClient } from './client'

/** POST /agents/apply — apply to become an agent */
export function applyAsAgent(payload) {
  return apiClient.post('/agents/apply', payload).then((res) => res.data)
}

/** GET /agents/me — the current agent's own profile */
export function getMyAgentProfile() {
  return apiClient.get('/agents/me').then((res) => res.data)
}

/** GET /agents/me/pots — pots this agent has already claimed */
export function listMySavers() {
  return apiClient.get('/agents/me/pots').then((res) => res.data)
}

/**
 * GET /agents/lookup?phone=...
 * Find a saver's cash pots by phone, including ones not yet claimed by
 * any agent — used to record a saver's very first cash payment.
 */
export function lookupSaverByPhone(phone) {
  return apiClient.get('/agents/lookup', { params: { phone } }).then((res) => res.data)
}
