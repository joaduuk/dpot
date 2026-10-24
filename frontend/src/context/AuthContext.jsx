import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('dailypot_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem('dailypot_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('dailypot_user')
    }
  }, [user])

  const login = useCallback(async (identifier, password) => {
    setLoading(true)
    try {
      const data = await authApi.login({ identifier, password })
      localStorage.setItem('dailypot_token', data.access_token)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      // /auth/register creates the account and emails a confirmation link;
      // the saver can only log in once they've clicked it.
      return await authApi.register(payload)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('dailypot_token')
    setUser(null)
  }, [])

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
