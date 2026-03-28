import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { donationAPI, impactAPI } from '../../lib/api'
import StatCard from '../../components/StatCard'
import DonationCard from '../../components/DonationCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import Toast from 'react-native-toast-message'
import { Ionicons } from '@expo/vector-icons'

export default function DonorHomeScreen({ navigation }) {
  const { user, logout } = useAuth()
  const [donations, setDonations] = useState([])
  const [impact, setImpact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [donRes, impRes] = await Promise.all([
        donationAPI.getMine(),
        impactAPI.getMyImpact()
      ])
      setDonations(donRes.data.donations || [])
      setImpact(impRes.data.impact || null)
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to load data' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCancel = async (donation) => {
    try {
      await donationAPI.cancel(donation.id)
      Toast.show({ type: 'success', text1: 'Donation cancelled' })
      fetchData()
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to cancel' })
    }
  }

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>🍽️ Donor</Text>
          </View>
          <Text style={styles.greeting}>
            Good Morning, {user?.name?.split(' ')[0]}! 👋
          </Text>
          <Text style={styles.subGreeting}>Share your surplus food today</Text>
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
          <StatCard label="Meals Donated" value={impact?.totalMeals || 0} color="green" icon="🍱" />
          <StatCard label="CO₂ Saved (kg)" value={impact?.totalCo2 || '0'} color="orange" icon="🌿" />
          <StatCard label="GreenCoins" value={impact?.greenCoins || 0} color="yellow" icon="🪙" />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
            onPress={() => navigation.navigate('Donate')}
          >
            <Text style={styles.actionEmoji}>🍽️</Text>
            <Text style={styles.actionText}>Donate Food</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ea580c' }]}
            onPress={() => navigation.navigate('Impact')}
          >
            <Text style={styles.actionEmoji}>📊</Text>
            <Text style={styles.actionText}>My Impact</Text>
          </TouchableOpacity>
        </View>

        {/* My Donations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Donations</Text>
          <Text style={styles.sectionCount}>{donations.length} total</Text>
        </View>

        {donations.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🍱</Text>
            <Text style={styles.emptyTitle}>No donations yet</Text>
            <Text style={styles.emptySubtitle}>List your first food donation!</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('Donate')}
            >
              <Text style={styles.emptyBtnText}>Donate Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          donations.map((donation) => (
            <DonationCard
              key={donation.id}
              donation={donation}
              onAction={donation.status === 'LISTED' ? handleCancel : null}
              actionLabel={donation.status === 'LISTED' ? '❌ Cancel' : null}
              actionColor="orange"
            />
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: { flex: 1 },
  roleBadge: {
    backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '600', color: '#16a34a' },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  subGreeting: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  logoutBtn: { padding: 8 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 10 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionCount: { fontSize: 12, color: '#9ca3af' },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1, padding: 16, borderRadius: 16,
    alignItems: 'center', gap: 6,
  },
  actionEmoji: { fontSize: 28 },
  actionText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  emptyBox: {
    backgroundColor: '#ffffff', borderRadius: 16,
    padding: 28, alignItems: 'center',
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: '#9ca3af', marginBottom: 14 },
  emptyBtn: {
    backgroundColor: '#16a34a', paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 12,
  },
  emptyBtnText: { color: '#ffffff', fontWeight: '600' },
})