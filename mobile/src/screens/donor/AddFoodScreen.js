import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from 'react-native'
import { donationAPI, dispatchAPI } from '../../lib/api'
import Toast from 'react-native-toast-message'

function ScorePreview({ expiryHours, dietType }) {
  let score = 100
  const hrs = parseInt(expiryHours) || 4
  if (hrs <= 1) score -= 40
  else if (hrs <= 2) score -= 25
  else if (hrs <= 3) score -= 15
  else if (hrs <= 4) score -= 5
  if (dietType === 'VEG' || dietType === 'JAIN') score += 5
  if (dietType === 'NONVEG') score -= 10
  score = Math.min(100, Math.max(0, score))

  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreBarBg}>
        <View style={[styles.scoreBarFill, { width: `${score}%` }]} />
      </View>
      <Text style={styles.scoreNum}>{score}/100</Text>
    </View>
  )
}

export default function AddFoodScreen() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    foodName: '', description: '', quantity: '',
    unit: 'plates', dietType: 'VEG', expiryHours: '4',
    address: '', latitude: '19.0760', longitude: '72.8777',
  })

  const dietTypes = [
    { id: 'VEG', label: '🥦 Veg' },
    { id: 'NONVEG', label: '🍗 Non-Veg' },
    { id: 'JAIN', label: '🌿 Jain' },
    { id: 'HALAL', label: '☪️ Halal' },
    { id: 'DIABETIC_SAFE', label: '💚 Diabetic' },
  ]

  const units = ['plates', 'kg', 'boxes', 'packets', 'litres']

  const handleSubmit = async () => {
    if (!form.foodName || !form.quantity || !form.address) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' })
      return
    }
    setLoading(true)
    try {
      const res = await donationAPI.create(form)
      const donationId = res.data.donation.id
      Toast.show({ type: 'success', text1: 'Food listed! Finding nearest NGO 🎉' })
      try {
        await dispatchAPI.autoDispatch(donationId)
        Toast.show({ type: 'success', text1: 'NGO and volunteer notified! 🚴' })
      } catch {
        Toast.show({ type: 'info', text1: 'Donation listed. Dispatch pending.' })
      }
      setForm({
        foodName: '', description: '', quantity: '',
        unit: 'plates', dietType: 'VEG', expiryHours: '4',
        address: '', latitude: '19.0760', longitude: '72.8777',
      })
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>List Food Donation</Text>
          <Text style={styles.headerSub}>Fill details about your surplus food</Text>
        </View>

        <View style={styles.form}>

          {/* Food Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Food Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Biryani, Dal Rice"
              placeholderTextColor="#9ca3af"
              value={form.foodName}
              onChangeText={(t) => setForm({ ...form, foodName: t })}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Any additional details..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
            />
          </View>

          {/* Quantity + Unit */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={form.quantity}
                onChangeText={(t) => setForm({ ...form, quantity: t })}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {units.map((u) => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setForm({ ...form, unit: u })}
                      style={[
                        styles.chipBtn,
                        form.unit === u && styles.chipBtnActive
                      ]}
                    >
                      <Text style={[
                        styles.chipText,
                        form.unit === u && styles.chipTextActive
                      ]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Diet Type */}
          <View style={styles.field}>
            <Text style={styles.label}>Diet Type *</Text>
            <View style={styles.chipRow}>
              {dietTypes.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => setForm({ ...form, dietType: d.id })}
                  style={[
                    styles.chipBtn,
                    form.dietType === d.id && styles.chipBtnActive
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    form.dietType === d.id && styles.chipTextActive
                  ]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Expiry */}
          <View style={styles.field}>
            <Text style={styles.label}>Safe for how many hours? *</Text>
            <View style={styles.expiryRow}>
              {['2', '4', '6', '8'].map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() => setForm({ ...form, expiryHours: h })}
                  style={[
                    styles.expiryBtn,
                    form.expiryHours === h && styles.expiryBtnActive
                  ]}
                >
                  <Text style={[
                    styles.expiryText,
                    form.expiryHours === h && styles.expiryTextActive
                  ]}>{h} hrs</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address */}
          <View style={styles.field}>
            <Text style={styles.label}>Pickup Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Full address for pickup"
              placeholderTextColor="#9ca3af"
              value={form.address}
              onChangeText={(t) => setForm({ ...form, address: t })}
            />
          </View>

          {/* Score Preview */}
          <View style={styles.scoreBox}>
            <Text style={styles.scoreTitle}>🛡️ Estimated FoodSafe Score</Text>
            <ScorePreview
              expiryHours={form.expiryHours}
              dietType={form.dietType}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>🍱 List Food Donation</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  headerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  form: { padding: 16 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1f2937',
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#ffffff',
  },
  chipBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  chipText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#16a34a' },
  expiryRow: { flexDirection: 'row', gap: 8 },
  expiryBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e5e7eb',
    backgroundColor: '#ffffff', alignItems: 'center',
  },
  expiryBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  expiryText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  expiryTextActive: { color: '#16a34a' },
  scoreBox: {
    backgroundColor: '#f0fdf4', borderWidth: 1,
    borderColor: '#bbf7d0', borderRadius: 14, padding: 14, marginBottom: 14,
  },
  scoreTitle: { fontSize: 12, fontWeight: '600', color: '#16a34a', marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreBarBg: {
    flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4,
  },
  scoreBarFill: { height: 8, backgroundColor: '#22c55e', borderRadius: 4 },
  scoreNum: { fontSize: 12, fontWeight: '700', color: '#16a34a', minWidth: 45 },
  submitBtn: {
    backgroundColor: '#16a34a', padding: 16,
    borderRadius: 14, alignItems: 'center',
  },
  submitText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
})