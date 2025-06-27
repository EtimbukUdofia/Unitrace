import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth, signOut } from '@firebase/auth';
import { AttendanceOverview } from '@/components/AttendanceOverview';
import { QuickActions } from '@/components/QuickActions';
// import { AuthContext } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

const StudentDashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // const { user } = useContext(AuthContext);

  const router = useRouter();

  const handleSignOut = () => { 
    const auth = getAuth();
    signOut(auth)
      .then(() => { console.log('Sign out successful'); }).catch((error) => {
        console.error('Sign out error:', error);
      })
  }

  // Mock data - replace with actual API calls
  const [studentData] = useState({
    name: 'John Doe',
    studentId: 'ST12345',
    department: 'Computer Science',
    semester: '6th Semester',
    profileImage: null,
  });

  const [attendanceStats] = useState({
    overall: 85,
    present: 68,
    absent: 12,
    totalClasses: 80,
    thisWeek: 4,
    thisMonth: 18,
  });

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const formatDate = (date:Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleScanQR = () => {
    // Navigate to QR scanner screen
    router.navigate("/student/scan");
    // console.log('Navigate to QR Scanner');
  };

  // const renderAttendanceOverview = () => (
  //   <View style={styles.attendanceCard}>
  //     <View style={styles.cardHeader}>
  //       <Text style={styles.cardTitle}>Attendance Overview</Text>
  //       <TouchableOpacity>
  //         <Ionicons name="chevron-forward" size={20} color="#6b7280" />
  //       </TouchableOpacity>
  //     </View>
      
  //     <View style={styles.attendanceContent}>
  //       <View style={styles.attendanceCircle}>
  //         <View style={[styles.progressRing, { borderColor: getAttendanceColor(attendanceStats.overall) }]}>
  //           <Text style={[styles.attendancePercentage, { color: getAttendanceColor(attendanceStats.overall) }]}>
  //             {attendanceStats.overall}%
  //           </Text>
  //         </View>
  //       </View>
        
  //       <View style={styles.attendanceStats}>
  //         <View style={styles.statItem}>
  //           <Text style={styles.statNumber}>{attendanceStats.present}</Text>
  //           <Text style={styles.statLabel}>Present</Text>
  //         </View>
  //         <View style={styles.statItem}>
  //           <Text style={styles.statNumber}>{attendanceStats.absent}</Text>
  //           <Text style={styles.statLabel}>Absent</Text>
  //         </View>
  //         <View style={styles.statItem}>
  //           <Text style={styles.statNumber}>{attendanceStats.totalClasses}</Text>
  //           <Text style={styles.statLabel}>Total</Text>
  //         </View>
  //       </View>
  //     </View>

  //     <View style={styles.weeklyStats}>
  //       <View style={styles.weeklyStatItem}>
  //         <Text style={styles.weeklyStatNumber}>{attendanceStats.thisWeek}</Text>
  //         <Text style={styles.weeklyStatLabel}>This Week</Text>
  //       </View>
  //       <View style={styles.weeklyStatItem}>
  //         <Text style={styles.weeklyStatNumber}>{attendanceStats.thisMonth}</Text>
  //         <Text style={styles.weeklyStatLabel}>This Month</Text>
  //       </View>
  //     </View>
  //   </View>
  // );

  // const renderQuickActions = () => (
  //   <View style={styles.quickActionsContainer}>
  //     <Text style={styles.sectionTitle}>Quick Actions</Text>
  //     <View style={styles.quickActionsGrid}>
  //       <TouchableOpacity style={styles.quickActionItem} onPress={handleScanQR}>
  //         <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
  //           <Ionicons name="qr-code-outline" size={28} color="#3b82f6" />
  //         </View>
  //         <Text style={styles.quickActionText}>Scan QR</Text>
  //       </TouchableOpacity>
        
  //       <TouchableOpacity style={styles.quickActionItem}>
  //         <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
  //           <Ionicons name="bar-chart-outline" size={28} color="#10b981" />
  //         </View>
  //         <Text style={styles.quickActionText}>Reports</Text>
  //       </TouchableOpacity>
        
  //       <TouchableOpacity style={styles.quickActionItem} onPress={()=> router.navigate("/student/history")}>
  //         <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
  //           <Ionicons name="calendar-outline" size={28} color="#f59e0b" />
  //         </View>
  //         <Text style={styles.quickActionText}>History</Text>
  //       </TouchableOpacity>
        
  //       <TouchableOpacity style={styles.quickActionItem} onPress={()=> router.navigate("/student/profile")}>
  //         <View style={[styles.quickActionIcon, { backgroundColor: '#ede9fe' }]}>
  //           <Ionicons name="person-outline" size={28} color="#8b5cf6" />
  //         </View>
  //         <Text style={styles.quickActionText}>Profile</Text>
  //       </TouchableOpacity>
  //     </View>
  //   </View>
  // );

  // const renderTodaysClasses = () => (
  //   <View style={styles.classesContainer}>
  //     <View style={styles.sectionHeader}>
  //       <Text style={styles.sectionTitle}>Today&apos;s Classes</Text>
  //       <Text style={styles.classCount}>{todaysClasses.length} classes</Text>
  //     </View>
      
  //     {todaysClasses.length > 0 ? (
  //       todaysClasses.map((classItem) => (
  //         <View key={classItem.id} style={styles.classItem}>
  //           <View style={styles.classIcon}>
  //             <Ionicons 
  //               name={getStatusIcon(classItem.status)} 
  //               size={20} 
  //               color={getStatusColor(classItem.status)} 
  //             />
  //           </View>
  //           <View style={styles.classContent}>
  //             <Text style={styles.classSubject}>{classItem.subject}</Text>
  //             <Text style={styles.classDetails}>{classItem.lecturer} • {classItem.location}</Text>
  //             <Text style={styles.classTime}>{classItem.expectedTime}</Text>
  //           </View>
  //           <View style={styles.classStatus}>
  //             <Text style={[styles.statusText, { color: getStatusColor(classItem.status) }]}>
  //               {classItem.status === 'pending' ? 'Scan to Mark' : classItem.status}
  //             </Text>
  //           </View>
  //         </View>
  //       ))
  //     ) : (
  //       <View style={styles.noClassesContainer}>
  //         <Ionicons name="calendar-outline" size={40} color="#9ca3af" />
  //         <Text style={styles.noClassesText}>No classes scheduled for today</Text>
  //       </View>
  //     )}
  //   </View>
  // );

  // const renderRecentAttendance = () => (
  //   <View style={styles.recentContainer}>
  //     <View style={styles.sectionHeader}>
  //       <Text style={styles.sectionTitle}>Recent Attendance</Text>
  //       <TouchableOpacity>
  //         <Text style={styles.viewAllText}>View All</Text>
  //       </TouchableOpacity>
  //     </View>
      
  //     {recentAttendance.map((record) => (
  //       <View key={record.id} style={styles.attendanceRecord}>
  //         <View style={[styles.recordIcon, { backgroundColor: `${getStatusColor(record.status)}20` }]}>
  //           <Ionicons 
  //             name={getStatusIcon(record.status)} 
  //             size={16} 
  //             color={getStatusColor(record.status)} 
  //           />
  //         </View>
  //         <View style={styles.recordContent}>
  //           <Text style={styles.recordSubject}>{record.subject}</Text>
  //           <Text style={styles.recordDetails}>{record.lecturer} • {record.location}</Text>
  //           <Text style={styles.recordTime}>{record.date} at {record.time}</Text>
  //         </View>
  //         <View style={styles.recordStatus}>
  //           <Text style={[styles.statusBadge, { 
  //             backgroundColor: `${getStatusColor(record.status)}20`,
  //             color: getStatusColor(record.status)
  //           }]}>
  //             {record.status}
  //           </Text>
  //         </View>
  //       </View>
  //     ))}
  //   </View>
  // );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={24} color="#6b7280" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.studentName}>{studentData.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={handleSignOut}>
          <Ionicons name="notifications-outline" size={24} color="#1f2937" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Date */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
        <Text style={styles.studentInfo}>{studentData.studentId} • {studentData.department}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Attendance Overview */}
        {/* {renderAttendanceOverview()} */}
        <AttendanceOverview styles={ styles } attendanceStats={attendanceStats} />

        {/* Quick Actions */}
        {/* {renderQuickActions()} */}
        <QuickActions styles={styles} handleScanQR={handleScanQR}/>

        {/* Today's Classes */}
        {/* {renderTodaysClasses()} */}

        {/* Recent Attendance */}
        {/* {renderRecentAttendance()} */}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  notificationButton: {
    position: 'absolute',
    // right: 25,
    right: 10,
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  dateContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  studentInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  attendanceCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  attendanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  attendanceCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 30,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  attendancePercentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  attendanceStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  weeklyStatItem: {
    alignItems: 'center',
  },
  weeklyStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  weeklyStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  quickActionIcon: {
    width: 65,
    height: 65,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  classesContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  classCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  classContent: {
    flex: 1,
  },
  classSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  classTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  classStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noClassesContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noClassesText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 10,
  },
  recentContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  attendanceRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
  },
  recordSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  recordDetails: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  recordTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  recordStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bottomPadding: {
    height: 20,
  },
});

export default StudentDashboard;