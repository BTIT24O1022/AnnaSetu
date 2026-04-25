'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { donationAPI, dispatchAPI, impactAPI } from '../../lib/api'
import Navbar from '../../components/Navbar'
import BottomNav from '../../components/BottomNav'
import StatCard from '../../components/StatCard'
import DonationCard from '../../components/DonationCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function NGODashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [donations, setDonations] = useState([])
  const [dispatches, setDispatches] = useState([])
  const [impact, setImpact] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'NGO') {
      router.push(`/${user.role.toLowerCase()}`)
      return
    }
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    try {
      // ✅ FIX 1: Use user's saved coordinates if available,
      // otherwise use a wide-radius fallback that fetches ALL donations
      const lat = user?.latitude || 20.5937   // India center fallback
      const lng = user?.longitude || 78.9629
      // ✅ FIX 2: Use very large radius (50000km) so nothing is missed
      // In production you'd use GPS, but this ensures dashboard is never empty
      const radius = 50000000 // 50,000 km

      const [nearbyRes, dispatchRes, impactRes] = await Promise.all([
        donationAPI.getNearby({ latitude: lat, longitude: lng, radius }).catch(() => ({ data: { donations: [] } })),
        dispatchAPI.getAll().catch(() => ({ data: { dispatches: [] } })),
        impactAPI.getMyImpact().catch(() => ({ data: { impact: null } }))
      ])

      // ✅ FIX 3: Fetch both LISTED and MATCHED since Render might not be updated
      let allDonations = nearbyRes?.data?.donations || []
      if (allDonations.length === 0) {
        const [listedRes, matchedRes] = await Promise.all([
           donationAPI.getAll({ status: 'LISTED' }).catch(() => ({ data: { donations: [] } })),
           donationAPI.getAll({ status: 'MATCHED' }).catch(() => ({ data: { donations: [] } }))
        ])
        allDonations = [...(listedRes?.data?.donations || []), ...(matchedRes?.data?.donations || [])]
      }

      setDonations(allDonations)
      setDispatches(dispatchRes?.data?.dispatches || [])
      setImpact(impactRes?.data?.impact || null)
    } catch (error) {
      console.error('NGO dashboard error:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (donation) => {
    try {
      let dispatchId = null;
      // Check the loaded dispatches array
      let dispatch = dispatches.find(d => d.donationId === donation.id)
      if (dispatch) {
        dispatchId = dispatch.id;
      } 
      // If Render failed us, rely on the embedded dispatch object from getAll!
      else if (donation.dispatch && donation.dispatch.id) {
        dispatchId = donation.dispatch.id;
      }

      if (!dispatchId) {
        const autoRes = await dispatchAPI.autoDispatch(donation.id);
        if (autoRes.data && autoRes.data.dispatch) {
          dispatchId = autoRes.data.dispatch.id;
        } else {
          toast.error('No dispatch found and auto-dispatch failed');
          return;
        }
      }
      
      await dispatchAPI.accept(dispatchId)
      toast.success('Donation accepted! Volunteer notified 🚴')
      fetchData()
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to accept donation'
      toast.error(msg)
    }
  }

  if (authLoading || loading) return <LoadingSpinner text="Loading NGO dashboard..." />

  const pendingDonations = donations.filter(d => d.status === 'LISTED' || d.status === 'MATCHED')
  const acceptedDispatches = dispatches.filter(d => d.status === 'ACCEPTED' || d.status === 'PICKED')

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('annasetu_token')
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://annasetu-2.onrender.com/api'
      const res = await fetch(`${baseURL}/donations/export/csv`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'annasetu-donations.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Export downloaded! 📥')
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  return (
    <div className="page-container pb-24" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0fdf4 100%)' }}>
      <Navbar title="NGO Dashboard" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">

        {/* Welcome */}
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-2">
              🏢 NGO Account
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome, {user?.name?.split(' ')[0]}! 🏢
            </h2>
            <p className="text-gray-500 mt-1">
              {donations.length} food donations available
            </p>
          </div>
          <button 
            onClick={handleExport}
            className="flex flex-col items-center justify-center p-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition border border-green-200"
          >
            <span className="text-xl mb-1">📥</span>
            <span className="text-[10px] font-bold">CSV</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pending" value={pendingDonations.length} color="orange" icon="⏳" />
          <StatCard label="Accepted" value={acceptedDispatches.length} color="blue" icon="✅" />
          <StatCard label="Meals Got" value={impact?.totalMeals || 0} color="green" icon="🍱" />
        </div>

        {/* Incoming Donations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Available Donations</h3>
            <button onClick={() => router.push('/ngo/requests')} className="text-sm text-blue-600 font-medium">
              View All →
            </button>
          </div>

          {donations.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-600 font-medium">No donations available yet</p>
              <p className="text-gray-400 text-sm mt-1">Ask a donor to list food first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {donations.slice(0, 3).map((donation) => (
                <DonationCard
                  key={donation.id}
                  donation={donation}
                  onAction={handleAccept}
                  actionLabel="✅ Accept Donation"
                  actionColor="blue"
                />
              ))}
            </div>
          )}
        </div>

      </div>
      <BottomNav />
    </div>
  )
}