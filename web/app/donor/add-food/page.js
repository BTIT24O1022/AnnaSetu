'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { donationAPI, dispatchAPI } from '../../../lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, MapPin, Loader } from 'lucide-react'

// ─── Score Preview Component ───────────────────────
function ScorePreview({ expiryHours, dietType }) {
  const hrs = parseInt(expiryHours) || 4
  let score = 100
  if (hrs <= 1) score -= 40
  else if (hrs <= 2) score -= 25
  else if (hrs <= 3) score -= 15
  else if (hrs <= 4) score -= 5
  if (dietType === 'VEG' || dietType === 'JAIN') score += 5
  if (dietType === 'NONVEG') score -= 10
  score = Math.min(100, Math.max(0, score))

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
          style={{ width: score + '%' }}
        />
      </div>
      <span className="text-green-700 font-bold text-sm">{score}/100</span>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────
export default function AddFoodPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoResult, setPhotoResult] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationDetected, setLocationDetected] = useState(false)
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    foodName: '',
    description: '',
    quantity: '',
    unit: 'plates',
    dietType: 'VEG',
    expiryHours: '4',
    address: '',
    latitude: '',
    longitude: '',
  })

  const dietTypes = [
    { id: 'VEG', label: '🥦 Veg' },
    { id: 'NONVEG', label: '🍗 Non-Veg' },
    { id: 'JAIN', label: '🌿 Jain' },
    { id: 'HALAL', label: '☪️ Halal' },
    { id: 'DIABETIC_SAFE', label: '💚 Diabetic' },
  ]

  useEffect(() => {
    detectLocation()
  }, [])

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser')
      return
    }
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          )
          const data = await res.json()
          const addr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setForm(prev => ({
            ...prev,
            latitude: String(lat),
            longitude: String(lng),
            address: prev.address || addr
          }))
          setLocationDetected(true)
          toast.success('📍 Location detected!')
        } catch {
          setForm(prev => ({
            ...prev,
            latitude: String(lat),
            longitude: String(lng),
          }))
          setLocationDetected(true)
          toast.success('📍 Coordinates captured!')
        } finally {
          setLocationLoading(false)
        }
      },
      (err) => {
        setLocationLoading(false)
        if (err.code === 1) {
          toast.error('Location permission denied. Please enter address manually.')
        } else {
          toast.error('Could not detect location. Please enter address manually.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handlePhotoScan = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoLoading(true)
    setPhotoResult(null)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const token = localStorage.getItem('annasetu_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://annasetu-47ci.onrender.com/api'}/foodclock/analyse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setPhotoResult(data)
        setForm(prev => ({
          ...prev,
          foodName: data.analysis.foodName !== 'Unknown Food' ? data.analysis.foodName : prev.foodName,
          dietType: ['VEG', 'NONVEG', 'JAIN', 'HALAL'].includes(data.analysis.foodType) ? data.analysis.foodType : prev.dietType,
          expiryHours: String(Math.min(8, Math.max(2, data.analysis.estimatedHoursSafe || 4))),
        }))
        toast.success('Food analysed by AI! Form auto-filled 🤖')
      } else {
        toast.error(data.message || 'Analysis failed')
      }
    } catch (error) {
      toast.error('Failed to analyse photo. Please try again.')
    } finally {
      setPhotoLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.foodName || !form.quantity || !form.address) {
      toast.error('Please fill all required fields')
      return
    }
    if (!form.latitude || !form.longitude) {
      toast.error('📍 Location required! Please allow location access.')
      return
    }
    setLoading(true)
    try {
      const res = await donationAPI.create(form)
      const donationId = res.data.donation.id
      toast.success('Food listed! Finding nearest NGO... 🎉')
      try {
        await dispatchAPI.autoDispatch(donationId)
        toast.success('NGO and volunteer notified! 🚴')
      } catch {
        toast('Donation listed. Dispatch pending.', { icon: 'ℹ️' })
      }
      router.push('/donor')
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to list food'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 pb-8">

      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">List Food Donation</h1>
          <p className="text-xs text-gray-500">Fill details about your surplus food</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 max-w-lg mx-auto space-y-5">

        {/* FoodClock AI */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-sm font-semibold text-purple-700">FoodClock AI</p>
              <p className="text-xs text-purple-500">Take a photo — AI estimates safety score instantly</p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoScan} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={photoLoading}
            className="w-full py-3 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 font-medium text-sm hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-60"
          >
            {photoLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                AI is analysing your food...
              </span>
            ) : '📸 Take Photo or Upload — AI will analyse'}
          </button>
          {photoResult && (
            <div className="mt-3 p-3 bg-white rounded-xl border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-800">
                  {photoResult.scoreMessage?.emoji} {photoResult.analysis.foodName}
                </p>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  photoResult.analysis.safetyScore >= 70 ? 'bg-green-100 text-green-700'
                  : photoResult.analysis.safetyScore >= 50 ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                  {photoResult.analysis.safetyScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all ${
                    photoResult.analysis.safetyScore >= 70 ? 'bg-green-500'
                    : photoResult.analysis.safetyScore >= 50 ? 'bg-yellow-500'
                    : 'bg-red-500'
                  }`}
                  style={{ width: `${photoResult.analysis.safetyScore}%` }}
                />
              </div>
              <p className="text-xs text-purple-700 font-medium bg-purple-50 rounded-lg p-2">
                💡 {photoResult.recommendation?.action}
              </p>
            </div>
          )}
        </div>

        {/* Food Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Food Name *</label>
          <input
            type="text"
            placeholder="e.g. Biryani, Dal Rice, Roti Sabzi"
            className="input-field"
            value={form.foodName}
            onChange={(e) => setForm({ ...form, foodName: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            placeholder="Any additional details..."
            className="input-field resize-none h-20"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
            <input
              type="number"
              placeholder="50"
              className="input-field"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
            <select className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value="plates">Plates</option>
              <option value="kg">Kilograms</option>
              <option value="boxes">Boxes</option>
              <option value="packets">Packets</option>
              <option value="litres">Litres</option>
            </select>
          </div>
        </div>

        {/* Diet Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Diet Type *</label>
          <div className="flex flex-wrap gap-2">
            {dietTypes.map((diet) => (
              <button
                key={diet.id}
                type="button"
                onClick={() => setForm({ ...form, dietType: diet.id })}
                className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.dietType === diet.id
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                {diet.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expiry Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Safe for how many hours? *</label>
          <div className="grid grid-cols-4 gap-2">
            {['2', '4', '6', '8'].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setForm({ ...form, expiryHours: h })}
                className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.expiryHours === h
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                {h} hrs
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Pickup Location *
            </label>
            <button
              type="button"
              onClick={detectLocation}
              disabled={locationLoading}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition-all disabled:opacity-60"
            >
              {locationLoading
                ? <><Loader className="w-3 h-3 animate-spin" /> Detecting...</>
                : <><MapPin className="w-3 h-3" /> {locationDetected ? 'Re-detect' : 'Use My Location'}</>
              }
            </button>
          </div>

          {locationDetected && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              ✅ GPS captured successfully
            </div>
          )}
          {!locationDetected && !locationLoading && (
            <div className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
              ⚠️ Location not detected. Please allow browser location access.
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Pickup Address *</label>
            <input
              type="text"
              placeholder="Full address for pickup (auto-filled from GPS)"
              className="input-field"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        </div>

        {/* FoodSafe Score Preview */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-green-700 mb-2">🛡️ Estimated FoodSafe Score</p>
          <ScorePreview expiryHours={form.expiryHours} dietType={form.dietType} />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Listing food...
            </span>
          ) : '🍱 List Food Donation'}
        </button>

      </form>
    </div>
  )
}