'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import { Leaf, MapPin, Loader } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('DONOR')
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationDetected, setLocationDetected] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    latitude: '',
    longitude: ''
  })

  const roles = [
    { id: 'DONOR', label: 'Donor', emoji: '🍽️' },
    { id: 'NGO', label: 'NGO', emoji: '🏢' },
    { id: 'VOLUNTEER', label: 'Volunteer', emoji: '❤️' },
  ]

  useEffect(() => {
    detectLocation()
  }, [])

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          setForm(prev => ({
            ...prev,
            latitude: String(lat),
            longitude: String(lng),
            address: prev.address || data.display_name || ''
          }))
        } catch {
          setForm(prev => ({ ...prev, latitude: String(lat), longitude: String(lng) }))
        }
        setLocationDetected(true)
        setLocationLoading(false)
      },
      () => { setLocationLoading(false) },
      { timeout: 8000 }
    )
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error('Please fill all required fields')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (!form.latitude || !form.longitude) {
      toast('⚠️ No location detected. You may not appear in nearby searches.', { icon: '📍' })
    }
    setLoading(true)
    try {
      const res = await authAPI.register({
        ...form,
        role: selectedRole,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      })
      const { user, token } = res.data
      toast.success('Account created! Welcome to AnnaSetu 🎉')
      login(user, token)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 flex flex-col px-6 py-8 max-w-md mx-auto">

      <div className="flex items-center gap-3 mb-8 mt-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-2xl shadow-lg">
          <Leaf className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-green-600">AnnaSetu</h1>
          <p className="text-xs text-gray-500">अन्न सेतु</p>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mb-1">Create Account</h2>
      <p className="text-gray-500 mb-6">Join the food rescue movement</p>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((role) => (
              <button key={role.id} type="button" onClick={() => setSelectedRole(role.id)}
                className={`p-3 rounded-xl border-2 transition-all text-center ${selectedRole === role.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <div className="text-xl mb-1">{role.emoji}</div>
                <p className={`text-xs font-medium ${selectedRole === role.id ? 'text-green-700' : 'text-gray-700'}`}>{role.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name / Organisation Name *</label>
          <input type="text" placeholder="Rajesh Restaurant" className="input-field"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" placeholder="your@email.com" className="input-field"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input type="tel" placeholder="9876543210" className="input-field"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
          <input type="password" placeholder="Min. 6 characters" className="input-field"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

        {/* Location */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Your Location
              {(selectedRole === 'NGO' || selectedRole === 'VOLUNTEER') && <span className="text-red-500">*</span>}
            </label>
            <button type="button" onClick={detectLocation} disabled={locationLoading}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition-all disabled:opacity-60">
              {locationLoading
                ? <><Loader className="w-3 h-3 animate-spin" /> Detecting...</>
                : <><MapPin className="w-3 h-3" /> {locationDetected ? 'Re-detect' : 'Use My Location'}</>
              }
            </button>
          </div>

          {(selectedRole === 'NGO' || selectedRole === 'VOLUNTEER') && (
            <p className="text-xs text-blue-600 bg-blue-100 rounded-lg px-3 py-2">
              📍 <strong>Required for {selectedRole}s</strong> — used to match you with nearby donations.
            </p>
          )}

          {locationDetected ? (
            <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              ✅ GPS captured successfully
            </div>
          ) : !locationLoading ? (
            <div className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
              ⚠️ Click "Use My Location" to capture your GPS coordinates.
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input type="text" placeholder="MG Road, Mumbai (auto-filled from GPS)" className="input-field"
              value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary mt-2 disabled:opacity-60">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating account...
            </span>
          ) : 'Create Account'}
        </button>

        <p className="text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <button type="button" onClick={() => router.push('/login')} className="text-green-600 font-medium hover:underline">
            Sign In
          </button>
        </p>

      </form>
    </div>
  )
}