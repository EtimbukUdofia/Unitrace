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
import { signOut } from '@firebase/auth';
import { auth } from '@/config/firebase';
import { AuthContext } from '@/context/AuthContext';
import LecturerQuickActions from '@/components/LecturerQuickActions';
import LecturerOngoingClass from '@/components/LecturerOngoingClass';

const { width } = Dimensions.get('window');

const LecturerDashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { user, userData } = useContext(AuthContext);

  const router = useRouter();

  const handleSignOut = () => { 
    signOut(auth)
        .then(() => { console.log('Sign out successful'); }).catch((error) => {
          console.error('Sign out error:', error);
        })
  }

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  // Add a helper function for time-based greeting
  const getTimeGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };
  //   <View style={styles.overviewCard}>
  //     <Text style={styles.cardTitle}>This Week Overview</Text>
  //     <View style={styles.statsGrid}>
  //       <View style={styles.statBox}>
  //         <Text style={styles.statNumber}>{weeklyStats.completedClasses}</Text>
  //         <Text style={styles.statLabel}>Classes Taught</Text>
  //       </View>
  //       <View style={styles.statBox}>
  //         <Text style={[styles.statNumber, { color: getAttendanceColor(weeklyStats.avgAttendance) }]}>
  //           {weeklyStats.avgAttendance}%
  //         </Text>
  //         <Text style={styles.statLabel}>Avg Attendance</Text>
  //       </View>
  //       <View style={styles.statBox}>
  //         <Text style={styles.statNumber}>{weeklyStats.activeStudents}</Text>
  //         <Text style={styles.statLabel}>Active Students</Text>
  //       </View>
  //       <View style={styles.statBox}>
  //         <Text style={styles.statNumber}>{weeklyStats.totalStudents}</Text>
  //         <Text style={styles.statLabel}>Total Students</Text>
  //       </View>
  //     </View>
  //   </View>
  // );

  // const renderQuickActions = () => (
  //   <View style={styles.quickActionsContainer}>
  //     <Text style={styles.sectionTitle}>Quick Actions</Text>
  //     <View style={styles.quickActionsGrid}>
  //       <TouchableOpacity 
  //         style={styles.quickActionItem} 
  //         onPress={() => router.navigate('/lecturer/generate-qr')}
  //       >
  //         <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
  //           <Ionicons name="qr-code" size={28} color="#3b82f6" />
  //         </View>
  //         <Text style={styles.quickActionText}>Generate QR</Text>
  //       </TouchableOpacity>
        
  //       <TouchableOpacity 
  //         style={styles.quickActionItem}
  //         onPress={() => router.navigate('/lecturer/attendance-reports')}
  //       >
  //         <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
  //           <Ionicons name="analytics" size={28} color="#10b981" />
  //         </View>
  //         <Text style={styles.quickActionText}>Reports</Text>
  //       </TouchableOpacity>
        
  //       <TouchableOpacity 
  //         style={styles.quickActionItem}
  //         onPress={() => router.navigate('/lecturer/students')}
  //       >
  //         <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
  //           <Ionicons name="people" size={28} color="#f59e0b" />
  //         </View>
  //         <Text style={styles.quickActionText}>Students</Text>
  //       </TouchableOpacity>
        
  //       <TouchableOpacity 
  //         style={styles.quickActionItem}
  //         onPress={() => router.navigate('/lecturer/schedule')}
  //       >
  //         <View style={[styles.quickActionIcon, { backgroundColor: '#ede9fe' }]}>
  //           <Ionicons name="calendar" size={28} color="#8b5cf6" />
  //         </View>
  //         <Text style={styles.quickActionText}>Schedule</Text>
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
      
  //     {todaysClasses.map((classItem) => (
  //       <View key={classItem.id} style={styles.classCard}>
  //         <View style={styles.classHeader}>
  //           <View style={styles.classInfo}>
  //             <Text style={styles.classSubject}>{classItem.subject}</Text>
  //             <Text style={styles.classCode}>{classItem.code}</Text>
  //           </View>
  //           <View style={[styles.statusBadge, { backgroundColor: `${getClassStatusColor(classItem.status)}20` }]}>
  //             <Ionicons 
  //               name={getClassStatusIcon(classItem.status)} 
  //               size={16} 
  //               color={getClassStatusColor(classItem.status)} 
  //             />
  //             <Text style={[styles.statusText, { color: getClassStatusColor(classItem.status) }]}>
  //               {classItem.status}
  //             </Text>
  //           </View>
  //         </View>
          
  //         <View style={styles.classDetails}>
  //           <View style={styles.classDetailItem}>
  //             <Ionicons name="time" size={16} color="#6b7280" />
  //             <Text style={styles.classDetailText}>{classItem.time}</Text>
  //           </View>
  //           <View style={styles.classDetailItem}>
  //             <Ionicons name="location" size={16} color="#6b7280" />
  //             <Text style={styles.classDetailText}>{classItem.location}</Text>
  //           </View>
  //         </View>
          
  //         <View style={styles.attendanceInfo}>
  //           <Text style={styles.attendanceText}>
  //             {classItem.studentsPresent}/{classItem.studentsEnrolled} students present
  //           </Text>
  //           {classItem.studentsPresent > 0 && (
  //             <Text style={styles.attendancePercentage}>
  //               ({Math.round((classItem.studentsPresent / classItem.studentsEnrolled) * 100)}%)
  //             </Text>
  //           )}
  //         </View>
          
  //         <View style={styles.classActions}>
  //           {classItem.status === 'upcoming' && (
  //             <TouchableOpacity 
  //               style={[styles.actionButton, styles.primaryButton]}
  //               onPress={() => handleGenerateQR(classItem.id)}
  //             >
  //               <Ionicons name="qr-code" size={16} color="#ffffff" />
  //               <Text style={styles.primaryButtonText}>Generate QR</Text>
  //             </TouchableOpacity>
  //           )}
            
  //           {classItem.status === 'completed' && (
  //             <TouchableOpacity 
  //               style={[styles.actionButton, styles.secondaryButton]}
  //               onPress={() => handleViewAttendance(classItem.id)}
  //             >
  //               <Ionicons name="eye" size={16} color="#3b82f6" />
  //               <Text style={styles.secondaryButtonText}>View Attendance</Text>
  //             </TouchableOpacity>
  //           )}
            
  //           {classItem.status === 'ongoing' && (
  //             <TouchableOpacity 
  //               style={[styles.actionButton, styles.primaryButton]}
  //               onPress={() => router.navigate(`/lecturer/live-attendance/${classItem.id}`)}
  //             >
  //               <Ionicons name="radio" size={16} color="#ffffff" />
  //               <Text style={styles.primaryButtonText}>Live View</Text>
  //             </TouchableOpacity>
  //           )}
  //         </View>
  //       </View>
  //     ))}
  //   </View>
  // );

  // const renderAttendanceAlerts = () => (
  //   <View style={styles.alertsContainer}>
  //     <View style={styles.sectionHeader}>
  //       <Text style={styles.sectionTitle}>Attendance Alerts</Text>
  //       <TouchableOpacity onPress={() => router.navigate('/lecturer/alerts')}>
  //         <Text style={styles.viewAllText}>View All</Text>
  //       </TouchableOpacity>
  //     </View>
      
  //     {attendanceAlerts.length > 0 ? (
  //       attendanceAlerts.map((alert) => (
  //         <View key={alert.id} style={styles.alertItem}>
  //           <View style={styles.alertIcon}>
  //             <Ionicons 
  //               name={alert.type === 'low_attendance' ? 'warning' : 'alert-circle'} 
  //               size={20} 
  //               color="#ef4444" 
  //             />
  //           </View>
  //           <View style={styles.alertContent}>
  //             <Text style={styles.alertTitle}>
  //               {alert.studentName} ({alert.studentId})
  //             </Text>
  //             <Text style={styles.alertMessage}>{alert.message}</Text>
  //             <Text style={styles.alertSubject}>{alert.subject}</Text>
  //           </View>
  //           <TouchableOpacity style={styles.alertAction}>
  //             <Ionicons name="chevron-forward" size={16} color="#6b7280" />
  //           </TouchableOpacity>
  //         </View>
  //       ))
  //     ) : (
  //       <View style={styles.noAlertsContainer}>
  //         <Ionicons name="checkmark-circle" size={40} color="#10b981" />
  //         <Text style={styles.noAlertsText}>No attendance alerts</Text>
  //       </View>
  //     )}
  //   </View>
  // );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.profileImage}>
            <TouchableOpacity onPress={handleSignOut}>
              <Ionicons name="person" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.welcomeText}>{getTimeGreeting()}</Text>
            <Text style={styles.lecturerName}>{user?.displayName}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Date and Info */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
        <Text style={styles.lecturerInfo}>
          {userData?.department}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Weekly Overview */}
        {/* {renderWeeklyOverview()} */}
        {/* <WeeklyOverview styles={styles} weeklyStats={weeklyStats}/> */}

        {/* Quick Actions */}
        {/* {renderQuickActions()} */}
        <LecturerQuickActions styles={styles} />

        {/* Today's Classes */}
        {/* {renderTodaysClasses()} */}
        <LecturerOngoingClass styles={styles}/>

        {/* Attendance Alerts */}
        {/* {renderAttendanceAlerts()} */}

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
  lecturerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  notificationButton: {
    position: 'absolute',
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
  lecturerInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  classCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  classDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  classDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  classDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  attendanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  attendanceText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  attendancePercentage: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  classActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  alertsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 2,
  },
  alertSubject: {
    fontSize: 12,
    color: '#6b7280',
  },
  alertAction: {
    padding: 4,
  },
  noAlertsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#10b981',
    marginTop: 10,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});

export default LecturerDashboard;