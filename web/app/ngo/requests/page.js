'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { donationAPI, dispatchAPI } from '../../../lib/api'
import Navbar from '../../../components/Navbar'
import BottomNav from '../../../components/BottomNav'
import DonationCard from '../../../components/DonationCard'
import LoadingSpinner from '../../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function NGORequestsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [donations, setDonations] = useState([])
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available')

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    try {
      // ✅ FIXED: Use user's coordinates or wide-radius India fallback
      const lat = user?.latitude || 20.5937
      const lng = user?.longitude || 78.9629
      const radius = 500000 // 500 km — catches everything

      const [nearbyRes, dispatchRes] = await Promise.all([
        donationAPI.getNearby({ latitude: lat, longitude: lng, radius }),
        dispatchAPI.getAll()
      ])

      let allDonations = nearbyRes.data.donations || []

      // ✅ FIXED: If still 0, fetch all listed donations as fallback
      if (allDonations.length === 0) {
        const allRes = await donationAPI.getAll({ status: 'LISTED' })
        allDonations = allRes.data.donations || []
      }

      setDonations(allDonations)
      setDispatches(dispatchRes.data.dispatches || [])
    } catch (error) {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  // ─── CSV Export ────────────────────────────────
  const handleExportCSV = () => {
    let dataToExport = []
    if (activeTab === 'available') dataToExport = donations;
    else if (activeTab === 'accepted') dataToExport = dispatches.filter(d => d.status === 'ACCEPTED' || d.status === 'PICKED').map(d => d.donation);
    else if (activeTab === 'delivered') dataToExport = dispatches.filter(d => d.status === 'DELIVERED').map(d => d.donation);

    // Filter out null/undefined donations (just in case)
    dataToExport = dataToExport.filter(d => d)

    if (dataToExport.length === 0) {
      toast.error(`No data to export for the ${activeTab} tab`)
      return
    }

    const headers = ['Food Name', 'Quantity', 'Unit', 'Diet Type', 'Status', 'Expiry Hours', 'Donor', 'Address', 'Date']
    const rows = dataToExport.map(d => [
      `"${d?.foodName || ''}"`,
      d?.quantity || '',
      `"${d?.unit || ''}"`,
      d?.dietType || '',
      d?.status || '',
      d?.expiryHours || '',
      `"${d?.donor?.name || ''}"`,
      `"${(d?.address || '').replace(/"/g, '""')}"`,
      d?.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `annasetu-${activeTab}-requests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported! 📊')
  }

  const handleAccept = async (donation) => {
    try {
      let dispatch = dispatches.find(d => d.donationId === donation.id)
      if (!dispatch) {
        const autoRes = await dispatchAPI.autoDispatch(donation.id);
        if (autoRes.data && autoRes.data.dispatch) {
          dispatch = autoRes.data.dispatch;
        } else {
          toast.error('No dispatch record found and auto-dispatch failed');
          return;
        }
      }
      
      await dispatchAPI.accept(dispatch.id)
      toast.success('Donation accepted! Volunteer has been notified 🚴')
      fetchData()
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to accept'
      toast.error(msg)
    }
  }

  if (authLoading || loading) return <LoadingSpinner text="Loading requests..." />

  const acceptedDispatches = dispatches.filter(d => d.status === 'ACCEPTED' || d.status === 'PICKED')
  const deliveredDispatches = dispatches.filter(d => d.status === 'DELIVERED')

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0fdf4 100%)' }}>
      <Navbar title="Food Requests" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">

        {/* Top row: List/Map toggle + Export CSV */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700">
              ☰ List
            </button>
            <button
              onClick={() => router.push('/map')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700"
            >
              🗺️ Map
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
          >
            ⬇️ Export CSV
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1">
          {[
            { id: 'available', label: `Available (${donations.length})` },
            { id: 'accepted', label: `Accepted (${acceptedDispatches.length})` },
            { id: 'delivered', label: `Done (${deliveredDispatches.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Available Donations */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            {donations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-600 font-medium">No donations nearby</p>
                <p className="text-gray-400 text-sm mt-1">Check back soon for new donations</p>
              </div>
            ) : (
              donations.map((donation) => (
                <DonationCard
                  key={donation.id}
                  donation={donation}
                  onAction={handleAccept}
                  actionLabel="✅ Accept Donation"
                  actionColor="blue"
                />
              ))
            )}
          </div>
        )}

        {/* Accepted */}
        {activeTab === 'accepted' && (
          <div className="space-y-3">
            {acceptedDispatches.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                <p className="text-4xl mb-3">⏳</p>
                <p className="text-gray-600 font-medium">No accepted donations yet</p>
              </div>
            ) : (
              acceptedDispatches.map((dispatch) => (
                <div key={dispatch.id} className="bg-white rounded-2xl shadow-md p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-gray-800 font-semibold">{dispatch.donation?.foodName}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      dispatch.status === 'PICKED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {dispatch.status === 'PICKED' ? '🚴 On the way' : '✅ Accepted'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">From: {dispatch.donation?.donor?.name}</p>
                  <p className="text-gray-500 text-sm">Volunteer: {dispatch.volunteer?.name || 'Being assigned...'}</p>
                  <p className="text-gray-500 text-sm">Qty: {dispatch.donation?.quantity} {dispatch.donation?.unit}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Delivered */}
        {activeTab === 'delivered' && (
          <div className="space-y-3">
            {deliveredDispatches.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-gray-600 font-medium">No deliveries yet</p>
              </div>
            ) : (
              deliveredDispatches.map((dispatch) => (
                <div key={dispatch.id} className="bg-white rounded-2xl shadow-md p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-gray-800 font-semibold">{dispatch.donation?.foodName}</h4>
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">✅ Delivered</span>
                  </div>
                  <p className="text-gray-500 text-sm">{dispatch.donation?.quantity} {dispatch.donation?.unit} received</p>
                  <p className="text-gray-500 text-sm">From: {dispatch.donation?.donor?.name}</p>
                  {dispatch.deliveredAt && (
                    <p className="text-gray-400 text-xs mt-1">Delivered: {new Date(dispatch.deliveredAt).toLocaleDateString()}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}