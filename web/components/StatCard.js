export default function StatCard({ label, value, color, icon }) {
  const colors = {
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    blue: 'from-blue-500 to-blue-600',
    pink: 'from-pink-500 to-pink-600',
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md">
      <div className={`w-10 h-10 bg-gradient-to-br ${colors[color] || colors.green} rounded-xl mb-3 flex items-center justify-center`}>
        <span className="text-white text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}