import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchUserData = async () => {
    try {
      const data = await authService.getUserProfile()
      if (data.success && data.userData) {
        setUser(data.userData)
        setIsLoggedIn(true)
        return data.userData
      } else {
        setUser(null)
        setIsLoggedIn(false)
        return null
      }
    } catch {
      setUser(null)
      setIsLoggedIn(false)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const login = async (credentials) => {
    const res = await authService.login(credentials)
    if (res.success) {
      if (res.token) {
        localStorage.setItem('token', res.token)
      }
      const userData = await fetchUserData()
      return { ...res, userData }
    }
    return res
  }

  const register = async (userData) => {
    const res = await authService.register(userData)
    if (res.success) {
      if (res.token) {
        localStorage.setItem('token', res.token)
      }
      await fetchUserData()
    }
    return res
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      setIsLoggedIn(false)
      localStorage.removeItem('token')
    }
  }

  const isAdmin = user?.role === 'admin'
  const isPremium = Boolean(user?.isPremium)

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isAdmin, isPremium, loading, login, register, logout, fetchUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
