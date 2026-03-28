'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import { Leaf, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('DONOR')
  const [form, setForm] = useState({ email: '', password: '' })

  const roles = [
    { id: 'DONOR', label: 'Donor', emoji: '🍽️', desc: 'Restaurants & Homes' },
    { id: 'NGO', label: 'NGO', emoji: '🏢', desc: 'Organizations' },
    { id: 'VOLUNTEER', label: 'Volunteer', emoji: '❤️', desc: 'Individual helpers' },
  ]

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please enter email and password')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.login({
        email: form.email.trim().toLowerCase(),
        password: form.password
      })
      const { user, token } = res.data
      toast.success(`Welcome back, ${user.name}! 🎉`)
      login(user, token)
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Check your email and password.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 flex flex-col px-6 py-8 max-w-md mx-auto">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 mt-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-2xl shadow-lg">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent">
            AnnaSetu
          </h1>
          <p className="text-sm text-gray-500">अन्न सेतु</p>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back</h2>
      <p className="text-gray-500 mb-8">Sign in to continue making an impact</p>

      <form onSubmit={handleLogin} className="flex-1 flex flex-col">

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            placeholder="your@email.com"
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="input-field pr-12"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword
                ? <EyeOff className="w-5 h-5" />
                : <Eye className="w-5 h-5" />
              }
            </button>
          </div>
        </div>

        {/* Role Selection — just for UX, not enforced */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            I am a
          </label>
          <div className="grid grid-cols-3 gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`p-4 rounded-2xl border-2 transition-all text-center ${
                  selectedRole === role.id
                    ? 'border-green-500 bg-green-50 scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{role.emoji}</div>
                <p className={`text-xs font-medium ${
                  selectedRole === role.id ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {role.label}
                </p>
                <p className={`text-xs mt-0.5 ${
                  selectedRole === role.id ? 'text-green-500' : 'text-gray-400'
                }`}>
                  {role.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Register Link */}
        <p className="text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="text-green-600 font-medium hover:underline"
          >
            Sign Up Free
          </button>
        </p>

      </form>
    </div>
  )
}