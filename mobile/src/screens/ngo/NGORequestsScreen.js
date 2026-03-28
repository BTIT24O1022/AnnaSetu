import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native'
import { donationAPI, dispatchAPI } from '../../lib/api'
import DonationCard from '../../components/DonationCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import Toast from 'react-native-toast-message'

export default function NGORequestsScreen() {
  const [donations, setDonations] = useState([])
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('available')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [nearbyRes, dispRes] = await Promise.all([
        donationAPI.getNearby({ latitude: 19.0760, longitude: 72.8777, radius: 10000 }),
        dispatchAPI.getAll()
      ])
      setDonations(nearbyRes.data.donations || [])
      setDispatches(dispRes.data.dispatches || [])
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAccept = async (donation) => {
    try {
      const dispatch = dispatches.find(d => d.donationId === donation.id)
      if (!dispatch) {
        Toast.show({ type: 'error', text1: 'No dispatch found' })
        return
      }
      await dispatchAPI.accept(dispatch.id)
      Toast.show({ type: 'success', text1: 'Accepted! Volunteer notified 🚴' })
      fetchData()
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to accept' })
    }
  }

  if (loading) return <LoadingSpinner text="Loading requests..." />

  const accepted = dispatches.filter(d => d.status === 'ACCEPTED' || d.status === 'PICKED')
  const delivered = dispatches.filter(d => d.status === 'DELIVERED')

  const tabs = [
    { id: 'available', label: `Available (${donations.length})` },
    { id: 'accepted', label: `Accepted (${accepted.length})` },
    { id: 'delivered', label: `Done (${delivered.length})` },
  ]

  return (
    <View style={[styles.container, { backgroundColor: '#eff6ff' }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Requests</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
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

        {activeTab === 'available' && (
          donations.length === 0
            ? <View style={styles.empty}><Text style={styles.emptyEmoji}>🔍</Text><Text style={styles.emptyText}>No donations nearby</Text></View>
            : donations.map(d => (
              <DonationCard key={d.id} donation={d} onAction={handleAccept} actionLabel="✅ Accept Donation" actionColor="blue" />
            ))
        )}

        {activeTab === 'accepted' && (
          accepted.length === 0
            ? <View style={styles.empty}><Text style={styles.emptyEmoji}>⏳</Text><Text style={styles.emptyText}>No accepted donations yet</Text></View>
            : accepted.map(d => (
              <View key={d.id} style={styles.dispatchCard}>
                <View style={styles.dispatchHeader}>
                  <Text style={styles.dispatchFood}>{d.donation?.foodName}</Text>
                  <View style={[styles.badge, { backgroundColor: d.status === 'PICKED' ? '#f0fdf4' : '#eff6ff' }]}>
                    <Text style={[styles.badgeText, { color: d.status === 'PICKED' ? '#16a34a' : '#2563eb' }]}>
                      {d.status === 'PICKED' ? '🚴 On way' : '✅ Accepted'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dispatchInfo}>From: {d.donation?.donor?.name}</Text>
                <Text style={styles.dispatchInfo}>Volunteer: {d.volunteer?.name || 'Being assigned...'}</Text>
                <Text style={styles.dispatchInfo}>{d.donation?.quantity} {d.donation?.unit}</Text>
              </View>
            ))
        )}

        {activeTab === 'delivered' && (
          delivered.length === 0
            ? <View style={styles.empty}><Text style={styles.emptyEmoji}>🎉</Text><Text style={styles.emptyText}>No deliveries yet</Text></View>
            : delivered.map(d => (
              <View key={d.id} style={styles.dispatchCard}>
                <View style={styles.dispatchHeader}>
                  <Text style={styles.dispatchFood}>{d.donation?.foodName}</Text>
                  <View style={[styles.badge, { backgroundColor: '#f9fafb' }]}>
                    <Text style={[styles.badgeText, { color: '#6b7280' }]}>✅ Delivered</Text>
                  </View>
                </View>
                <Text style={styles.dispatchInfo}>{d.donation?.quantity} {d.donation?.unit} received</Text>
                <Text style={styles.dispatchInfo}>From: {d.donation?.donor?.name}</Text>
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
  tab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10,
  },
  tabActive: { backgroundColor: '#ffffff' },
  tabText: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  tabTextActive: { color: '#2563eb', fontWeight: '600' },
  scroll: { flex: 1, paddingHorizontal: 12 },
  empty: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: '#6b7280', fontSize: 13 },
  dispatchCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 14,
    marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  dispatchHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dispatchFood: { fontSize: 14, fontWeight: '600', color: '#1f2937', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  dispatchInfo: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
})