import { useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function SplashScreen({ navigation }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      if (!user) navigation.replace('Login')
    }, 2000)
    return () => clearTimeout(timer)
  }, [loading, user])

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoEmoji}>🌱</Text>
      </View>
      <Text style={styles.title}>AnnaSetu</Text>
      <Text style={styles.hindi}>अन्न सेतु</Text>
      <Text style={styles.tagline}>Bridging Food. Reducing Waste.</Text>
      <View style={styles.dots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: { fontSize: 52 },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  hindi: {
    fontSize: 20,
    color: '#bbf7d0',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#86efac',
    marginBottom: 40,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: 60,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    opacity: 0.7,
  },
})