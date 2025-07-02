import { View, Text } from 'react-native'
import React from 'react'
import { getAttendanceColor } from '@/utils/utils'

type PropTypes = {
  styles: any,
  weeklyStats: {
    totalClasses: number,
    completedClasses: number,
    avgAttendance: number,
    activeStudents: number,
    totalStudents: number
  }
}

const WeeklyOverview: React.FC<PropTypes>  = ({styles, weeklyStats}) => {
  return (
    <View style={styles.overviewCard}>
      <Text style={styles.cardTitle}>This Week Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{weeklyStats.completedClasses}</Text>
          <Text style={styles.statLabel}>Classes Taught</Text>
        </View>
        <View style={styles.statBox}>
          <Text
            style={[
              styles.statNumber,
              { color: getAttendanceColor(weeklyStats.avgAttendance) },
            ]}
          >
            {weeklyStats.avgAttendance}%
          </Text>
          <Text style={styles.statLabel}>Avg Attendance</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{weeklyStats.activeStudents}</Text>
          <Text style={styles.statLabel}>Active Students</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{weeklyStats.totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
      </View>
    </View>
  );
}

export default WeeklyOverview