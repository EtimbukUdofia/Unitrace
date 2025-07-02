import { View, Text } from 'react-native'
import React, { useState } from 'react'
import { getStatusIcon, getStatusColor } from '@/utils/utils';
import { Ionicons } from '@expo/vector-icons';

type PropType = {
  styles: any,
}

const TodaysClasses: React.FC<PropType> = ({ styles }) => {
  const [todaysClasses] = useState([
    {
      id: 1,
      subject: 'Operating Systems',
      lecturer: 'Dr. Brown',
      expectedTime: '10:00 AM',
      location: 'Lab 301',
      status: 'pending', // pending, completed, missed
    },
    {
      id: 2,
      subject: 'Computer Networks',
      lecturer: 'Prof. Taylor',
      expectedTime: '02:30 PM',
      location: 'Room 405',
      status: 'pending',
    },
  ]);

  return (
    <View style={styles.classesContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today&apos;s Classes</Text>
        <Text style={styles.classCount}>{todaysClasses.length} classes</Text>
      </View>

      {todaysClasses.length > 0 ? (
        todaysClasses.map((classItem) => (
          <View key={classItem.id} style={styles.classItem}>
            <View style={styles.classIcon}>
              <Ionicons
                name={getStatusIcon(classItem.status)}
                size={20}
                color={getStatusColor(classItem.status)}
              />
            </View>
            <View style={styles.classContent}>
              <Text style={styles.classSubject}>{classItem.subject}</Text>
              <Text style={styles.classDetails}>{classItem.lecturer} • {classItem.location}</Text>
              <Text style={styles.classTime}>{classItem.expectedTime}</Text>
            </View>
            <View style={styles.classStatus}>
              <Text style={[styles.statusText, { color: getStatusColor(classItem.status) }]}>
                {classItem.status === 'pending' ? 'Scan to Mark' : classItem.status}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.noClassesContainer}>
          <Ionicons name="calendar-outline" size={40} color="#9ca3af" />
          <Text style={styles.noClassesText}>No classes scheduled for today</Text>
        </View>
      )}
    </View>
  )
}

export default TodaysClasses