import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../lib/api'
import Toast from 'react-native-toast-message'
import { Ionicons } from '@expo/vector-icons'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('DONOR')
  const [form, setForm] = useState({ email: '', password: '' })

  const roles = [
    { id: 'DONOR', label: 'Donor', emoji: '🍽️', desc: 'Restaurants & Homes' },
    { id: 'NGO', label: 'NGO', emoji: '🏢', desc: 'Organizations' },
    { id: 'VOLUNTEER', label: 'Volunteer', emoji: '❤️', desc: 'Helpers' },
  ]

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' })
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.login(form)
      const { user, token } = res.data
      if (user.role !== selectedRole) {
        Toast.show({
          type: 'error',
          text1: `This account is a ${user.role}`,
          text2: `Please select ${user.role} role`
        })
        setLoading(false)
        return
      }
      Toast.show({ type: 'success', text1: `Welcome back, ${user.name}! 🎉` })
      await login(user, token)
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed'
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
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Text style={{ fontSize: 28 }}>🌱</Text>
          </View>
          <View>
            <Text style={styles.appName}>AnnaSetu</Text>
            <Text style={styles.hindi}>अन्न सेतु</Text>
          </View>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue making an impact</Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Selection */}
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
                <Text style={styles.roleEmoji}>{role.emoji}</Text>
                <Text style={[
                  styles.roleLabel,
                  selectedRole === role.id && styles.roleLabelActive
                ]}>
                  {role.label}
                </Text>
                <Text style={styles.roleDesc}>{role.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.loginBtnText}>Signing in...</Text>
            </View>
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Register */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Test Credentials */}
        <View style={styles.testBox}>
          <Text style={styles.testTitle}>🧪 Test Credentials</Text>
          <Text style={styles.testCred}>Donor: donor@test.com / password123</Text>
          <Text style={styles.testCred}>NGO: ngo@test.com / password123</Text>
          <Text style={styles.testCred}>Volunteer: volunteer@test.com / password123</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { padding: 24, paddingTop: 60 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  logoBox: {
    width: 56, height: 56, backgroundColor: '#16a34a',
    borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  appName: { fontSize: 22, fontWeight: 'bold', color: '#16a34a' },
  hindi: { fontSize: 13, color: '#6b7280' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 28 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1f2937',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 8 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleCard: {
    flex: 1, padding: 12, borderRadius: 14, borderWidth: 2,
    borderColor: '#e5e7eb', backgroundColor: '#ffffff', alignItems: 'center',
  },
  roleCardActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  roleEmoji: { fontSize: 22, marginBottom: 4 },
  roleLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  roleLabelActive: { color: '#16a34a' },
  roleDesc: { fontSize: 9, color: '#9ca3af', textAlign: 'center', marginTop: 2 },
  loginBtn: {
    backgroundColor: '#16a34a', padding: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  registerText: { color: '#6b7280', fontSize: 14 },
  registerLink: { color: '#16a34a', fontWeight: '600', fontSize: 14 },
  testBox: {
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
    borderRadius: 14, padding: 14,
  },
  testTitle: { fontSize: 12, fontWeight: '600', color: '#16a34a', marginBottom: 6 },
  testCred: { fontSize: 11, color: '#4b5563', marginBottom: 2 },
})