import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStoredAuth()
  }, [])

  const loadStoredAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('annasetu_token')
      const savedUser = await AsyncStorage.getItem('annasetu_user')
      if (savedToken && savedUser) {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      }
    } catch (error) {
      console.log('Auth load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (userData, userToken) => {
    try {
      await AsyncStorage.setItem('annasetu_token', userToken)
      await AsyncStorage.setItem('annasetu_user', JSON.stringify(userData))
      setToken(userToken)
      setUser(userData)
    } catch (error) {
      console.log('Login save error:', error)
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('annasetu_token')
      await AsyncStorage.removeItem('annasetu_user')
      setToken(null)
      setUser(null)
    } catch (error) {
      console.log('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be inside AuthProvider')
  return context
}