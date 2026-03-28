import { useRouter, usePathname } from 'next/navigation'
import { Home, Map, BarChart3, List, Navigation, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const donorLinks = [
    { href: '/donor', icon: Home, label: 'Home' },
    { href: '/donor/add-food', icon: Plus, label: 'Donate' },
    { href: '/map', icon: Map, label: 'Map' },
    { href: '/donor/impact', icon: BarChart3, label: 'Impact' },
  ]

  const ngoLinks = [
    { href: '/ngo', icon: Home, label: 'Home' },
    { href: '/ngo/requests', icon: List, label: 'Requests' },
    { href: '/map', icon: Map, label: 'Map' },
    { href: '/donor/impact', icon: BarChart3, label: 'Impact' },
  ]

  const volunteerLinks = [
    { href: '/volunteer', icon: Home, label: 'Home' },
    { href: '/volunteer/deliveries', icon: Navigation, label: 'Deliveries' },
    { href: '/map', icon: Map, label: 'Map' },
    { href: '/donor/impact', icon: BarChart3, label: 'Impact' },
  ]

  const links =
    user?.role === 'DONOR' ? donorLinks
    : user?.role === 'NGO' ? ngoLinks
    : volunteerLinks

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto px-4 py-3">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex flex-col items-center gap-1 min-w-0"
            >
              <div className={`p-2 rounded-xl transition-colors ${
                isActive ? 'bg-green-100' : 'hover:bg-gray-100'
              }`}>
                <Icon className={`w-5 h-5 ${
                  isActive ? 'text-green-600' : 'text-gray-500'
                }`} />
              </div>
              <span className={`text-xs ${
                isActive ? 'text-green-600 font-medium' : 'text-gray-500'
              }`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}