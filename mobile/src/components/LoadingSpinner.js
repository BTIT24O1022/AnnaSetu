import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#16a34a" />
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  text: {
    marginTop: 12,
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
  },
})