import { apiClient } from './client'

/** GET /payments/info/{pot_id} — everything the payment screen needs */
export function getPaymentInfo(potId) {
  return apiClient.get(`/payments/info/${potId}`).then((res) => res.data)
}

/**
 * POST /payments/record
 * body: { pot_id, days_to_pay, method, reference, use_wallet_credit }
 * Note: the saver sends days_to_pay, not an amount — the backend computes
 * amount = days_to_pay * daily_amount.
 */
export function recordPayment(payload) {
  return apiClient.post('/payments/record', payload).then((res) => res.data)
}

/**
 * POST /payments/allocate
 * body: { pot_id, day_number }
 * The core drag-and-drop action: move a buffer payment onto a specific unpaid day.
 */
export function allocateBufferDay(payload) {
  return apiClient.post('/payments/allocate', payload).then((res) => res.data)
}

/** GET /payments/pot/{pot_id} — all payments recorded for a pot */
export function listPotPayments(potId) {
  return apiClient.get(`/payments/pot/${potId}`).then((res) => res.data)
}

/** GET /payments/wallet — current user's wallet balance + recent transactions */
export function getMyWallet() {
  return apiClient.get('/payments/wallet').then((res) => res.data)
}
