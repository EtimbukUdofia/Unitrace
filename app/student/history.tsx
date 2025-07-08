import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AuthContext } from '@/context/AuthContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function generateCSV(data: any[]) {
  if (!data.length) return '';
  const header = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  return [header, ...rows].join('\n');
}

const StudentHistoryPage = () => {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    // Listen to attendance_logs for this student
    const logsQuery = query(
      collection(db, 'attendance_logs'),
      where('userId', '==', user.uid)
    );
    const unsubLogs = onSnapshot(logsQuery, async (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Fetch session details for each log
      const sessionPromises = logs.map(async (log) => {
        const sessionDoc = await getDoc(log.sessionId);
        return {
          id: log.id,
          subject: sessionDoc.exists() ? (sessionDoc.data().subject || sessionDoc.data().courseTitle) : '',
          code: sessionDoc.exists() ? (sessionDoc.data().code || sessionDoc.data().classCode) : '',
          location: sessionDoc.exists() ? (sessionDoc.data().location || sessionDoc.data().location_name) : '',
          status: sessionDoc.exists() ? sessionDoc.data().status : '',
          time: log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : '',
          present: log.present !== false,
        };
      });
      const sessionData = await Promise.all(sessionPromises);
      setSessions(sessionData);
      setLoading(false);
    });
    return () => unsubLogs();
  }, [user?.uid]);

  const total = sessions.length;
  const present = sessions.filter(s => s.present).length;
  const absent = total - present;
  const percent = total ? Math.round((present / total) * 100) : 0;

  const handleExportCSV = async () => {
    if (!sessions.length) {
      Alert.alert('No Data', 'No attendance data to export.');
      return;
    }
    const csv = generateCSV(sessions.map(s => ({
      Subject: s.subject,
      Code: s.code,
      Location: s.location,
      Status: s.status,
      Time: s.time,
      Attendance: s.present ? 'Present' : 'Absent',
    })));
    const fileUri = FileSystem.cacheDirectory + `attendance_history_${user.uid}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Attendance CSV' });
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <View style={{ width: 24 }} />
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
      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        style={styles.list}
        ListHeaderComponent={<Text style={styles.listHeader}>Attendance List</Text>}
        renderItem={({ item }) => (
          <View style={styles.sessionRow}>
            <Ionicons name={item.present ? 'checkmark-circle' : 'close-circle'} size={22} color={item.present ? '#10b981' : '#ef4444'} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.sessionName}>{item.subject} ({item.code})</Text>
              <Text style={styles.sessionLocation}>{item.location}</Text>
            </View>
            <Text style={[styles.statusText, { color: item.present ? '#10b981' : '#ef4444' }]}>{item.present ? 'Present' : 'Absent'}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyFeed}>No attendance records found.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  analyticsBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  analyticsText: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  exportButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  exportButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  list: { flex: 1, backgroundColor: '#fff' },
  listHeader: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', margin: 16 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sessionName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  sessionLocation: { fontSize: 14, color: '#6b7280' },
  statusText: { fontSize: 14, fontWeight: 'bold', marginLeft: 12 },
  timeText: { fontSize: 12, color: '#6b7280', marginLeft: 12 },
  emptyFeed: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default StudentHistoryPage;