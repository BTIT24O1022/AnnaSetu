import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import VolunteerHomeScreen from '../screens/volunteer/VolunteerHomeScreen'
import DeliveriesScreen from '../screens/volunteer/DeliveriesScreen'
import ImpactScreen from '../screens/donor/ImpactScreen'

const Tab = createBottomTabNavigator()

export default function VolunteerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#db2777',
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
          else if (route.name === 'Deliveries') iconName = focused ? 'bicycle' : 'bicycle-outline'
          else if (route.name === 'Impact') iconName = focused ? 'bar-chart' : 'bar-chart-outline'
          return <Ionicons name={iconName} size={24} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={VolunteerHomeScreen} />
      <Tab.Screen name="Deliveries" component={DeliveriesScreen} />
      <Tab.Screen name="Impact" component={ImpactScreen} />
    </Tab.Navigator>
  )
}