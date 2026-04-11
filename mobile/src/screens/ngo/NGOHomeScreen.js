import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { donationAPI, dispatchAPI } from '../../lib/api'
import StatCard from '../../components/StatCard'
import DonationCard from '../../components/DonationCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import Toast from 'react-native-toast-message'
import { Ionicons } from '@expo/vector-icons'

export default function NGOHomeScreen({ navigation }) {
  const { user, logout } = useAuth()
  const [donations, setDonations] = useState([])
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const lat = user?.latitude || 20.5937
      const lng = user?.longitude || 78.9629
      const radius = 500000 // 500 km
      
      const [nearbyRes, dispRes] = await Promise.all([
        donationAPI.getNearby({ latitude: lat, longitude: lng, radius }).catch(() => ({ data: { donations: [] } })),
        dispatchAPI.getAll().catch(() => ({ data: { dispatches: [] } }))
      ])
      
      let allDonations = nearbyRes?.data?.donations || []
      if (allDonations.length === 0) {
        const allRes = await donationAPI.getAll({ status: 'LISTED' }).catch(() => ({ data: { donations: [] } }))
        allDonations = allRes?.data?.donations || []
      }
      
      setDonations(allDonations)
      setDispatches(dispRes?.data?.dispatches || [])
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load data' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAccept = async (donation) => {
    try {
      let dispatch = dispatches.find(d => d.donationId === donation.id)
      if (!dispatch) {
        const autoRes = await dispatchAPI.autoDispatch(donation.id);
        if (autoRes.data && autoRes.data.dispatch) {
          dispatch = autoRes.data.dispatch;
        } else {
          Toast.show({ type: 'error', text1: 'No dispatch found and auto-dispatch failed' })
          return;
        }
      }
      
      await dispatchAPI.accept(dispatch.id)
      Toast.show({ type: 'success', text1: 'Accepted! Volunteer notified 🚴' })
      fetchData()
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to accept' })
    }
  }

  if (loading) return <LoadingSpinner text="Loading NGO dashboard..." />

  const pending = dispatches.filter(d => d.status === 'PENDING').length
  const accepted = dispatches.filter(d => d.status === 'ACCEPTED' || d.status === 'PICKED').length

  return (
    <View style={[styles.container, { backgroundColor: '#eff6ff' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.roleBadge, { backgroundColor: '#dbeafe' }]}>
            <Text style={[styles.roleBadgeText, { color: '#2563eb' }]}>🏢 NGO</Text>
          </View>
          <Text style={styles.greeting}>Welcome, {user?.name?.split(' ')[0]}! 🏢</Text>
          <Text style={styles.subGreeting}>
            {donations.length} food donations available nearby
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true)
            fetchData()
          }} />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Pending" value={pending} color="orange" icon="⏳" />
          <StatCard label="Accepted" value={accepted} color="blue" icon="✅" />
          <StatCard label="Available" value={donations.length} color="green" icon="🍱" />
        </View>

        {/* Nearby Donations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Nearby</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
            <Text style={[styles.seeAll, { color: '#2563eb' }]}>View All →</Text>
          </TouchableOpacity>
        </View>

        {donations.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No nearby donations</Text>
            <Text style={styles.emptySubtitle}>Check back soon!</Text>
          </View>
        ) : (
          donations.slice(0, 3).map((donation) => (
            <DonationCard
              key={donation.id}
              donation={donation}
              onAction={handleAccept}
              actionLabel="✅ Accept Donation"
              actionColor="blue"
            />
          ))
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
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  seeAll: { fontSize: 13, fontWeight: '500' },
  emptyBox: {
    backgroundColor: '#ffffff', borderRadius: 16,
    padding: 28, alignItems: 'center',
  },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
})