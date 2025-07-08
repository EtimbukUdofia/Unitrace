import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AuthContext } from '@/context/AuthContext';

const StudentSessionDetails = () => {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [session, setSession] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !user?.uid) return;
    setLoading(true);
    // Listen to session document
    const sessionRef = doc(db, 'class_sessions', String(sessionId));
    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSession({ id: docSnap.id, ...docSnap.data() });
      }
    });
    // Listen to attendance log for this student and session
    const logsQuery = query(
      collection(db, 'attendance_logs'),
      where('sessionId', '==', sessionRef),
      where('userId', '==', user.uid)
    );
    const unsubLog = onSnapshot(logsQuery, (snap) => {
      if (!snap.empty) {
        setAttendanceStatus('present');
      } else {
        setAttendanceStatus('absent');
      }
      setLoading(false);
    });
    return () => {
      unsubSession();
      unsubLog();
    };
  }, [sessionId, user?.uid]);

  if (loading || !session) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Details</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle}>{session.subject || session.courseTitle} ({session.code || session.classCode})</Text>
        <Text style={styles.sessionLocation}>📍 {session.location || session.location_name}</Text>
        <Text style={styles.sessionStatus}>
          Status: {session.status === 'ended' ? 'Ended' : 'Ongoing'}
        </Text>
        <Text style={styles.sessionTime}>Start: {session.start_time ? new Date(session.start_time.seconds * 1000).toLocaleString() : ''}</Text>
        {session.end_time && <Text style={styles.sessionTime}>End: {session.end_time ? new Date(session.end_time.seconds * 1000).toLocaleString() : ''}</Text>}
        <Text style={styles.attendanceStatus}>
          Attendance: {attendanceStatus === 'present' ? 'Present' : 'Absent'}
        </Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.dashboardButton} onPress={() => router.replace('/student')}> 
          <Ionicons name="home" size={20} color="#fff" />
          <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
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
  attendanceStatus: { fontSize: 16, color: '#10b981', marginTop: 12, fontWeight: 'bold' },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  dashboardButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 10 },
  dashboardButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default StudentSessionDetails; 