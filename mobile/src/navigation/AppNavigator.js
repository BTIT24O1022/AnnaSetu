import { createStackNavigator } from '@react-navigation/stack'
import { useAuth } from '../context/AuthContext'
import { View, ActivityIndicator } from 'react-native'

import SplashScreen from '../screens/SplashScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import DonorNavigator from './DonorNavigator'
import NGONavigator from './NGONavigator'
import VolunteerNavigator from './VolunteerNavigator'

const Stack = createStackNavigator()

export default function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16a34a' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === 'DONOR' ? (
        <Stack.Screen name="DonorApp" component={DonorNavigator} />
      ) : user.role === 'NGO' ? (
        <Stack.Screen name="NGOApp" component={NGONavigator} />
      ) : (
        <Stack.Screen name="VolunteerApp" component={VolunteerNavigator} />
      )}
    </Stack.Navigator>
  )
}