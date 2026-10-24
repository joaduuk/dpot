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

/** GET /auth/me — the signed-in user's own details */
export function getMe() {
  return apiClient.get('/auth/me').then((res) => res.data)
}

/** PATCH /auth/me — body: { full_name?, phone? } (email can't be changed here) */
export function updateMe(payload) {
  return apiClient.patch('/auth/me', payload).then((res) => res.data)
}

/** POST /auth/change-password — body: { current_password, new_password } */
export function changePassword(currentPassword, newPassword) {
  return apiClient
    .post('/auth/change-password', { current_password: currentPassword, new_password: newPassword })
    .then((res) => res.data)
}
