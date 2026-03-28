import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import NGOHomeScreen from '../screens/ngo/NGOHomeScreen'
import NGORequestsScreen from '../screens/ngo/NGORequestsScreen'
import ImpactScreen from '../screens/donor/ImpactScreen'

const Tab = createBottomTabNavigator()

export default function NGONavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ focused, color }) => {
          let iconName
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline'
          else if (route.name === 'Requests') iconName = focused ? 'list' : 'list-outline'
          else if (route.name === 'Impact') iconName = focused ? 'bar-chart' : 'bar-chart-outline'
          return <Ionicons name={iconName} size={24} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={NGOHomeScreen} />
      <Tab.Screen name="Requests" component={NGORequestsScreen} />
      <Tab.Screen name="Impact" component={ImpactScreen} />
    </Tab.Navigator>
  )
}