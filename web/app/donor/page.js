'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { donationAPI, impactAPI } from '../../lib/api'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import StatCard from '../../components/StatCard'
import DonationCard from '../../components/DonationCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'

export default function DonorDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [donations, setDonations] = useState([])
  const [impact, setImpact] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'DONOR') {
      router.push(`/${user.role.toLowerCase()}`)
      return
    }
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    try {
      const [donRes, impRes] = await Promise.all([
        donationAPI.getMine(),
        impactAPI.getMyImpact()
      ])
      setDonations(donRes.data.donations || [])
      setImpact(impRes.data.impact || null)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (donation) => {
    try {
      await donationAPI.cancel(donation.id)
      toast.success('Donation cancelled')
      fetchData()
    } catch (error) {
      toast.error('Failed to cancel donation')
    }
  }

  if (authLoading || loading) return <LoadingSpinner text="Loading your dashboard..." />

  return (
    <div className="page-container pb-24">
      <Navbar title="Donor Dashboard" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">

        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Good Morning, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-500 mt-1">Share your surplus food today</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Meals Donated"
            value={impact?.totalMeals || 0}
            color="green"
            icon="🍱"
          />
          <StatCard
            label="CO₂ Saved (kg)"
            value={impact?.totalCo2 || '0.00'}
            color="orange"
            icon="🌿"
          />
          <StatCard
            label="GreenCoins"
            value={impact?.greenCoins || 0}
            color="green"
            icon="🪙"
          />
        </div>

        {/* Quick Actions */}
        <div>
  <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h3>
  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={() => router.push('/donor/add-food')}
      className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2"
    >
      <span className="text-2xl">🍽️</span>
      <span className="text-sm font-medium">Donate Food</span>
    </button>
    <button
      onClick={() => router.push('/donor/impact')}
      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2"
    >
      <span className="text-2xl">📊</span>
      <span className="text-sm font-medium">My Impact</span>
    </button>
    <button
      onClick={() => router.push('/map')}
      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2"
    >
      <span className="text-2xl">🗺️</span>
      <span className="text-sm font-medium">Live Map</span>
    </button>
    <button
      onClick={() => router.push('/donor/export')}
      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2"
    >
      <span className="text-2xl">📥</span>
      <span className="text-sm font-medium">Export CSV</span>
    </button>
  </div>
</div>

        {/* My Donations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">My Donations</h3>
            <span className="text-sm text-gray-500">{donations.length} total</span>
          </div>

          {donations.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-4xl mb-3">🍱</p>
              <p className="text-gray-600 font-medium">No donations yet</p>
              <p className="text-gray-400 text-sm mt-1">List your first food donation!</p>
              <button
                onClick={() => router.push('/donor/add-food')}
                className="mt-4 btn-primary"
              >
                Donate Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {donations.map((donation) => (
                <DonationCard
                  key={donation.id}
                  donation={donation}
                  onAction={
                    donation.status === 'LISTED' ? handleCancel : null
                  }
                  actionLabel={
                    donation.status === 'LISTED' ? '❌ Cancel' : null
                  }
                  actionColor="orange"
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* FAB */}
      <button
        onClick={() => router.push('/donor/add-food')}
        className="fixed bottom-20 right-4 bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav />
    </div>
  )
}