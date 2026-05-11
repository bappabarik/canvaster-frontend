import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { clearAuth } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const { access_token, refresh_token, user: u } = data.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    const { access_token, refresh_token, user: u } = data.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken })
    } catch { /* ignore */ }
    clearAuth()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      const u = data.data.user
      localStorage.setItem('user', JSON.stringify(u))
      setUser(u)
      return u
    } catch { return null }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
