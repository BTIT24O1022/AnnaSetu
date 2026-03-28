'use client'

import { Clock, MapPin, Users } from 'lucide-react'

const dietColors = {
  VEG: 'bg-green-100 text-green-700',
  NONVEG: 'bg-red-100 text-red-700',
  JAIN: 'bg-yellow-100 text-yellow-700',
  HALAL: 'bg-blue-100 text-blue-700',
  DIABETIC_SAFE: 'bg-purple-100 text-purple-700',
}

const statusColors = {
  LISTED: 'bg-green-100 text-green-700',
  MATCHED: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-red-100 text-red-700',
}

export default function DonationCard({ donation, onAction, actionLabel, actionColor }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-gray-800 font-semibold text-base">
            {donation.foodName}
          </h3>
          <p className="text-gray-500 text-sm mt-0.5">
            {donation.donor?.name || donation.donor_name || 'Anonymous'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${dietColors[donation.dietType] || 'bg-gray-100 text-gray-700'}`}>
            {donation.dietType}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[donation.status] || 'bg-gray-100 text-gray-700'}`}>
            {donation.status}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4 text-green-500" />
          <span>{donation.quantity} {donation.unit || 'plates'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-orange-500" />
          <span className="truncate">{donation.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>Safe for {donation.expiryHours} hours</span>
          {donation.distance && (
            <span className="ml-auto text-green-600 font-medium">
              📍 {donation.distance}
            </span>
          )}
        </div>
      </div>

      {/* FoodSafe Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">FoodSafe Score</span>
          <span className="text-xs font-medium text-green-600">
            {donation.foodSafeScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
            style={{ width: `${donation.foodSafeScore}%` }}
          />
        </div>
      </div>

      {/* Action Button */}
      {onAction && actionLabel && (
        <button
          onClick={() => onAction(donation)}
          className={`w-full py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:opacity-90 active:scale-95 ${
            actionColor === 'blue'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
              : actionColor === 'orange'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600'
              : 'bg-gradient-to-r from-green-500 to-green-600'
          }`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}