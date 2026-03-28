'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { dispatchAPI } from '../../../lib/api'
import Navbar from '../../../components/Navbar'
import BottomNav from '../../../components/BottomNav'
import LoadingSpinner from '../../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { Navigation, MapPin, Clock, CheckCircle, Download, Map, List } from 'lucide-react'

function DeliveryMap({ dispatches }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (mapInstanceRef.current) return

    const loadLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      const L = (await import('leaflet')).default
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      if (!mapRef.current || mapInstanceRef.current) return
      const valid = dispatches.filter(d => d.donation?.latitude && d.donation?.longitude)
      const centre = valid.length > 0 ? [valid[0].donation.latitude, valid[0].donation.longitude] : [20.5937, 78.9629]
      const map = L.map(mapRef.current).setView(centre, 12)
      mapInstanceRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)
      valid.forEach(d => {
        const color = d.status === 'PICKED' ? '#16a34a' : d.status === 'ACCEPTED' ? '#2563eb' : '#ea580c'
        const icon = L.divIcon({
          html: `<div style="background:${color};color:white;padding:4px 7px;border-radius:8px;font-size:11px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🚴 ${d.donation.foodName?.slice(0,12)}</div>`,
          className: '', iconAnchor: [0, 0]
        })
        L.marker([d.donation.latitude, d.donation.longitude], { icon })
          .addTo(map)
          .bindPopup(`<b>${d.donation.foodName}</b><br/>Status: ${d.status}<br/>Qty: ${d.donation.quantity} ${d.donation.unit}<br/>Pickup: ${d.donation.address||'N/A'}<br/>Deliver to: ${d.ngo?.name||'NGO'}`)
      })
    }
    loadLeaflet()
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
    }
  }, [dispatches])

  return (
    <div ref={mapRef} style={{ height: '380px', width: '100%', borderRadius: '16px', zIndex: 0 }}
      className="border border-gray-200 shadow-md" />
  )
}

function exportDeliveriesToCSV(dispatches) {
  const headers = ['Dispatch ID','Status','Food Name','Quantity','Unit','Donor Name','Pickup Address','Latitude','Longitude','NGO Name','Expiry Hours','Created At','Delivered At']
  const rows = dispatches.map(d => [
    d.id, d.status, `"${d.donation?.foodName||''}"`,
    d.donation?.quantity||'', d.donation?.unit||'',
    `"${d.donation?.donor?.name||''}"`,
    `"${(d.donation?.address||'').replace(/"/g,'""')}"`,
    d.donation?.latitude||'', d.donation?.longitude||'',
    `"${d.ngo?.name||''}"`, d.donation?.expiryHours||'',
    d.createdAt ? new Date(d.createdAt).toLocaleString() : '',
    d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : ''
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `annasetu_deliveries_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('📥 CSV exported!')
}

export default function VolunteerDeliveriesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [viewMode, setViewMode] = useState('list')

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    try {
      const res = await dispatchAPI.getAll()
      setDispatches(res.data.dispatches || [])
    } catch (error) {
      toast.error('Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  const handlePickup = async (id) => {
    try {
      await dispatchAPI.pickup(id)
      toast.success('Pickup confirmed! 🚴 Head to delivery location')
      fetchData()
    } catch { toast.error('Failed to confirm pickup') }
  }

  const handleDeliver = async (id) => {
    try {
      await dispatchAPI.deliver(id)
      toast.success('🎉 Delivery confirmed! GreenCoins earned!')
      fetchData()
    } catch { toast.error('Failed to confirm delivery') }
  }

  if (authLoading || loading) return <LoadingSpinner text="Loading deliveries..." />

  const activeDispatches = dispatches.filter(d => ['PENDING','ACCEPTED','PICKED'].includes(d.status))
  const completedDispatches = dispatches.filter(d => d.status === 'DELIVERED')

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 50%, #fff7ed 100%)' }}>
      <Navbar title="My Deliveries" />
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">

        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500'}`}>
              <List className="w-3 h-3" /> List
            </button>
            <button onClick={() => setViewMode('map')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500'}`}>
              <Map className="w-3 h-3" /> Map
            </button>
          </div>
          <button onClick={() => exportDeliveriesToCSV(dispatches)} disabled={dispatches.length === 0}
            className="flex items-center gap-1.5 bg-pink-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-pink-700 transition-all disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        {viewMode === 'map' && (
          activeDispatches.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center">
              <p className="text-4xl mb-3">🗺️</p>
              <p className="text-gray-600 font-medium">No active deliveries to show on map</p>
            </div>
          ) : <DeliveryMap dispatches={activeDispatches} />
        )}

        {viewMode === 'list' && (
          <>
            <div className="flex bg-gray-100 rounded-2xl p-1">
              {[
                { id: 'active', label: `Active (${activeDispatches.length})` },
                { id: 'completed', label: `Completed (${completedDispatches.length})` },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'active' && (
              <div className="space-y-3">
                {activeDispatches.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                    <p className="text-4xl mb-3">🚴</p>
                    <p className="text-gray-600 font-medium">No active pickups</p>
                    <p className="text-gray-400 text-sm mt-1">You will be notified when food needs pickup</p>
                  </div>
                ) : activeDispatches.map((dispatch) => (
                  <div key={dispatch.id} className="bg-white rounded-2xl shadow-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${dispatch.status === 'PICKED' ? 'bg-green-100 text-green-700' : dispatch.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {dispatch.status === 'PICKED' ? '🚴 In Transit' : dispatch.status === 'ACCEPTED' ? '✅ Accepted' : '⏳ Pending'}
                      </span>
                      {dispatch.status === 'PENDING' && <span className="text-xs text-red-500 font-medium">🔴 Urgent</span>}
                    </div>
                    <h4 className="text-gray-800 font-semibold mb-3">{dispatch.donation?.foodName}</h4>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="font-medium">Pickup from:</p>
                          <p>{dispatch.donation?.donor?.name}</p>
                          <p className="text-xs text-gray-400">{dispatch.donation?.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="font-medium">Deliver to:</p>
                          <p>{dispatch.ngo?.name || 'NGO Partner'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span>{dispatch.donation?.quantity} {dispatch.donation?.unit} · Safe for {dispatch.donation?.expiryHours} hrs</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(dispatch.status === 'PENDING' || dispatch.status === 'ACCEPTED') && (
                        <button onClick={() => handlePickup(dispatch.id)}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                          <Navigation className="w-4 h-4" /> Confirm Pickup
                        </button>
                      )}
                      {dispatch.status === 'PICKED' && (
                        <button onClick={() => handleDeliver(dispatch.id)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                          <CheckCircle className="w-4 h-4" /> Confirm Delivery
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-3">
                {completedDispatches.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                    <p className="text-4xl mb-3">🎉</p>
                    <p className="text-gray-600 font-medium">No deliveries yet</p>
                  </div>
                ) : completedDispatches.map((dispatch) => (
                  <div key={dispatch.id} className="bg-white rounded-2xl shadow-md p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <h4 className="text-gray-800 font-semibold">{dispatch.donation?.foodName}</h4>
                          <p className="text-gray-500 text-sm">{dispatch.donation?.quantity} {dispatch.donation?.unit}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✅ Done</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <p className="text-gray-500 text-xs">To: {dispatch.ngo?.name || 'NGO'}</p>
                      <p className="text-yellow-600 text-xs font-medium">+{dispatch.donation?.quantity} 🪙 GreenCoins</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
      <BottomNav />
    </div>
  )
}