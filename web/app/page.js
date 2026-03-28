'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function SplashPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    const timer = setTimeout(() => {
      if (user) {
        if (user.role === 'DONOR') router.push('/donor')
        else if (user.role === 'NGO') router.push('/ngo')
        else if (user.role === 'VOLUNTEER') router.push('/volunteer')
      } else {
        router.push('/login')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex flex-col items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <span className="text-5xl">🌱</span>
        </div>
        <h1 className="text-5xl font-bold text-white mb-2">AnnaSetu</h1>
        <p className="text-green-100 text-xl mb-1">अन्न सेतु</p>
        <p className="text-green-200 text-sm">Bridging Food. Reducing Waste.</p>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-3">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-green-200 text-xs">Loading...</p>
      </div>
    </div>
  )
}