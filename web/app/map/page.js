'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { donationAPI, hungerPinAPI } from '../../lib/api'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function MapPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [donations, setDonations] = useState([])
  const [hungerPins, setHungerPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [showPinForm, setShowPinForm] = useState(false)
  const [pinForm, setPinForm] = useState({
    address: '',
    description: '',
    peopleCount: '',
    latitude: '19.0760',
    longitude: '72.8777'
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    try {
      const [donRes, pinRes] = await Promise.all([
        donationAPI.getNearby({ latitude: 19.0760, longitude: 72.8777, radius: 50000 }),
        hungerPinAPI.getAll()
      ])
      setDonations(donRes.data.donations || [])
      setHungerPins(pinRes.data.pins || [])
    } catch (error) {
      toast.error('Failed to load map data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPin = async (e) => {
    e.preventDefault()
    if (!pinForm.address) {
      toast.error('Please enter an address')
      return
    }
    try {
      await hungerPinAPI.create(pinForm)
      toast.success('HungerPin added! 📍')
      setShowPinForm(false)
      setPinForm({ address: '', description: '', peopleCount: '', latitude: '19.0760', longitude: '72.8777' })
      fetchData()
    } catch {
      toast.error('Failed to add pin')
    }
  }

  const dietColors = {
    VEG: 'bg-green-100 text-green-700',
    NONVEG: 'bg-red-100 text-red-700',
    JAIN: 'bg-yellow-100 text-yellow-700',
    HALAL: 'bg-blue-100 text-blue-700',
    DIABETIC_SAFE: 'bg-purple-100 text-purple-700',
  }

  const filteredDonations = filter === 'ALL'
    ? donations
    : donations.filter(d => d.dietType === filter)

  if (authLoading || loading) return <LoadingSpinner text="Loading map..." />

  return (
    <div className="page-container pb-24">
      <Navbar title="Live Map" />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-2xl p-3 text-center border border-green-100">
            <p className="text-2xl font-bold text-green-600">{donations.length}</p>
            <p className="text-xs text-green-700 mt-1">🍱 Donations</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-3 text-center border border-red-100">
            <p className="text-2xl font-bold text-red-500">{hungerPins.length}</p>
            <p className="text-xs text-red-600 mt-1">📍 HungerPins</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 text-center border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">50km</p>
            <p className="text-xs text-blue-700 mt-1">🔍 Radius</p>
          </div>
        </div>

        {/* Map placeholder — visual grid */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-br from-green-100 via-blue-50 to-green-50 h-72 relative flex items-center justify-center">

            {/* Grid lines */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="absolute border-b border-gray-400 w-full"
                  style={{ top: `${(i + 1) * 12.5}%` }} />
              ))}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="absolute border-r border-gray-400 h-full"
                  style={{ left: `${(i + 1) * 12.5}%` }} />
              ))}
            </div>

            {/* Center marker — current location */}
            <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
              <p className="text-xs text-blue-700 font-medium text-center mt-1 whitespace-nowrap">
                You are here
              </p>
            </div>

            {/* Donation pins */}
            {filteredDonations.slice(0, 8).map((donation, i) => {
              const positions = [
                { top: '25%', left: '30%' }, { top: '35%', left: '65%' },
                { top: '60%', left: '25%' }, { top: '20%', left: '55%' },
                { top: '70%', left: '60%' }, { top: '45%', left: '15%' },
                { top: '15%', left: '75%' }, { top: '75%', left: '40%' },
              ]
              const pos = positions[i] || { top: '50%', left: '50%' }
              return (
                <button
                  key={donation.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ top: pos.top, left: pos.left }}
                  onClick={() => setSelected({ type: 'donation', data: donation })}
                >
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg hover:bg-green-600 transition-colors whitespace-nowrap">
                    🍱 {donation.foodName?.slice(0, 8)}
                  </div>
                </button>
              )
            })}

            {/* HungerPin markers */}
            {hungerPins.slice(0, 5).map((pin, i) => {
              const positions = [
                { top: '80%', left: '20%' }, { top: '15%', left: '40%' },
                { top: '55%', left: '75%' }, { top: '30%', left: '85%' },
                { top: '85%', left: '70%' },
              ]
              const pos = positions[i] || { top: '60%', left: '60%' }
              return (
                <button
                  key={pin.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ top: pos.top, left: pos.left }}
                  onClick={() => setSelected({ type: 'pin', data: pin })}
                >
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg hover:bg-red-600 transition-colors">
                    📍 Need food
                  </div>
                </button>
              )
            })}

            {/* Legend */}
            <div className="absolute bottom-3 right-3 bg-white rounded-xl p-2 shadow-md text-xs space-y-1">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-600">Donation</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-gray-600">HungerPin</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-gray-600">You</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected item popup */}
        {selected && (
          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                {selected.type === 'donation' ? '🍱 ' + selected.data.foodName : '📍 HungerPin'}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >×</button>
            </div>
            {selected.type === 'donation' ? (
              <div className="space-y-1 text-sm text-gray-600">
                <p>📦 {selected.data.quantity} {selected.data.unit}</p>
                <p>🥗 {selected.data.dietType}</p>
                <p>📍 {selected.data.address}</p>
                <p>⏰ Safe for {selected.data.expiryHours} hrs</p>
                <p>🛡️ Safety: {selected.data.foodSafeScore}/100</p>
                {selected.data.distance && (
                  <p>📏 Distance: {selected.data.distance}</p>
                )}
              </div>
            ) : (
              <div className="space-y-1 text-sm text-gray-600">
                <p>📍 {selected.data.address}</p>
                {selected.data.description && <p>📝 {selected.data.description}</p>}
                {selected.data.peopleCount > 0 && (
                  <p>👥 {selected.data.peopleCount} people need food</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Diet filter */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Filter by diet type</p>
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'VEG', 'NONVEG', 'JAIN', 'HALAL'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
                  filter === f
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                {f === 'ALL' ? '🌍 All' :
                 f === 'VEG' ? '🥦 Veg' :
                 f === 'NONVEG' ? '🍗 Non-Veg' :
                 f === 'JAIN' ? '🌿 Jain' : '☪️ Halal'}
              </button>
            ))}
          </div>
        </div>

        {/* Donations list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800">
              Nearby Donations ({filteredDonations.length})
            </h3>
          </div>
          {filteredDonations.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-gray-500 text-sm">No donations found nearby</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelected({ type: 'donation', data: donation })}
                >
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    🍱
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {donation.foodName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{donation.address}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      dietColors[donation.dietType] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {donation.dietType}
                    </span>
                    {donation.distance && (
                      <span className="text-xs text-green-600 font-medium">
                        {donation.distance}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HungerPins list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800">
              HungerPins ({hungerPins.length})
            </h3>
            <button
              onClick={() => setShowPinForm(!showPinForm)}
              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-xl font-medium hover:bg-red-600 transition-colors"
            >
              + Add Pin
            </button>
          </div>

          {/* Add HungerPin form */}
          {showPinForm && (
            <form onSubmit={handleAddPin} className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-3 space-y-3">
              <p className="text-sm font-semibold text-red-700">
                📍 Report where hungry people need food
              </p>
              <input
                type="text"
                placeholder="Address / Location *"
                className="input-field text-sm"
                value={pinForm.address}
                onChange={(e) => setPinForm({ ...pinForm, address: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                className="input-field text-sm"
                value={pinForm.description}
                onChange={(e) => setPinForm({ ...pinForm, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Number of people (optional)"
                className="input-field text-sm"
                value={pinForm.peopleCount}
                onChange={(e) => setPinForm({ ...pinForm, peopleCount: e.target.value })}
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600">
                  Add HungerPin
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {hungerPins.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-3xl mb-2">📍</p>
              <p className="text-gray-500 text-sm">No HungerPins yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Add a pin to mark where hungry people need food
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {hungerPins.map((pin) => (
                <div
                  key={pin.id}
                  className="bg-white rounded-xl p-3 shadow-sm border border-red-100 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    📍
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {pin.address}
                    </p>
                    {pin.description && (
                      <p className="text-xs text-gray-500 truncate">{pin.description}</p>
                    )}
                  </div>
                  {pin.peopleCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                      👥 {pin.peopleCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  )
}