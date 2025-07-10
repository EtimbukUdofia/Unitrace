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
  Alert,
  Share,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import Button from '@/components/Button';

const { width } = Dimensions.get('window');

const LecturerReports = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  // const [selectedReportType, setSelectedReportType] = useState('overview'); // overview, attendance, performance

  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalSessions: 0, avgAttendance: 0, totalStudents: 0 });
  const [reloadKey, setReloadKey] = useState(0);

  // const reportTypes = [
  //   { label: 'Overview', value: 'overview', icon: 'stats-chart' },
  //   { label: 'Attendance', value: 'attendance', icon: 'people' },
  //   { label: 'Performance', value: 'performance', icon: 'trending-up' },
  // ];

  const [modalVisible, setModalVisible] = useState(false);
  const [modalCourse, setModalCourse] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalStudentStats, setModalStudentStats] = useState<any[]>([]);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const exportReport = async () => {
    try {
      const reportContent = generateReportContent();
      await Share.share({
        message: reportContent,
        title: 'Attendance Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const generateReportContent = () => {
    return `
ATTENDANCE REPORT

Summary:
- Total Sessions: ${summary.totalSessions}
- Average Attendance: ${summary.avgAttendance}%
- Total Students: ${summary.totalStudents}

Generated on: ${new Date().toLocaleDateString()}
  `;
};

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 80) return '#3b82f6';
    if (percentage >= 70) return '#f59e0b';
    if (percentage >= 60) return '#ef4444';
    return '#dc2626';
  };

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    (async () => {
      // 1. Fetch all sessions for this lecturer
      const sessionsSnap = await getDocs(query(collection(db, 'class_sessions'), where('lecturer.id', '==', user.uid)));
      const sessions = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (sessions.length === 0) {
        setCourseStats([]);
        setSummary({ totalSessions: 0, avgAttendance: 0, totalStudents: 0 });
        setLoading(false);
        return;
      }
      // 2. Group sessions by classCode
      const courseMap: Record<string, any> = {};
      for (const sessionRaw of sessions) {
        const session = sessionRaw as any;
        if (!session.classCode) continue;
        if (!courseMap[session.classCode]) {
          courseMap[session.classCode] = {
            classCode: session.classCode,
            subject: session.subject || '',
            sessions: [],
            attendanceLogs: [],
          };
        }
        courseMap[session.classCode].sessions.push(session);
      }
      // 3. For each session, fetch attendance logs
      let allStudentsSet = new Set<string>();
      let totalAttendance = 0;
      let totalAttendanceCount = 0;
      for (const course of Object.values(courseMap)) {
        for (const session of course.sessions) {
          const logsSnap = await getDocs(query(collection(db, 'attendance_logs'), where('sessionId', '==', session.id)));
          const logs = logsSnap.docs.map(d => d.data());
          course.attendanceLogs.push(...logs);
          // Attendance stats
          const presentCount = logs.filter((l: any) => l.present !== false).length;
          const totalCount = logs.length;
          if (totalCount > 0) {
            totalAttendance += (presentCount / totalCount) * 100;
            totalAttendanceCount++;
          }
          logs.forEach((l: any) => {
            if (l.matricNo) allStudentsSet.add(l.matricNo);
          });
        }
      }
      // 4. Aggregate per course
      const courseStatsArr = Object.values(courseMap).map((course: any) => {
        const sessionCount = course.sessions.length;
        const logs = course.attendanceLogs;
        const present = logs.filter((l: any) => l.present !== false).length;
        const total = logs.length;
        const avgAttendance = total > 0 ? Math.round((present / total) * 100) : 0;
        const uniqueStudents = Array.from(new Set(logs.map((l: any) => l.matricNo))).length;
        return {
          classCode: course.classCode,
          subject: course.subject,
          sessionCount,
          avgAttendance,
          uniqueStudents,
        };
      });
      setCourseStats(courseStatsArr);
      setSummary({
        totalSessions: sessions.length,
        avgAttendance: totalAttendanceCount > 0 ? Math.round(totalAttendance / totalAttendanceCount) : 0,
        totalStudents: allStudentsSet.size,
      });
      setLoading(false);
    })();
  }, [user?.uid, reloadKey]);

  // Remove reportTypes, selectedReportType, and renderReportTypeSelector.
  // Add the search bar just below the header in the return statement:
  const renderOverviewStats = () => (
    <View style={styles.overviewContainer}>
      <Text style={styles.sectionTitle}>Overview Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="book" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.statValue}>{summary.totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="people" size={24} color="#10b981" />
          </View>
          <Text style={[styles.statValue, { color: getAttendanceColor(summary.avgAttendance) }]}>
            {summary.avgAttendance}%
          </Text>
          <Text style={styles.statLabel}>Avg Attendance</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="person-add" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>{summary.totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: '#6b7280', marginTop: 16, fontSize: 16 }}>Loading report...</Text>
        </View>
      );
    }

    if (courseStats.length === 0) {
      return (
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
          <Ionicons name="bar-chart-outline" size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#6b7280', fontSize: 18, marginBottom: 8 }}>No attendance data yet</Text>
          <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>You have not held any classes yet. Start a session to see attendance analytics here.</Text>
        </SafeAreaView>
      );
    }

    const filteredCourseStats = courseStats.filter(course =>
      course.subject?.toLowerCase().includes(searchText.toLowerCase()) ||
      course.classCode?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>Attendance Report</Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 8 }}>Summary</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>Total Sessions</Text>
              <Text style={{ color: '#3b82f6' }}>{summary.totalSessions}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>Average Attendance</Text>
              <Text style={{ color: getAttendanceColor(summary.avgAttendance) }}>{summary.avgAttendance}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>Total Unique Students</Text>
              <Text style={{ color: '#10b981' }}>{summary.totalStudents}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>Per Course</Text>
          {filteredCourseStats.map((course, idx) => (
            <TouchableOpacity key={course.classCode} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }} onPress={() => openCourseModal(course)}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#3b82f6', marginBottom: 4 }}>{course.subject} ({course.classCode})</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#6b7280' }}>Sessions Held</Text>
                <Text style={{ color: '#1f2937' }}>{course.sessionCount}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#6b7280' }}>Average Attendance</Text>
                <Text style={{ color: getAttendanceColor(course.avgAttendance) }}>{course.avgAttendance}%</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6b7280' }}>Unique Students</Text>
                <Text style={{ color: '#10b981' }}>{course.uniqueStudents}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Open modal and fetch stats for a course
  const openCourseModal = (course: any) => {
    setModalCourse(course);
    setModalVisible(true);
    setModalStudentStats([]);
    // Set default date to today if not already set
    setModalDate(new Date());
  };

  // Fetch modal student stats whenever modalCourse or modalDate changes
  useEffect(() => {
    const fetchModalStats = async () => {
      if (!modalCourse || !user?.uid || !modalDate) { // Require date
        setModalStudentStats([]);
        setModalLoading(false);
        return;
      }
      setModalLoading(true);
      setModalStudentStats([]);
      // Fetch all sessions for this course
      const sessionsSnap = await getDocs(query(collection(db, 'class_sessions'), where('classCode', '==', (modalCourse as any).classCode), where('lecturer.id', '==', user.uid)));
      const sessions = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (sessions.length === 0) {
        setModalStudentStats([]);
        setModalLoading(false);
        return;
      }
      // Filter sessions by start_time (date required)
      const dayStart = new Date(modalDate);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(modalDate);
      dayEnd.setHours(23,59,59,999);
      const filteredSessions = sessions.filter(sRaw => {
        const s = sRaw as any;
        return s.start_time && s.start_time.seconds * 1000 >= dayStart.getTime() && s.start_time.seconds * 1000 <= dayEnd.getTime();
      });
      // Fetch all logs for these sessions
      let allLogs: any[] = [];
      for (const session of filteredSessions) {
        const logsSnap = await getDocs(query(collection(db, 'attendance_logs'), where('sessionId', '==', session.id)));
        allLogs.push(...logsSnap.docs.map(d => d.data()));
      }
      // Map each log to a row with matricNo, name, and time
      const statsArr = allLogs.map((log: any) => ({
        matricNo: log.matricNo || '',
        name: log.studentName || '',
        time: log.timestamp ? (log.timestamp.seconds ? new Date(log.timestamp.seconds * 1000) : new Date(log.timestamp)) : null,
      }));
      setModalStudentStats(statsArr);
      setModalLoading(false);
    };
    if (modalVisible && modalCourse && modalDate) {
      fetchModalStats();
    } else {
      setModalStudentStats([]);
      setModalLoading(false);
    }
  }, [modalCourse, modalDate, modalVisible, user?.uid]);

  // Handle date change in modal
  const handleModalDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setModalDate(selectedDate);
    }
  };

  // Download CSV for modal data
  const handleDownloadCSV = async () => {
    if (!modalStudentStats.length) return;
    const header = 'S/N,Matric No,Name,Time\n';
    const rows = modalStudentStats.map((s, i) => `${i + 1},${s.matricNo},${s.name},${s.time ? (typeof s.time === 'string' ? s.time : s.time.toLocaleString()) : ''}`).join('\n');
    const csv = header + rows;
    const fileUri = FileSystem.cacheDirectory + `attendance_${modalCourse.classCode}_${modalDate ? modalDate.toISOString().slice(0,10) : 'all'}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Attendance CSV' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <TouchableOpacity onPress={() => setReloadKey(k => k + 1)} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Ionicons name="reload" size={24} color="#1f2937" />
          )}
        </TouchableOpacity>
      </View>

      {/* Report Type Selector */}
      {/* renderReportTypeSelector() */}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Add the search bar */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12 }}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={{ flex: 1, fontSize: 16, marginLeft: 8, color: '#1f2937', height: 40 }}
              placeholder="Search course by subject or code..."
              placeholderTextColor="#9ca3af"
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
          </View>
        </View>
        {renderContent()}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Per-course drilldown modal */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#1f2937" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>{modalCourse?.subject} ({modalCourse?.classCode})</Text>
            <TouchableOpacity onPress={handleDownloadCSV} disabled={modalLoading || !modalStudentStats.length || !modalDate}>
              <Ionicons name="download" size={24} color={modalLoading || !modalStudentStats.length || !modalDate ? '#d1d5db' : '#3b82f6'} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#f3f4f6' }}>
            <Text style={{ fontSize: 16, color: '#1f2937' }}>Filter by date:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                <Ionicons name="calendar" size={18} color="#3b82f6" />
                <Text style={{ marginLeft: 8, color: '#3b82f6', fontWeight: '500' }}>{modalDate ? modalDate.toLocaleDateString() : 'Select Date'}</Text>
              </TouchableOpacity>
              {modalDate && (
                <TouchableOpacity onPress={() => setModalDate(null)} style={{ backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                  <Text style={{ marginLeft: 4, color: '#ef4444', fontWeight: '500' }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={modalDate || new Date()}
                mode="date"
                display="default"
                onChange={handleModalDateChange}
              />
            )}
          </View>
          {/* Download CSV button */}
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Button
              title="Download CSV"
              onPress={handleDownloadCSV}
              disabled={modalLoading || !modalStudentStats.length || !modalDate}
              type="primary"
              style={{ marginTop: 8, marginBottom: 8 }}
            />
          </View>
          {!modalDate ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
              <Text style={{ color: '#6b7280', fontSize: 16 }}>Please select a date to view attendance logs.</Text>
            </View>
          ) : modalLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={{ color: '#6b7280', marginTop: 16, fontSize: 16 }}>Loading students...</Text>
            </View>
          ) : modalStudentStats.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
              <Text style={{ color: '#6b7280', fontSize: 16 }}>No attendance data for this course on this date.</Text>
            </View>
          ) : (
            <FlatList
              data={modalStudentStats}
              keyExtractor={item => item.matricNo || item.name || Math.random().toString()}
              contentContainerStyle={{ padding: 16 }}
              ListHeaderComponent={
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 8, marginBottom: 8 }}>
                  <Text style={{ flex: 1, fontWeight: 'bold', color: '#1f2937' }}>#</Text>
                  <Text style={{ flex: 2, fontWeight: 'bold', color: '#1f2937' }}>Matric No</Text>
                  <Text style={{ flex: 3, fontWeight: 'bold', color: '#1f2937' }}>Name</Text>
                  <Text style={{ flex: 2, fontWeight: 'bold', color: '#1f2937' }}>Time</Text>
                </View>
              }
              renderItem={({ item, index }) => (
                <View style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                  <Text style={{ flex: 1, color: '#374151' }}>{index + 1}</Text>
                  <Text style={{ flex: 2, color: '#374151' }}>{item.matricNo}</Text>
                  <Text style={{ flex: 3, color: '#374151' }}>{item.name}</Text>
                  <Text style={{ flex: 2, color: '#374151' }}>{item.time ? item.time.toLocaleString() : ''}</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f3f4f6',
  },
  selectedPeriodButton: {
    backgroundColor: '#3b82f6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedPeriodButtonText: {
    color: '#ffffff',
  },
  reportTypeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  reportTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f3f4f6',
  },
  selectedReportTypeButton: {
    backgroundColor: '#3b82f6',
  },
  reportTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
  },
  selectedReportTypeButtonText: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  overviewContainer: {
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
  sectionTitle: {
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
  statCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});

export default LecturerReports;