import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet, RefreshControl
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { impactAPI } from '../../lib/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Toast from 'react-native-toast-message'

export default function ImpactScreen() {
  const { user } = useAuth()
  const [impact, setImpact] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [impRes, lbRes, stRes] = await Promise.all([
        impactAPI.getMyImpact(),
        impactAPI.getLeaderboard(),
        impactAPI.getStats()
      ])
      setImpact(impRes.data.impact)
      setLeaderboard(lbRes.data.leaderboard || [])
      setStats(stRes.data.stats)
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load impact' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading impact..." />

  const rankEmoji = ['🥇', '🥈', '🥉']

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true)
          fetchData()
        }} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Impact 🌍</Text>
        <Text style={styles.headerSub}>Every meal you donate makes a difference</Text>
      </View>

      <View style={styles.content}>

        {/* Impact Cards */}
        <View style={styles.cardGrid}>
          {[
            { val: impact?.totalMeals || 0, label: '🍱 Total Meals', bg: '#16a34a' },
            { val: impact?.totalCo2 || '0.00', label: '🌿 kg CO₂ Saved', bg: '#ea580c' },
            { val: impact?.totalDonations || 0, label: '📦 Donations', bg: '#2563eb' },
            { val: impact?.greenCoins || 0, label: '🪙 GreenCoins', bg: '#ca8a04' },
          ].map((item, i) => (
            <View key={i} style={[styles.impactCard, { backgroundColor: item.bg }]}>
              <Text style={styles.impactVal}>{item.val}</Text>
              <Text style={styles.impactLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Platform Stats */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌱 Platform Stats</Text>
            <View style={styles.statsGrid}>
              {[
                { val: stats.totalMealsSaved || 0, label: 'Total Meals Saved', bg: '#f0fdf4', text: '#16a34a' },
                { val: stats.deliveredDonations || 0, label: 'Deliveries Done', bg: '#fff7ed', text: '#ea580c' },
                { val: stats.totalUsers || 0, label: 'Total Users', bg: '#eff6ff', text: '#2563eb' },
                { val: stats.totalCo2Saved || '0', label: 'kg CO₂ Saved', bg: '#faf5ff', text: '#7c3aed' },
              ].map((item, i) => (
                <View key={i} style={[styles.statBox, { backgroundColor: item.bg }]}>
                  <Text style={[styles.statVal, { color: item.text }]}>{item.val}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Donors</Text>
          {leaderboard.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyText}>No entries yet. Be the first!</Text>
            </View>
          ) : (
            leaderboard.map((entry, index) => (
              <View
                key={index}
                style={[
                  styles.lbRow,
                  entry.name === user?.name && styles.lbRowActive
                ]}
              >
                <Text style={styles.lbRank}>
                  {rankEmoji[index] || `#${index + 1}`}
                </Text>
                <View style={styles.lbInfo}>
                  <Text style={styles.lbName}>
                    {entry.name}
                    {entry.name === user?.name && (
                      <Text style={styles.youBadge}> (You)</Text>
                    )}
                  </Text>
                  <Text style={styles.lbSub}>
                    {entry.totalMeals} meals · {entry.co2Saved} kg CO₂
                  </Text>
                </View>
                <View style={styles.lbCoins}>
                  <Text style={styles.lbCoinVal}>🪙 {entry.greenCoins}</Text>
                  <Text style={styles.lbCoinLabel}>coins</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: {
    backgroundColor: '#ffffff', paddingHorizontal: 20,
    paddingTop: 56, paddingBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  content: { padding: 16 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  impactCard: {
    width: '47%', borderRadius: 16, padding: 16,
  },
  impactVal: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  impactLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  section: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: { width: '47%', borderRadius: 12, padding: 12 },
  statVal: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  lbRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, borderRadius: 12, marginBottom: 6, backgroundColor: '#f9fafb',
  },
  lbRowActive: { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#bbf7d0' },
  lbRank: { fontSize: 22 },
  lbInfo: { flex: 1 },
  lbName: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  lbSub: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  youBadge: { color: '#16a34a', fontSize: 11 },
  lbCoins: { alignItems: 'flex-end' },
  lbCoinVal: { fontSize: 12, fontWeight: '700', color: '#ca8a04' },
  lbCoinLabel: { fontSize: 10, color: '#9ca3af' },
  emptyBox: { alignItems: 'center', padding: 20 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: '#6b7280', fontSize: 13 },
})