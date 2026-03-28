import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native'
import { dispatchAPI } from '../../lib/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Toast from 'react-native-toast-message'
import { Ionicons } from '@expo/vector-icons'

export default function DeliveriesScreen() {
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await dispatchAPI.getAll()
      setDispatches(res.data.dispatches || [])
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

  if (loading) return <LoadingSpinner text="Loading deliveries..." />

  const active = dispatches.filter(
    d => d.status === 'PENDING' || d.status === 'ACCEPTED' || d.status === 'PICKED'
  )
  const completed = dispatches.filter(d => d.status === 'DELIVERED')

  return (
    <View style={[styles.container, { backgroundColor: '#fdf2f8' }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Deliveries</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {[
          { id: 'active', label: `Active (${active.length})` },
          { id: 'completed', label: `Completed (${completed.length})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
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

        {activeTab === 'active' && (
          active.length === 0
            ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🚴</Text>
                <Text style={styles.emptyTitle}>No active pickups</Text>
                <Text style={styles.emptySubtitle}>
                  You will be notified when food needs pickup
                </Text>
              </View>
            )
            : active.map((dispatch) => (
              <View key={dispatch.id} style={styles.card}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, {
                    backgroundColor:
                      dispatch.status === 'PICKED' ? '#f0fdf4'
                      : dispatch.status === 'ACCEPTED' ? '#eff6ff'
                      : '#fff7ed'
                  }]}>
                    <Text style={[styles.statusText, {
                      color:
                        dispatch.status === 'PICKED' ? '#16a34a'
                        : dispatch.status === 'ACCEPTED' ? '#2563eb'
                        : '#ea580c'
                    }]}>
                      {dispatch.status === 'PICKED' ? '🚴 In Transit'
                        : dispatch.status === 'ACCEPTED' ? '✅ Accepted'
                        : '⏳ Pending'}
                    </Text>
                  </View>
                  {dispatch.status === 'PENDING' && (
                    <Text style={styles.urgentText}>🔴 Urgent</Text>
                  )}
                </View>

                <Text style={styles.foodName}>{dispatch.donation?.foodName}</Text>

                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={14} color="#22c55e" />
                    <View>
                      <Text style={styles.infoLabel}>Pickup from:</Text>
                      <Text style={styles.infoVal}>{dispatch.donation?.donor?.name}</Text>
                      <Text style={styles.infoSub}>{dispatch.donation?.address}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={14} color="#3b82f6" />
                    <View>
                      <Text style={styles.infoLabel}>Deliver to:</Text>
                      <Text style={styles.infoVal}>{dispatch.ngo?.name || 'NGO'}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time" size={14} color="#f97316" />
                    <Text style={styles.infoVal}>
                      {dispatch.donation?.quantity} {dispatch.donation?.unit}
                      {' '}· {dispatch.donation?.expiryHours} hrs safe
                    </Text>
                  </View>
                </View>

                <View style={styles.btnRow}>
                  {(dispatch.status === 'PENDING' || dispatch.status === 'ACCEPTED') && (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: '#ea580c' }]}
                      onPress={() => handlePickup(dispatch.id)}
                    >
                      <Ionicons name="navigate" size={14} color="#fff" />
                      <Text style={styles.btnText}>Confirm Pickup</Text>
                    </TouchableOpacity>
                  )}
                  {dispatch.status === 'PICKED' && (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: '#16a34a' }]}
                      onPress={() => handleDeliver(dispatch.id)}
                    >
                      <Ionicons name="checkmark-circle" size={14} color="#fff" />
                      <Text style={styles.btnText}>Confirm Delivery</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
        )}

        {activeTab === 'completed' && (
          completed.length === 0
            ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎉</Text>
                <Text style={styles.emptyTitle}>No deliveries yet</Text>
                <Text style={styles.emptySubtitle}>
                  Complete your first delivery to see it here
                </Text>
              </View>
            )
            : completed.map((dispatch) => (
              <View key={dispatch.id} style={[styles.card, { backgroundColor: '#f9fafb' }]}>
                <View style={styles.completedHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 24 }}>🎉</Text>
                    <View>
                      <Text style={styles.foodName}>{dispatch.donation?.foodName}</Text>
                      <Text style={styles.infoVal}>
                        {dispatch.donation?.quantity} {dispatch.donation?.unit}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.greenCoins}>
                    <Text style={styles.greenCoinsText}>
                      +{dispatch.donation?.quantity} 🪙
                    </Text>
                    <Text style={styles.greenCoinsLabel}>earned</Text>
                  </View>
                </View>
                <Text style={styles.infoVal}>To: {dispatch.ngo?.name || 'NGO'}</Text>
              </View>
            ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#ffffff', paddingHorizontal: 20,
    paddingTop: 56, paddingBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#f3f4f6',
    margin: 12, borderRadius: 14, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#ffffff' },
  tabText: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  tabTextActive: { color: '#db2777', fontWeight: '600' },
  scroll: { flex: 1, paddingHorizontal: 12 },
  empty: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 14,
    marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  urgentText: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
  foodName: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 10 },
  infoBox: { gap: 6, marginBottom: 10 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '500' },
  infoVal: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
  infoSub: { fontSize: 10, color: '#9ca3af' },
  btnRow: { gap: 8 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 12, borderRadius: 12,
  },
  btnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  completedHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  greenCoins: { alignItems: 'flex-end' },
  greenCoinsText: { fontSize: 13, fontWeight: '700', color: '#ca8a04' },
  greenCoinsLabel: { fontSize: 10, color: '#9ca3af' },
})