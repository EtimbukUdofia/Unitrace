import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type PropType = {
  styles: any
};

const LecturerQuickActions: React.FC<PropType> = ({styles}) => {
  return (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickActionItem} 
          onPress={() => router.navigate('/lecturer/generate-qr')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="qr-code" size={28} color="#3b82f6" />
          </View>
          <Text style={styles.quickActionText}>Generate QR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={() => router.navigate('/lecturer/attendance-reports')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="analytics" size={28} color="#10b981" />
          </View>
          <Text style={styles.quickActionText}>Reports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={() => router.navigate('/lecturer/students')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="people" size={28} color="#f59e0b" />
          </View>
          <Text style={styles.quickActionText}>Students</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionItem}
          onPress={() => router.navigate('/lecturer/schedule')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#ede9fe' }]}>
            <Ionicons name="calendar" size={28} color="#8b5cf6" />
          </View>
          <Text style={styles.quickActionText}>Schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default LecturerQuickActions;