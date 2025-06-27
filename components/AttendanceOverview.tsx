import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAttendanceColor } from "@/utils/utils";

type PropTypes ={
  styles: any,
  attendanceStats: any
}

export const AttendanceOverview: React.FC<PropTypes> = ({ styles, attendanceStats }) => {
  return (
    <>
    <View style={styles.attendanceCard}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Attendance Overview</Text>
      <TouchableOpacity>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
    
    <View style={styles.attendanceContent}>
      <View style={styles.attendanceCircle}>
        <View style={[styles.progressRing, { borderColor: getAttendanceColor(attendanceStats.overall) }]}>
          <Text style={[styles.attendancePercentage, { color: getAttendanceColor(attendanceStats.overall) }]}>
            {attendanceStats.overall}%
          </Text>
        </View>
      </View>
      
      <View style={styles.attendanceStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{attendanceStats.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{attendanceStats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{attendanceStats.totalClasses}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </View>

    <View style={styles.weeklyStats}>
      <View style={styles.weeklyStatItem}>
        <Text style={styles.weeklyStatNumber}>{attendanceStats.thisWeek}</Text>
        <Text style={styles.weeklyStatLabel}>This Week</Text>
      </View>
      <View style={styles.weeklyStatItem}>
        <Text style={styles.weeklyStatNumber}>{attendanceStats.thisMonth}</Text>
        <Text style={styles.weeklyStatLabel}>This Month</Text>
      </View>
    </View>
  </View>
    </>
  )
}