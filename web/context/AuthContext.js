'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Load user from localStorage on app start
    const savedToken = localStorage.getItem('annasetu_token')
    const savedUser = localStorage.getItem('annasetu_user')

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('annasetu_token', userToken)
    localStorage.setItem('annasetu_user', JSON.stringify(userData))

    // Redirect based on role
    if (userData.role === 'DONOR') router.push('/donor')
    else if (userData.role === 'NGO') router.push('/ngo')
    else if (userData.role === 'VOLUNTEER') router.push('/volunteer')
    else router.push('/')
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('annasetu_token')
    localStorage.removeItem('annasetu_user')
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}