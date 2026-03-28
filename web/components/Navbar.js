'use client'

import { useAuth } from '../context/AuthContext'
import { LogOut, Leaf } from 'lucide-react'

export default function Navbar({ title }) {
  const { user, logout } = useAuth()

  const roleBadge = {
    DONOR: { label: '🍽️ Donor', bg: 'bg-green-100 text-green-700' },
    NGO: { label: '🏢 NGO', bg: 'bg-blue-100 text-blue-700' },
    VOLUNTEER: { label: '❤️ Volunteer', bg: 'bg-pink-100 text-pink-700' },
  }

  const badge = roleBadge[user?.role] || { label: 'User', bg: 'bg-gray-100 text-gray-700' }

  return (
    <div className="bg-white shadow-sm px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800">
              {title || 'AnnaSetu'}
            </h1>
            <p className="text-xs text-gray-500">अन्न सेतु</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${badge.bg}`}>
            {badge.label}
          </span>
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  )
}