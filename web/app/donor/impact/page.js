'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { impactAPI } from '../../../lib/api'
import Navbar from '../../../components/Navbar'
import BottomNav from '../../../components/BottomNav'
import LoadingSpinner from '../../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

export default function ImpactPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [impact, setImpact] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    fetchData()
  }, [user, authLoading])

  const fetchData = async () => {
    try {
      const [impRes, lbRes, stRes] = await Promise.all([
        impactAPI.getMyImpact(),
        impactAPI.getLeaderboard(),
        impactAPI.getStats()
      ])
      setImpact(impRes.data.impact)
      setLeaderboard(lbRes.data.leaderboard || [])
      setStats(stRes.data.stats)
    } catch (error) {
      toast.error('Failed to load impact data')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) return <LoadingSpinner text="Loading impact data..." />

  const rankEmoji = ['🥇', '🥈', '🥉']

  return (
    <div className="page-container pb-24">
      <Navbar title="Impact Dashboard" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Your Impact 🌍</h2>
          <p className="text-gray-500 mt-1">Every meal you donate makes a difference</p>
        </div>

        {/* My Impact Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <p className="text-3xl font-bold">{impact?.totalMeals || 0}</p>
            <p className="text-green-100 text-sm mt-1">🍱 Total Meals Saved</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <p className="text-3xl font-bold">{impact?.totalCo2 || '0.00'}</p>
            <p className="text-orange-100 text-sm mt-1">🌿 kg CO₂ Saved</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-3xl font-bold">{impact?.totalDonations || 0}</p>
            <p className="text-blue-100 text-sm mt-1">📦 Total Donations</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-4 text-white">
            <p className="text-3xl font-bold">{impact?.greenCoins || 0}</p>
            <p className="text-yellow-100 text-sm mt-1">🪙 GreenCoins Earned</p>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            📅 Weekly Progress
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Weekly Meals</span>
                <span className="text-green-600 font-medium">
                  {impact?.weeklyMeals || 0} meals
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
                  style={{
                    width: `${Math.min(100, ((impact?.weeklyMeals || 0) / 100) * 100)}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Monthly Meals</span>
                <span className="text-orange-600 font-medium">
                  {impact?.monthlyMeals || 0} meals
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full"
                  style={{
                    width: `${Math.min(100, ((impact?.monthlyMeals || 0) / 500) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              🌱 Platform Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalMealsSaved || 0}
                </p>
                <p className="text-xs text-green-700 mt-1">Total Meals Saved</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {stats.deliveredDonations || 0}
                </p>
                <p className="text-xs text-orange-700 mt-1">Deliveries Done</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalUsers || 0}
                </p>
                <p className="text-xs text-blue-700 mt-1">Total Users</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalCo2Saved || '0.00'}
                </p>
                <p className="text-xs text-purple-700 mt-1">kg CO₂ Saved</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            🏆 Top Donors Leaderboard
          </h3>
          {leaderboard.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-4xl mb-2">🏆</p>
              <p className="text-gray-500 text-sm">No entries yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    entry.name === user?.name
                      ? 'bg-green-50 border-2 border-green-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">
                    {rankEmoji[index] || `#${index + 1}`}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium text-sm">
                      {entry.name}
                      {entry.name === user?.name && (
                        <span className="ml-2 text-xs text-green-600">(You)</span>
                      )}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {entry.totalMeals} meals · {entry.co2Saved} kg CO₂
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-600 font-bold text-sm">
                      🪙 {entry.greenCoins}
                    </p>
                    <p className="text-gray-400 text-xs">coins</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GreenCoin Info */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">
            🪙 What are GreenCoins?
          </h4>
          <p className="text-xs text-yellow-700 leading-relaxed">
            You earn 1 GreenCoin for every meal you donate and deliver.
            GreenCoins show your impact rank on the leaderboard and can be
            used for rewards in future updates!
          </p>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}