export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin border-t-green-500"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl">🌱</span>
        </div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">{text}</p>
    </div>
  )
}