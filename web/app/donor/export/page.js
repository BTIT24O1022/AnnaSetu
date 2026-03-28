'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { donationAPI, impactAPI } from '../../../lib/api'
import Navbar from '../../../components/Navbar'
import BottomNav from '../../../components/BottomNav'
import LoadingSpinner from '../../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { ArrowLeft, Download } from 'lucide-react'

export default function ExportPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [donations, setDonations] = useState([])
  const [impact, setImpact] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
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
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // ─── Export Donations CSV ──────────────────────
  const exportDonationsCSV = () => {
    if (donations.length === 0) {
      toast.error('No donations to export')
      return
    }

    const headers = [
      'Date', 'Food Name', 'Quantity', 'Unit',
      'Diet Type', 'Safety Score', 'Expiry Hours',
      'Address', 'Status', 'CO2 Saved (kg)'
    ]

    const rows = donations.map(d => [
      new Date(d.createdAt).toLocaleDateString('en-IN'),
      d.foodName,
      d.quantity,
      d.unit,
      d.dietType,
      d.foodSafeScore,
      d.expiryHours,
      `"${d.address}"`,
      d.status,
      d.co2Saved
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    downloadCSV(csvContent, `annasetu-donations-${Date.now()}.csv`)
    toast.success('Donations CSV downloaded! 📊')
  }

  // ─── Export Impact CSV ─────────────────────────
  const exportImpactCSV = () => {
    if (!impact) {
      toast.error('No impact data to export')
      return
    }

    const headers = [
      'Metric', 'Value'
    ]

    const rows = [
      ['Total Meals Saved', impact.totalMeals || 0],
      ['Total CO2 Saved (kg)', impact.totalCo2 || 0],
      ['Total Donations', impact.totalDonations || 0],
      ['GreenCoins Earned', impact.greenCoins || 0],
      ['Weekly Meals', impact.weeklyMeals || 0],
      ['Monthly Meals', impact.monthlyMeals || 0],
      ['Donor Name', user?.name || ''],
      ['Donor Email', user?.email || ''],
      ['Export Date', new Date().toLocaleDateString('en-IN')],
    ]

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    downloadCSV(csvContent, `annasetu-impact-report-${Date.now()}.csv`)
    toast.success('Impact report CSV downloaded! 🌱')
  }

  // ─── Export Full Report CSV ────────────────────
  const exportFullReportCSV = () => {
    if (donations.length === 0) {
      toast.error('No data to export')
      return
    }

    // Summary section
    const summaryHeaders = ['IMPACT SUMMARY']
    const summaryRows = [
      [''],
      ['Donor Name', user?.name || ''],
      ['Export Date', new Date().toLocaleDateString('en-IN')],
      ['Total Meals Saved', impact?.totalMeals || 0],
      ['Total CO2 Saved (kg)', impact?.totalCo2 || 0],
      ['GreenCoins Earned', impact?.greenCoins || 0],
      ['Total Donations', donations.length],
      ['Delivered', donations.filter(d => d.status === 'DELIVERED').length],
      ['Pending', donations.filter(d => d.status === 'LISTED').length],
      [''],
      ['DONATION HISTORY'],
      [''],
      ['Date', 'Food Name', 'Qty', 'Unit', 'Diet', 'Score', 'Status', 'CO2 Saved'],
    ]

    const donationRows = donations.map(d => [
      new Date(d.createdAt).toLocaleDateString('en-IN'),
      d.foodName,
      d.quantity,
      d.unit,
      d.dietType,
      d.foodSafeScore,
      d.status,
      d.co2Saved
    ])

    const allRows = [...summaryRows, ...donationRows]
    const csvContent = allRows.map(r => r.join(',')).join('\n')

    downloadCSV(csvContent, `annasetu-full-report-${Date.now()}.csv`)
    toast.success('Full report downloaded! 📋')
  }

  // ─── Helper: Download CSV ──────────────────────
  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (authLoading || loading) return <LoadingSpinner text="Loading export data..." />

  const delivered = donations.filter(d => d.status === 'DELIVERED').length
  const listed = donations.filter(d => d.status === 'LISTED').length

  return (
    <div className="page-container pb-24">
      <Navbar title="Export Data" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Export Reports 📊</h2>
          <p className="text-gray-500 mt-1">
            Download your donation data as CSV files
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <p className="text-2xl font-bold text-green-600">
              {impact?.totalMeals || 0}
            </p>
            <p className="text-xs text-green-700 mt-1">Total Meals Saved</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <p className="text-2xl font-bold text-orange-600">
              {donations.length}
            </p>
            <p className="text-xs text-orange-700 mt-1">Total Donations</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">
              {impact?.totalCo2 || '0.00'}
            </p>
            <p className="text-xs text-blue-700 mt-1">kg CO₂ Saved</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-600">
              {impact?.greenCoins || 0}
            </p>
            <p className="text-xs text-yellow-700 mt-1">GreenCoins Earned</p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-800">
            Download Reports
          </h3>

          {/* Donations CSV */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">
                  🍱 Donations History
                </p>
                <p className="text-xs text-gray-500">
                  All {donations.length} donations with food name, quantity,
                  diet type, safety score, status and CO₂ saved
                </p>
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {delivered} delivered
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {listed} active
                  </span>
                </div>
              </div>
              <button
                onClick={exportDonationsCSV}
                className="ml-3 flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          {/* Impact Report CSV */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">
                  🌱 Impact Report
                </p>
                <p className="text-xs text-gray-500">
                  Your complete impact summary — meals saved, CO₂ reduction,
                  GreenCoins, weekly and monthly stats
                </p>
              </div>
              <button
                onClick={exportImpactCSV}
                className="ml-3 flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          {/* Full Report CSV */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">
                  📋 Full Report
                </p>
                <p className="text-xs text-gray-500">
                  Combined report with impact summary + complete donation
                  history in one file. Perfect for sharing with organisations.
                </p>
                <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <button
                onClick={exportFullReportCSV}
                className="ml-3 flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-600 transition-colors flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Donation preview table */}
        {donations.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              Recent Donations Preview
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-3 py-2 text-gray-600 font-medium">Food</th>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium">Qty</th>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium">Diet</th>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium">Status</th>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium">CO₂</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.slice(0, 5).map((d, i) => (
                      <tr
                        key={d.id}
                        className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-3 py-2 text-gray-800 font-medium truncate max-w-24">
                          {d.foodName}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {d.quantity} {d.unit}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded-full ${
                            d.dietType === 'VEG'
                              ? 'bg-green-100 text-green-700'
                              : d.dietType === 'HALAL'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {d.dietType}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded-full ${
                            d.status === 'DELIVERED'
                              ? 'bg-gray-100 text-gray-600'
                              : d.status === 'LISTED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {d.co2Saved}kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {donations.length > 5 && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
                  Showing 5 of {donations.length} — download CSV for full data
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  )
}