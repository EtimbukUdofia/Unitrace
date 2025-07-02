import { View, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { getStatusColor, getStatusIcon } from '@/utils/utils'
import { Ionicons } from '@expo/vector-icons'

type PropType = {
  styles: any,
}

const RecentAttendance: React.FC<PropType> = ({ styles }) => {
  const [recentAttendance] = useState([
    {
      id: 1,
      subject: 'Data Structures',
      lecturer: 'Dr. Smith',
      date: '2025-06-11',
      time: '09:30 AM',
      status: 'present',
      location: 'Room 101',
    },
    {
      id: 2,
      subject: 'Database Systems',
      lecturer: 'Prof. Johnson',
      date: '2025-06-10',
      time: '11:00 AM',
      status: 'present',
      location: 'Lab 204',
    },
    {
      id: 3,
      subject: 'Software Engineering',
      lecturer: 'Dr. Wilson',
      date: '2025-06-10',
      time: '02:00 PM',
      status: 'absent',
      location: 'Room 305',
    },
    {
      id: 4,
      subject: 'Mathematics',
      lecturer: 'Prof. Davis',
      date: '2025-06-09',
      time: '10:00 AM',
      status: 'present',
      location: 'Room 201',
    },
  ]);

  return (
    <View style={styles.recentContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Attendance</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentAttendance.map((record) => (
        <View key={record.id} style={styles.attendanceRecord}>
          <View style={[styles.recordIcon, { backgroundColor: `${getStatusColor(record.status)}20` }]}>
            <Ionicons
              name={getStatusIcon(record.status)}
              size={16}
              color={getStatusColor(record.status)}
            />
          </View>
          <View style={styles.recordContent}>
            <Text style={styles.recordSubject}>{record.subject}</Text>
            <Text style={styles.recordDetails}>{record.lecturer} • {record.location}</Text>
            <Text style={styles.recordTime}>{record.date} at {record.time}</Text>
          </View>
          <View style={styles.recordStatus}>
            <Text style={[styles.statusBadge, {
              backgroundColor: `${getStatusColor(record.status)}20`,
              color: getStatusColor(record.status)
            }]}>
              {record.status}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

export default RecentAttendance