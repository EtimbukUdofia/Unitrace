import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { View, Text, TouchableOpacity } from "react-native"

type PropType = {
  styles: any,
  handleScanQR: () => void
}

export const QuickActions: React.FC<PropType> = ({styles, handleScanQR}) => {
  return (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionItem} onPress={handleScanQR}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="qr-code-outline" size={28} color="#3b82f6" />
          </View>
          <Text style={styles.quickActionText}>Scan QR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionItem}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="bar-chart-outline" size={28} color="#10b981" />
          </View>
          <Text style={styles.quickActionText}>Reports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionItem} onPress={()=> router.navigate("/student/history")}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="calendar-outline" size={28} color="#f59e0b" />
          </View>
          <Text style={styles.quickActionText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionItem} onPress={()=> router.navigate("/student/profile")}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#ede9fe' }]}>
            <Ionicons name="person-outline" size={28} color="#8b5cf6" />
          </View>
          <Text style={styles.quickActionText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}