import { apiClient } from './client'

/**
 * POST /auth/register
 * body: { full_name, phone, email, password, country, role }
 */
export function register(payload) {
  return apiClient.post('/auth/register', payload).then((res) => res.data)
}

/**
 * POST /auth/login
 * body: { identifier, password } — identifier can be a phone number or email
 * returns: { access_token, token_type, user }
 */
export function login(payload) {
  return apiClient.post('/auth/login', payload).then((res) => res.data)
}

/** POST /auth/forgot-password — body: { email } */
export function forgotPassword(email) {
  return apiClient.post('/auth/forgot-password', { email }).then((res) => res.data)
}

/** POST /auth/reset-password — body: { token, new_password } */
export function resetPassword(token, newPassword) {
  return apiClient.post('/auth/reset-password', { token, new_password: newPassword }).then((res) => res.data)
}

/** POST /auth/confirm-email — body: { token } from the emailed link */
export function confirmEmail(token) {
  return apiClient.post('/auth/confirm-email', { token }).then((res) => res.data)
}

/** POST /auth/resend-confirmation — body: { email } */
export function resendConfirmation(email) {
  return apiClient.post('/auth/resend-confirmation', { email }).then((res) => res.data)
}
