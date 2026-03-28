import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import DonorHomeScreen from '../screens/donor/DonorHomeScreen'
import AddFoodScreen from '../screens/donor/AddFoodScreen'
import ImpactScreen from '../screens/donor/ImpactScreen'

const Tab = createBottomTabNavigator()

export default function DonorNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline'
          else if (route.name === 'Donate') iconName = focused ? 'add-circle' : 'add-circle-outline'
          else if (route.name === 'Impact') iconName = focused ? 'bar-chart' : 'bar-chart-outline'
          return <Ionicons name={iconName} size={24} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={DonorHomeScreen} />
      <Tab.Screen name="Donate" component={AddFoodScreen} />
      <Tab.Screen name="Impact" component={ImpactScreen} />
    </Tab.Navigator>
  )
}