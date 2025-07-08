import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

// TypeScript interfaces
interface Student {
  id: string;
  name: string;
  studentId: string;
  profileImage?: string;
  checkedIn: boolean;
  checkInTime?: string;
  isLate?: boolean;
  attendanceRate: number;
}

interface ClassInfo {
  id: string;
  subject: string;
  code: string;
  time: string;
  location: string;
  studentsEnrolled: number;
  startTime: string;
  endTime: string;
  qrActive: boolean;
}

const LiveAttendanceView: React.FC = () => {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [classStarted, setClassStarted] = useState<boolean>(false);

  // Mock class data
  const [classInfo] = useState<ClassInfo>({
    id: '1',
    subject: 'Data Structures & Algorithms',
    code: 'CSC301',
    time: '10:00 AM - 12:00 PM',
    location: 'Lab 301',
    studentsEnrolled: 45,
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    qrActive: true,
  });

  // Mock student data with real-time updates
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      studentId: 'ST2021001',
      checkedIn: true,
      checkInTime: '9:58 AM',
      isLate: false,
      attendanceRate: 95,
    },
    {
      id: '2',
      name: 'Bob Smith',
      studentId: 'ST2021002',
      checkedIn: true,
      checkInTime: '10:05 AM',
      isLate: true,
      attendanceRate: 78,
    },
    {
      id: '3',
      name: 'Carol Davis',
      studentId: 'ST2021003',
      checkedIn: false,
      attendanceRate: 92,
    },
    {
      id: '4',
      name: 'David Wilson',
      studentId: 'ST2021004',
      checkedIn: true,
      checkInTime: '9:55 AM',
      isLate: false,
      attendanceRate: 88,
    },
    {
      id: '5',
      name: 'Emma Brown',
      studentId: 'ST2021005',
      checkedIn: false,
      attendanceRate: 67,
    },
    {
      id: '6',
      name: 'Frank Miller',
      studentId: 'ST2021006',
      checkedIn: true,
      checkInTime: '10:12 AM',
      isLate: true,
      attendanceRate: 85,
    },
    {
      id: '7',
      name: 'Grace Taylor',
      studentId: 'ST2021007',
      checkedIn: false,
      attendanceRate: 91,
    },
    {
      id: '8',
      name: 'Henry Anderson',
      studentId: 'ST2021008',
      checkedIn: true,
      checkInTime: '10:03 AM',
      isLate: true,
      attendanceRate: 73,
    },
  ]);

  const [recentCheckIns, setRecentCheckIns] = useState<Student[]>([]);

  // Simulate real-time check-ins
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate random student check-ins
      const absentStudents = students.filter(s => !s.checkedIn);
      if (absentStudents.length > 0 && Math.random() < 0.3) {
        const randomStudent = absentStudents[Math.floor(Math.random() * absentStudents.length)];
        const now = new Date();
        const checkInTime = now.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        
        setStudents(prev => 
          prev.map(s => 
            s.id === randomStudent.id 
              ? { ...s, checkedIn: true, checkInTime, isLate: now.getHours() >= 10 && now.getMinutes() > 15 }
              : s
          )
        );
        
        setRecentCheckIns(prev => [
          { ...randomStudent, checkInTime, checkedIn: true },
          ...prev.slice(0, 4)
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [students, autoRefresh]);

  // Computed values
  const attendanceStats = React.useMemo(() => {
    const present = students.filter(s => s.checkedIn).length;
    const absent = students.length - present;
    const late = students.filter(s => s.checkedIn && s.isLate).length;
    const attendanceRate = Math.round((present / students.length) * 100);

    return { present, absent, late, attendanceRate };
  }, [students]);

  // Filtered students based on search and filter
  const filteredStudents = React.useMemo(() => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(student => 
        selectedFilter === 'present' ? student.checkedIn : !student.checkedIn
      );
    }

    return filtered.sort((a, b) => {
      if (a.checkedIn && !b.checkedIn) return -1;
      if (!a.checkedIn && b.checkedIn) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [students, searchQuery, selectedFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleStartClass = () => {
    Alert.alert(
      "Start Class",
      "Are you sure you want to start the class? This will activate the QR code for attendance.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Start", onPress: () => setClassStarted(true) }
      ]
    );
  };

  const handleEndClass = () => {
    Alert.alert(
      "End Class",
      "Are you sure you want to end the class? This will stop accepting attendance.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End", onPress: () => router.back() }
      ]
    );
  };

  const handleManualCheckIn = (studentId: string) => {
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    setStudents(prev => 
      prev.map(s => 
        s.id === studentId 
          ? { ...s, checkedIn: true, checkInTime, isLate: now.getHours() >= 10 && now.getMinutes() > 15 }
          : s
      )
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Attendance</Text>
        <TouchableOpacity 
          onPress={() => setAutoRefresh(!autoRefresh)}
          style={[styles.refreshButton, autoRefresh && styles.refreshButtonActive]}
        >
          <Ionicons name="refresh" size={20} color={autoRefresh ? "#ffffff" : "#6b7280"} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.classInfo}>
        <Text style={styles.classSubject}>{classInfo.subject}</Text>
        <Text style={styles.classDetails}>
          {classInfo.code} • {classInfo.time} • {classInfo.location}
        </Text>
      </View>
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
        <Text style={[styles.statNumber, { color: '#16a34a' }]}>
          {attendanceStats.present}
        </Text>
        <Text style={styles.statLabel}>Present</Text>
      </View>
      
      <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
        <Text style={[styles.statNumber, { color: '#d97706' }]}>
          {attendanceStats.late}
        </Text>
        <Text style={styles.statLabel}>Late</Text>
      </View>
      
      <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
        <Text style={[styles.statNumber, { color: '#dc2626' }]}>
          {attendanceStats.absent}
        </Text>
        <Text style={styles.statLabel}>Absent</Text>
      </View>
      
      <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
        <Text style={[styles.statNumber, { color: '#2563eb' }]}>
          {attendanceStats.attendanceRate}%
        </Text>
        <Text style={styles.statLabel}>Rate</Text>
      </View>
    </View>
  );

  const renderRecentCheckIns = () => (
    <View style={styles.recentCheckIns}>
      <Text style={styles.sectionTitle}>Recent Check-ins</Text>
      {recentCheckIns.length > 0 ? (
        recentCheckIns.map((student, index) => (
          <View key={`${student.id}-${index}`} style={styles.recentCheckInItem}>
            <View style={styles.checkInIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            </View>
            <View style={styles.checkInInfo}>
              <Text style={styles.checkInName}>{student.name}</Text>
              <Text style={styles.checkInTime}>{student.checkInTime}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noRecentText}>No recent check-ins</Text>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>
      
      <View style={styles.filterButtons}>
        {['all', 'present', 'absent'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter && styles.filterButtonTextActive
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStudentItem = ({ item }: { item: Student }) => (
    <View style={styles.studentItem}>
      <View style={styles.studentAvatar}>
        <Text style={styles.studentInitials}>
          {item.name.split(' ').map(n => n[0]).join('')}
        </Text>
        {item.checkedIn && (
          <View style={styles.checkInBadge}>
            <Ionicons name="checkmark" size={12} color="#ffffff" />
          </View>
        )}
      </View>
      
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentId}>{item.studentId}</Text>
        <View style={styles.studentMeta}>
          <Text style={styles.attendanceRate}>
            {item.attendanceRate}% attendance
          </Text>
          {item.checkedIn && (
            <Text style={[styles.checkInStatus, item.isLate && styles.lateStatus]}>
              {item.isLate ? 'Late' : 'On time'} • {item.checkInTime}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.studentActions}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: item.checkedIn ? '#dcfce7' : '#fee2e2' }
        ]}>
          <Ionicons 
            name={item.checkedIn ? "checkmark-circle" : "close-circle"} 
            size={20} 
            color={item.checkedIn ? "#16a34a" : "#dc2626"} 
          />
        </View>
        
        {!item.checkedIn && (
          <TouchableOpacity
            style={styles.manualCheckInButton}
            onPress={() => handleManualCheckIn(item.id)}
          >
            <Text style={styles.manualCheckInText}>Mark Present</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={styles.qrButton}
        onPress={() => setShowQRModal(true)}
      >
        <Ionicons name="qr-code" size={20} color="#ffffff" />
        <Text style={styles.qrButtonText}>Show QR Code</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.endButton}
        onPress={handleEndClass}
      >
        <Ionicons name="stop" size={20} color="#ffffff" />
        <Text style={styles.endButtonText}>End Class</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStatsCards()}
        {renderRecentCheckIns()}
        {renderFilters()}
        
        <View style={styles.studentsList}>
          <Text style={styles.sectionTitle}>
            Students ({filteredStudents.length})
          </Text>
          <FlatList
            data={filteredStudents}
            renderItem={renderStudentItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
      
      {renderActionButtons()}
      
      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>Attendance QR Code</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodePlaceholder}>
                <Ionicons name="qr-code" size={120} color="#6b7280" />
              </View>
              <Text style={styles.qrCodeText}>
                Students can scan this QR code to mark their attendance
              </Text>
            </View>
            
            <View style={styles.qrInfo}>
              <Text style={styles.qrInfoText}>
                Class: {classInfo.subject} ({classInfo.code})
              </Text>
              <Text style={styles.qrInfoText}>
                Time: {classInfo.time}
              </Text>
              <Text style={styles.qrInfoText}>
                Location: {classInfo.location}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  refreshButtonActive: {
    backgroundColor: '#3b82f6',
  },
  classInfo: {
    alignItems: 'center',
  },
  classSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  recentCheckIns: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  recentCheckInItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkInIndicator: {
    marginRight: 12,
  },
  checkInInfo: {
    flex: 1,
  },
  checkInName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  checkInTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  noRecentText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  studentsList: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    position: 'relative',
  },
  studentInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  checkInBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  attendanceRate: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 10,
  },
  checkInStatus: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  lateStatus: {
    color: '#d97706',
  },
  studentActions: {
    alignItems: 'center',
  },
  statusIndicator: {
    padding: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  manualCheckInButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  manualCheckInText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 10,
  },
  qrButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  endButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  endButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModal: {
    width: width * 0.9,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    maxHeight: height * 0.8,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  qrCodeText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  qrInfo: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
  },
  qrInfoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
});

export default LiveAttendanceView;