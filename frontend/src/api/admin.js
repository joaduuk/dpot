import { apiClient } from './client'

/** GET /admin/agents/pending */
export function listPendingAgents() {
  return apiClient.get('/admin/agents/pending').then((res) => res.data)
}

/** PUT /admin/agents/{agent_id}/approve */
export function approveAgent(agentId) {
  return apiClient.put(`/admin/agents/${agentId}/approve`).then((res) => res.data)
}

/** PUT /admin/agents/{agent_id}/reject */
export function rejectAgent(agentId) {
  return apiClient.put(`/admin/agents/${agentId}/reject`).then((res) => res.data)
}

/** GET /admin/payments/pending */
export function listPendingPayments() {
  return apiClient.get('/admin/payments/pending').then((res) => res.data)
}

/** PUT /admin/payments/{payment_id}/confirm */
export function confirmPayment(paymentId) {
  return apiClient.put(`/admin/payments/${paymentId}/confirm`).then((res) => res.data)
}

/** PUT /admin/payments/{payment_id}/dispute */
export function disputePayment(paymentId) {
  return apiClient.put(`/admin/payments/${paymentId}/dispute`).then((res) => res.data)
}

/** GET /admin/payouts/pending */
export function listPendingPayouts() {
  return apiClient.get('/admin/payouts/pending').then((res) => res.data)
}

/**
 * PUT /pots/{pot_id}/payout/complete
 * Reuses the existing pot-scoped payout-completion endpoint (now
 * admin/super_admin only) rather than a separate admin route.
 */
export function completePayout(potId) {
  return apiClient.put(`/pots/${potId}/payout/complete`).then((res) => res.data)
}

// ── Savers (admin + super_admin) ────────────────────────────────────────

/** GET /admin/savers?search=... */
export function listSavers(search = '') {
  return apiClient.get('/admin/savers', { params: search ? { search } : {} }).then((res) => res.data)
}

/** GET /admin/savers/{saver_id}/pots */
export function listSaverPots(saverId) {
  return apiClient.get(`/admin/savers/${saverId}/pots`).then((res) => res.data)
}

// ── Admins (super_admin only) ───────────────────────────────────────────

/** GET /admin/admins */
export function listAdmins() {
  return apiClient.get('/admin/admins').then((res) => res.data)
}

/** POST /admin/admins */
export function createAdmin(payload) {
  return apiClient.post('/admin/admins', payload).then((res) => res.data)
}

/** PUT /admin/admins/{user_id}/suspend */
export function suspendAdmin(userId) {
  return apiClient.put(`/admin/admins/${userId}/suspend`).then((res) => res.data)
}

/** PUT /admin/admins/{user_id}/activate */
export function activateAdmin(userId) {
  return apiClient.put(`/admin/admins/${userId}/activate`).then((res) => res.data)
}

/** DELETE /admin/admins/{user_id} */
export function deleteAdmin(userId) {
  return apiClient.delete(`/admin/admins/${userId}`).then((res) => res.data)
}

// ── Agents — full management (super_admin only) ─────────────────────────

/** GET /admin/agents */
export function listAllAgents() {
  return apiClient.get('/admin/agents').then((res) => res.data)
}

/** PUT /admin/agents/{agent_id}/suspend-full */
export function suspendAgentFull(agentId) {
  return apiClient.put(`/admin/agents/${agentId}/suspend-full`).then((res) => res.data)
}

/** DELETE /admin/agents/{agent_id} */
export function deleteAgent(agentId) {
  return apiClient.delete(`/admin/agents/${agentId}`).then((res) => res.data)
}

// ── Admin-driven agent registration (admin + super_admin) ───────────────

/** GET /admin/users/lookup?phone=... — find any existing user by phone */
export function lookupUser(phone) {
  return apiClient.get('/admin/users/lookup', { params: { phone } }).then((res) => res.data)
}

/** POST /admin/agents/register-existing — promote an existing user to agent */
export function registerAgentExisting(payload) {
  return apiClient.post('/admin/agents/register-existing', payload).then((res) => res.data)
}

/** POST /admin/agents/register-new — create a brand-new agent account */
export function registerAgentNew(payload) {
  return apiClient.post('/admin/agents/register-new', payload).then((res) => res.data)
}
