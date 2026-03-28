import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { dispatchAPI, impactAPI } from '../../lib/api'
import StatCard from '../../components/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import Toast from 'react-native-toast-message'
import { Ionicons } from '@expo/vector-icons'

export default function VolunteerHomeScreen({ navigation }) {
  const { user, logout } = useAuth()
  const [dispatches, setDispatches] = useState([])
  const [impact, setImpact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [dispRes, impRes] = await Promise.all([
        dispatchAPI.getAll(),
        impactAPI.getMyImpact()
      ])
      setDispatches(dispRes.data.dispatches || [])
      setImpact(impRes.data.impact || null)
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handlePickup = async (id) => {
    try {
      await dispatchAPI.pickup(id)
      Toast.show({ type: 'success', text1: 'Pickup confirmed! 🚴' })
      fetchData()
    } catch {
      Toast.show({ type: 'error', text1: 'Failed' })
    }
  }

  const handleDeliver = async (id) => {
    try {
      await dispatchAPI.deliver(id)
      Toast.show({ type: 'success', text1: '🎉 Delivered! GreenCoins earned!' })
      fetchData()
    } catch {
      Toast.show({ type: 'error', text1: 'Failed' })
    }
  }

  if (loading) return <LoadingSpinner text="Loading volunteer dashboard..." />

  const active = dispatches.filter(
    d => d.status === 'PENDING' || d.status === 'ACCEPTED' || d.status === 'PICKED'
  )
  const completed = dispatches.filter(d => d.status === 'DELIVERED')

  return (
    <View style={[styles.container, { backgroundColor: '#fdf2f8' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.roleBadge, { backgroundColor: '#fce7f3' }]}>
            <Text style={[styles.roleBadgeText, { color: '#db2777' }]}>❤️ Volunteer</Text>
          </View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}! ❤️</Text>
          <Text style={styles.subGreeting}>
            {active.length} active pickup{active.length !== 1 ? 's' : ''} assigned
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true)
            fetchData()
          }} />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Active" value={active.length} color="pink" icon="🚴" />
          <StatCard label="Delivered" value={completed.length} color="green" icon="✅" />
          <StatCard label="GreenCoins" value={impact?.greenCoins || 0} color="yellow" icon="🪙" />
        </View>

        {/* Active Pickups */}
        <Text style={styles.sectionTitle}>My Assigned Pickups</Text>

        {active.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🚴</Text>
            <Text style={styles.emptyTitle}>No pickups yet</Text>
            <Text style={styles.emptySubtitle}>You will be notified when food needs pickup</Text>
          </View>
        ) : (
          active.map((dispatch) => (
            <View key={dispatch.id} style={styles.dispatchCard}>
              {dispatch.status === 'PENDING' && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>🔴 Urgent pickup needed</Text>
                </View>
              )}
              <Text style={styles.foodName}>{dispatch.donation?.foodName}</Text>
              <Text style={styles.infoText}>📍 From: {dispatch.donation?.donor?.name}</Text>
              <Text style={styles.infoText}>🏠 To: {dispatch.ngo?.name || 'NGO Partner'}</Text>
              <Text style={styles.infoText}>
                📦 {dispatch.donation?.quantity} {dispatch.donation?.unit}
              </Text>

              <View style={styles.btnRow}>
                {(dispatch.status === 'PENDING' || dispatch.status === 'ACCEPTED') && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#ea580c' }]}
                    onPress={() => handlePickup(dispatch.id)}
                  >
                    <Text style={styles.actionBtnText}>🚴 Confirm Pickup</Text>
                  </TouchableOpacity>
                )}
                {dispatch.status === 'PICKED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
                    onPress={() => handleDeliver(dispatch.id)}
                  >
                    <Text style={styles.actionBtnText}>✅ Confirm Delivery</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Completed ✅</Text>
            {completed.slice(0, 3).map((d) => (
              <View key={d.id} style={[styles.dispatchCard, { backgroundColor: '#f9fafb' }]}>
                <View style={styles.completedRow}>
                  <Text style={styles.foodName}>{d.donation?.foodName}</Text>
                  <Text style={{ color: '#ca8a04', fontWeight: '600', fontSize: 12 }}>
                    +{d.donation?.quantity} 🪙
                  </Text>
                </View>
                <Text style={styles.infoText}>
                  {d.donation?.quantity} {d.donation?.unit} delivered to {d.ngo?.name}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#ffffff', paddingHorizontal: 20,
    paddingTop: 56, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  headerLeft: { flex: 1 },
  roleBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  subGreeting: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  logoutBtn: { padding: 8 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 10 },
  emptyBox: {
    backgroundColor: '#ffffff', borderRadius: 16,
    padding: 28, alignItems: 'center',
  },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  dispatchCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 14,
    marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  urgentBadge: {
    backgroundColor: '#fef2f2', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8,
  },
  urgentText: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
  foodName: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 6 },
  infoText: { fontSize: 12, color: '#6b7280', marginBottom: 3 },
  btnRow: { marginTop: 10 },
  actionBtn: {
    padding: 12, borderRadius: 12, alignItems: 'center',
  },
  actionBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  completedRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
})