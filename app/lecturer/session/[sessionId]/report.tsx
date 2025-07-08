import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function generateCSV(data: any[]) {
  if (!data.length) return '';
  const header = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  return [header, ...rows].join('\n');
}

const SessionReportPage = () => {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(sessionId);
    if (!sessionId) return;
    setLoading(true);
    // Listen to session document
    const sessionRef = doc(db, 'class_sessions', String(sessionId));
    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSession({ id: docSnap.id, ...docSnap.data() });
      } else {
        setSession(null);
      }
      setLoading(false);
    });
    // Listen to attendance logs for this session
    const logsQuery = query(
      collection(db, 'attendance_logs'),
      where('sessionId', '==', sessionRef)
    );
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(logs.map((log: any) => ({
        id: log.id,
        name: log.studentName || 'Student',
        matricNo: log.matricNo || '',
        present: log.present !== false,
        time: log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : '',
      })));
      setLoading(false);
    });
    return () => {
      unsubSession();
      unsubLogs();
    };
  }, [sessionId]);

  const total = students.length;
  const present = students.filter(s => s.present).length;
  const absent = total - present;
  const percent = total ? Math.round((present / total) * 100) : 0;

  const handleExportCSV = async () => {
    if (!students.length) {
      Alert.alert('No Data', 'No attendance data to export.');
      return;
    }
    const csv = generateCSV(students.map(s => ({
      Name: s.name,
      MatricNo: s.matricNo,
      Status: s.present ? 'Present' : 'Absent',
      Time: s.time,
    })));
    const fileUri = FileSystem.cacheDirectory + `attendance_${sessionId}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Attendance CSV' });
  };

  if (loading || !session) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  // If session is pending, show session details and a message
  if (session.status === 'pending') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Session Report</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{session.subject || session.courseTitle} ({session.code || session.classCode})</Text>
          <Text style={styles.sessionLocation}>📍 {session.location?.name || session.location_name || 'No location'}</Text>
          <Text style={styles.sessionStatus}>Status: Not Started</Text>
          <Text style={styles.sessionTime}>Start: Not started</Text>
        </View>
        <View style={[styles.centered, { flex: 1 }] }>
          <Ionicons name="time-outline" size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, color: '#6b7280', textAlign: 'center', marginBottom: 12 }}>
            Session not started yet.
          </Text>
          <Text style={{ color: '#9ca3af', textAlign: 'center', marginBottom: 24 }}>
            Start the session to view analytics and attendance data.
          </Text>
          <TouchableOpacity style={styles.exportButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.exportButtonText}>Back to Session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Report</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle}>{session.subject || session.courseTitle} ({session.code || session.classCode})</Text>
        <Text style={styles.sessionLocation}>📍 {session.location || session.location_name}</Text>
        <Text style={styles.sessionStatus}>Status: {session.status === 'ended' ? 'Ended' : 'Ongoing'}</Text>
        <Text style={styles.sessionTime}>Start: {session.start_time ? new Date(session.start_time.seconds * 1000).toLocaleString() : ''}</Text>
        {session.end_time && <Text style={styles.sessionTime}>End: {session.end_time ? new Date(session.end_time.seconds * 1000).toLocaleString() : ''}</Text>}
      </View>
      <View style={styles.analyticsBox}>
        <Text style={styles.analyticsText}>Total: {total}</Text>
        <Text style={styles.analyticsText}>Present: {present}</Text>
        <Text style={styles.analyticsText}>Absent: {absent}</Text>
        <Text style={styles.analyticsText}>Attendance: {percent}%</Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
          <Ionicons name="download" size={18} color="#fff" />
          <Text style={styles.exportButtonText}>Export CSV</Text>
        </TouchableOpacity>
      </View>
      {students.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#9ca3af', fontSize: 16, marginBottom: 12 }}>No students attended this session yet.</Text>
          <TouchableOpacity style={styles.exportButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.exportButtonText}>Back to Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          style={styles.list}
          ListHeaderComponent={<Text style={styles.listHeader}>Attendance List</Text>}
          renderItem={({ item }) => (
            <View style={styles.studentRow}>
              <Ionicons name={item.present ? 'checkmark-circle' : 'close-circle'} size={22} color={item.present ? '#10b981' : '#ef4444'} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentMatric}>{item.matricNo}</Text>
              </View>
              <Text style={[styles.statusText, { color: item.present ? '#10b981' : '#ef4444' }]}>{item.present ? 'Present' : 'Absent'}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyFeed}>No students attended.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  sessionInfo: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  sessionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  sessionLocation: { fontSize: 16, color: '#3b82f6', marginTop: 4 },
  sessionStatus: { fontSize: 14, color: '#f59e0b', marginTop: 8 },
  sessionTime: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  analyticsBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  analyticsText: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  exportButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  exportButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  list: { flex: 1, backgroundColor: '#fff' },
  listHeader: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', margin: 16 },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  studentName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  studentMatric: { fontSize: 14, color: '#6b7280' },
  statusText: { fontSize: 14, fontWeight: 'bold', marginLeft: 12 },
  timeText: { fontSize: 12, color: '#6b7280', marginLeft: 12 },
  emptyFeed: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default SessionReportPage; 