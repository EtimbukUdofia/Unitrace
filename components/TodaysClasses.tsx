import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import { getStatusIcon, getStatusColor } from '@/utils/utils';
import { Ionicons } from '@expo/vector-icons';
import { AttendanceContext } from '@/context/AttendanceContext';

type PropType = {
  styles: any,
}

const TodaysClasses: React.FC<PropType> = ({ styles }) => {
  const { ongoingLecture } = useContext(AttendanceContext);

  return (
    <View style={styles.classesContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ongoing Class</Text>
      </View>

      {ongoingLecture ? (
          <View key={ongoingLecture.id} style={styles.classItem}>
            <View style={styles.classIcon}>
              <Ionicons
                name={getStatusIcon(ongoingLecture.status)}
                size={20}
                color={getStatusColor(ongoingLecture.status)}
              />
            </View>
            <View style={styles.classContent}>
            <Text style={styles.classSubject}>{ongoingLecture.courseTitle}   { ongoingLecture.code}</Text>
              <Text style={styles.classDetails}>{ongoingLecture.lecturer} • {ongoingLecture.location}</Text>
              <Text style={styles.classTime}>{ongoingLecture.time}</Text>
            </View>
            <View style={styles.classStatus}>
              <Text style={[styles.statusText, { color: getStatusColor(ongoingLecture.status) }]}>
                {ongoingLecture.status === 'pending' || ongoingLecture.status === 'ongoing' ? 'Ongoing' : 'Finished'}
              </Text>
            </View>
          </View>
      ) : (
        <View style={styles.noClassesContainer}>
          <Ionicons name="calendar-outline" size={40} color="#9ca3af" />
          <Text style={styles.noClassesText}>No Ongoing Class</Text>
        </View>
      )}
    </View>
  )
}

export default TodaysClasses