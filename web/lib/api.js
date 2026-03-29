import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://annasetu-47ci.onrender.com/api'
// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auto attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('annasetu_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── AUTH ──────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
}

// ─── DONATIONS ─────────────────────────────────────
export const donationAPI = {
  create: (data) => api.post('/donations', data),
  getAll: (params) => api.get('/donations', { params }),
  getNearby: (params) => api.get('/donations/nearby', { params }),
  getMine: () => api.get('/donations/my/donations'),
  getById: (id) => api.get(`/donations/${id}`),
  updateStatus: (id, status) => api.patch(`/donations/${id}/status`, { status }),
  cancel: (id) => api.delete(`/donations/${id}`),
}

// ─── DISPATCH ──────────────────────────────────────
export const dispatchAPI = {
  autoDispatch: (donationId) => api.post(`/dispatch/auto/${donationId}`),
  accept: (id) => api.patch(`/dispatch/${id}/accept`),
  pickup: (id) => api.patch(`/dispatch/${id}/pickup`),
  deliver: (id) => api.patch(`/dispatch/${id}/deliver`),
  getAll: () => api.get('/dispatch'),
}

// ─── IMPACT ────────────────────────────────────────
export const impactAPI = {
  getMyImpact: () => api.get('/impact/me'),
  getLeaderboard: () => api.get('/impact/leaderboard'),
  getStats: () => api.get('/impact/stats'),
}

// ─── HUNGER PINS ───────────────────────────────────
export const hungerPinAPI = {
  create: (data) => api.post('/hungerpins', data),
  getAll: () => api.get('/hungerpins'),
}

export default api