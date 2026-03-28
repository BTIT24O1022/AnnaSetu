import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ✅ FIXED: Only ONE BASE_URL — change this to your PC's IP
const BASE_URL = 'http://192.168.1.5:5000/api'
// Find your IP: run "ipconfig" on Windows, use the IPv4 address
// For Android emulator use: http://10.0.2.2:5000/api

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Auto attach token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('annasetu_token')
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