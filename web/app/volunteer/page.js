'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { dispatchAPI, impactAPI } from '../../lib/api'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import StatCard from '../../components/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { Navigation, MapPin, Clock } from 'lucide-react'

export default function VolunteerDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [dispatches, setDispatches] = useState([])
  const [impact, setImpact] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'VOLUNTEER') {
      router.push(`/${user.role.toLowerCase()}`)
      return
    }
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    try {
      const [dispRes, impRes] = await Promise.all([
        dispatchAPI.getAll(),
        impactAPI.getMyImpact()
      ])
      setDispatches(dispRes.data.dispatches || [])
      setImpact(impRes.data.impact || null)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handlePickup = async (dispatch) => {
    try {
      await dispatchAPI.pickup(dispatch.id)
      toast.success('Pickup confirmed! Head to delivery location 🚴')
      fetchData()
    } catch (error) {
      toast.error('Failed to confirm pickup')
    }
  }

  const handleDeliver = async (dispatch) => {
    try {
      await dispatchAPI.deliver(dispatch.id)
      toast.success('Delivery confirmed! GreenCoins earned 🪙')
      fetchData()
    } catch (error) {
      toast.error('Failed to confirm delivery')
    }
  }

  if (authLoading || loading) return <LoadingSpinner text="Loading volunteer dashboard..." />

  const activeDispatches = dispatches.filter(
    d => d.status === 'ACCEPTED' || d.status === 'PICKED' || d.status === 'PENDING'
  )
  const completedDispatches = dispatches.filter(d => d.status === 'DELIVERED')

  return (
    <div className="page-container pb-24" style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 50%, #fff7ed 100%)' }}>
      <Navbar title="Volunteer Dashboard" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">

        {/* Welcome */}
        <div>
          <div className="inline-block bg-pink-100 text-pink-700 text-xs font-medium px-3 py-1 rounded-full mb-2">
            ❤️ Volunteer
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Hello, {user?.name?.split(' ')[0]}! ❤️
          </h2>
          <p className="text-gray-500 mt-1">
            {activeDispatches.length} active pickup{activeDispatches.length !== 1 ? 's' : ''} assigned
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Active"
            value={activeDispatches.length}
            color="pink"
            icon="🚴"
          />
          <StatCard
            label="Delivered"
            value={completedDispatches.length}
            color="green"
            icon="✅"
          />
          <StatCard
            label="GreenCoins"
            value={impact?.greenCoins || 0}
            color="orange"
            icon="🪙"
          />
        </div>

        {/* Active Pickups */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            My Assigned Pickups
          </h3>

          {activeDispatches.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-4xl mb-3">🚴</p>
              <p className="text-gray-600 font-medium">No pickups yet</p>
              <p className="text-gray-400 text-sm mt-1">
                You will be notified when food needs pickup
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDispatches.map((dispatch) => (
                <div key={dispatch.id} className="card border border-gray-100">

                  {/* Urgent badge */}
                  {dispatch.status === 'PENDING' && (
                    <div className="bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-lg inline-block mb-3 font-medium">
                      🔴 Urgent — pick up as soon as possible
                    </div>
                  )}

                  {/* Food info */}
                  <h4 className="text-gray-800 font-semibold mb-2">
                    {dispatch.donation?.foodName}
                  </h4>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span>From: {dispatch.donation?.donor?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span>To: {dispatch.ngo?.name || 'NGO'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>{dispatch.donation?.quantity} {dispatch.donation?.unit}</span>
                      <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        {dispatch.status}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {dispatch.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handlePickup(dispatch)}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Confirm Pickup
                      </button>
                    )}
                    {dispatch.status === 'PICKED' && (
                      <button
                        onClick={() => handleDeliver(dispatch)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        ✅ Confirm Delivery
                      </button>
                    )}
                    {dispatch.status === 'PENDING' && (
                      <button
                        onClick={() => handlePickup(dispatch)}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Start Pickup
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Deliveries */}
        {completedDispatches.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Completed Deliveries ✅
            </h3>
            <div className="space-y-2">
              {completedDispatches.slice(0, 3).map((dispatch) => (
                <div key={dispatch.id} className="card flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div className="flex-1">
                    <p className="text-gray-800 text-sm font-medium">
                      {dispatch.donation?.foodName}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {dispatch.donation?.quantity} {dispatch.donation?.unit} delivered
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Done
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  )
}