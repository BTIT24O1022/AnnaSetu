import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const dietColors = {
  VEG: { bg: '#f0fdf4', text: '#16a34a' },
  NONVEG: { bg: '#fef2f2', text: '#dc2626' },
  JAIN: { bg: '#fefce8', text: '#ca8a04' },
  HALAL: { bg: '#eff6ff', text: '#2563eb' },
  DIABETIC_SAFE: { bg: '#faf5ff', text: '#7c3aed' },
}

const statusColors = {
  LISTED: { bg: '#f0fdf4', text: '#16a34a' },
  MATCHED: { bg: '#eff6ff', text: '#2563eb' },
  DISPATCHED: { bg: '#fff7ed', text: '#ea580c' },
  DELIVERED: { bg: '#f9fafb', text: '#6b7280' },
}

export default function DonationCard({ donation, onAction, actionLabel, actionColor }) {
  const dietColor = dietColors[donation.dietType] || dietColors.VEG
  const statusColor = statusColors[donation.status] || statusColors.LISTED

  const btnColor = actionColor === 'blue' ? '#2563eb'
    : actionColor === 'orange' ? '#ea580c'
    : '#16a34a'

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.foodName}>{donation.foodName}</Text>
          <Text style={styles.donorName}>
            {donation.donor?.name || donation.donor_name || 'Anonymous'}
          </Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: dietColor.bg }]}>
            <Text style={[styles.badgeText, { color: dietColor.text }]}>
              {donation.dietType}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>
              {donation.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={14} color="#22c55e" />
          <Text style={styles.detailText}>
            {donation.quantity} {donation.unit || 'plates'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color="#f97316" />
          <Text style={styles.detailText} numberOfLines={1}>
            {donation.address}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color="#3b82f6" />
          <Text style={styles.detailText}>
            Safe for {donation.expiryHours} hrs
          </Text>
          {donation.distance && (
            <Text style={styles.distance}>📍 {donation.distance}</Text>
          )}
        </View>
      </View>

      {/* FoodSafe Score */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>FoodSafe Score</Text>
          <Text style={styles.scoreValue}>{donation.foodSafeScore}/100</Text>
        </View>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreBarFill,
              { width: `${donation.foodSafeScore}%` }
            ]}
          />
        </View>
      </View>

      {/* Action Button */}
      {onAction && actionLabel && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: btnColor }]}
          onPress={() => onAction(donation)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: { flex: 1, marginRight: 8 },
  foodName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  donorName: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  badges: { alignItems: 'flex-end', gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  details: { marginBottom: 10 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailText: { fontSize: 12, color: '#6b7280', flex: 1 },
  distance: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  scoreContainer: { marginBottom: 10 },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreLabel: { fontSize: 11, color: '#6b7280' },
  scoreValue: { fontSize: 11, fontWeight: '600', color: '#16a34a' },
  scoreBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
  },
  scoreBarFill: {
    height: 6,
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  actionBtn: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
})