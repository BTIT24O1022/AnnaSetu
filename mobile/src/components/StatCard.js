import { View, Text, StyleSheet } from 'react-native'

const colorMap = {
  green: { bg: '#16a34a', light: '#f0fdf4' },
  orange: { bg: '#ea580c', light: '#fff7ed' },
  blue: { bg: '#2563eb', light: '#eff6ff' },
  pink: { bg: '#db2777', light: '#fdf2f8' },
  yellow: { bg: '#ca8a04', light: '#fefce8' },
}

export default function StatCard({ label, value, color = 'green', icon }) {
  const colors = colorMap[color] || colorMap.green

  return (
    <View style={[styles.card, { backgroundColor: colors.light }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.bg }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color: colors.bg }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    minWidth: 90,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: { fontSize: 18 },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
})