import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../lib/api'
import Toast from 'react-native-toast-message'

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('DONOR')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', address: ''
  })

  const roles = [
    { id: 'DONOR', emoji: '🍽️', label: 'Donor' },
    { id: 'NGO', emoji: '🏢', label: 'NGO' },
    { id: 'VOLUNTEER', emoji: '❤️', label: 'Volunteer' },
  ]

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' })
      return
    }
    if (form.password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' })
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.register({ ...form, role: selectedRole })
      const { user, token } = res.data
      Toast.show({ type: 'success', text1: 'Account created! Welcome 🎉' })
      await login(user, token)
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed'
      Toast.show({ type: 'error', text1: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the food rescue movement</Text>

        {/* Role */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>I am a</Text>
          <View style={styles.roleRow}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                onPress={() => setSelectedRole(role.id)}
                style={[
                  styles.roleCard,
                  selectedRole === role.id && styles.roleCardActive
                ]}
              >
                <Text style={{ fontSize: 20 }}>{role.emoji}</Text>
                <Text style={[
                  styles.roleLabel,
                  selectedRole === role.id && { color: '#16a34a' }
                ]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fields */}
        {[
          { key: 'name', label: 'Full Name *', placeholder: 'Rajesh Restaurant' },
          { key: 'email', label: 'Email *', placeholder: 'your@email.com', keyboard: 'email-address' },
          { key: 'phone', label: 'Phone *', placeholder: '9876543210', keyboard: 'phone-pad' },
          { key: 'password', label: 'Password *', placeholder: 'Min. 6 characters', secure: true },
          { key: 'address', label: 'Address', placeholder: 'MG Road, Mumbai' },
        ].map((field) => (
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor="#9ca3af"
              keyboardType={field.keyboard || 'default'}
              secureTextEntry={field.secure || false}
              autoCapitalize={field.key === 'email' ? 'none' : 'words'}
              value={form[field.key]}
              onChangeText={(t) => setForm({ ...form, [field.key]: t })}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Create Account</Text>
          }
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={{ color: '#6b7280' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: '#16a34a', fontWeight: '600' }}>Sign In</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1f2937',
  },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleCard: {
    flex: 1, padding: 12, borderRadius: 12, borderWidth: 2,
    borderColor: '#e5e7eb', backgroundColor: '#ffffff', alignItems: 'center', gap: 4,
  },
  roleCardActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  roleLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  btn: {
    backgroundColor: '#16a34a', padding: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
})