import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#667eea",
        // headerStyle: {
        //   backgroundColor: "#25292e",
        // },
        headerShadowVisible: false,
        // headerTintColor: "#1f2937",
        // tabBarStyle: {
        //   backgroundColor: "#25292e",
        // },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
        )
      }} />
      
      <Tabs.Screen name="scan" options={{
        title: 'Scan',
        headerTitle: 'ScanQR',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'qr-code' : 'qr-code-outline'} color={color} size={24} />
        )
      }} />
      
      {/* <Tabs.Screen name="history" options={{
        title: 'History',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={24} />
        )
      }} /> */}
      
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={color} size={24} />
        )
      }}/>
    </Tabs>
  )
}