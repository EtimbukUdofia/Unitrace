import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, collection, onSnapshot, query, where, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AuthContext } from '@/context/AuthContext';
import Button from '@/components/Button';
import QRCode from 'react-native-qrcode-svg';

const LiveAttendancePage = () => {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [session, setSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [addMatric, setAddMatric] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // studentId being updated
  const [showQRModal, setShowQRModal] = useState(false);
  const timerRef = useRef<any>(null);

  // Fetch session details and listen to attendance logs
  useEffect(() => {
    console.log(sessionId)
    if (!sessionId) return;
    setLoading(true);
    // Listen to session document
    const sessionRef = doc(db, 'class_sessions', String(sessionId));
    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data: any = { id: docSnap.id, ...docSnap.data() };
        setSession(data);
        setSessionEnded(data.status === 'ended');
      }
    });
    // Listen to attendance logs for this session
    const logsQuery = query(
      collection(db, 'attendance_logs'),
      where('sessionId', '==', String(sessionId))
    );
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setStudents(logs.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        name: log.studentName || 'Student',
        matricNo: log.matricNo || '',
        time: log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : '',
        present: log.present !== false, // default to true if not set
        logRef: doc(db, 'attendance_logs', log.id),
      })));
    });
    setLoading(false);
    return () => {
      unsubSession();
      unsubLogs();
    };
  }, [sessionId]);

  // Timer logic
  useEffect(() => {
    if (session && !sessionEnded) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [session, sessionEnded]);

  const handleEndSession = () => {
    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: async () => {
          setSessionEnded(true);
          if (session?.id) {
            await updateDoc(doc(db, 'class_sessions', session.id), { status: 'ended', end_time: Timestamp.now() });
          }
        },
      },
    ]);
  };

  // Toggle present/absent
  const handleTogglePresent = async (student: any) => {
    setActionLoading(student.id);
    try {
      await updateDoc(student.logRef, { present: !student.present });
    } finally {
      setActionLoading(null);
    }
  };

  // Remove student from attendance
  const handleRemoveStudent = async (student: any) => {
    Alert.alert('Remove Student', `Remove ${student.name} (${student.matricNo}) from attendance?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          setActionLoading(student.id);
          try {
            await deleteDoc(student.logRef);
          } finally {
            setActionLoading(null);
          }
        }
      }
    ]);
  };

  // Add student by matric number
  const handleAddStudent = async () => {
    if (!addMatric.trim()) return;
    setAddLoading(true);
    try {
      // Find user by matricNo (assuming users collection has matricNo field)
      const usersQuery = query(collection(db, 'student'), where('matricNo', '==', addMatric.trim()));
      const { getDocs } = await import('firebase/firestore');
      const snap = await getDocs(usersQuery);
      if (snap.empty) {
        Alert.alert('Not Found', 'No student found with that matric number.');
        setAddLoading(false);
        return;
      }
      const userDoc = snap.docs[0];
      // Add attendance log
      await addDoc(collection(db, 'attendance_logs'), {
        userId: userDoc.ref,
        sessionId: doc(db, 'class_sessions', String(sessionId)),
        timestamp: Timestamp.now(),
        studentName: userDoc.data().fullName || '',
        matricNo: userDoc.data().matricNo || addMatric.trim(),
        present: true,
      });
      setAddMatric('');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16, fontSize: 16, textAlign: 'center' }}>
          Loading live attendance session...
          {`\n`}
          Please wait while we fetch the session details and attendance logs.
        </Text>
      </View>
    );
  }
  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Attendance</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.centered, { flex: 1 }] }>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, color: '#ef4444', textAlign: 'center', marginBottom: 12 }}>
            Session not found.
          </Text>
          <Text style={{ color: '#9ca3af', textAlign: 'center', marginBottom: 24 }}>
            The session you are looking for does not exist or has been deleted.
          </Text>
          <Button title="Back" onPress={() => router.back()} type="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  // If session is pending, show session details and a Start Session button
  if (session.status === 'pending') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Attendance</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{session.subject || session.courseTitle} ({session.code || session.classCode})</Text>
          <Text style={styles.sessionLocation}>📍 {session.location?.name || session.location_name || 'No location'}</Text>
          <Text style={styles.sessionStatus}>Status: Not Started</Text>
        </View>
        <View style={[styles.centered, { flex: 1 }] }>
          <Ionicons name="time-outline" size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, color: '#6b7280', textAlign: 'center', marginBottom: 12 }}>
            Session not started yet.
          </Text>
          <Text style={{ color: '#9ca3af', textAlign: 'center', marginBottom: 24 }}>
            Press the button below to start the session and enable attendance.
          </Text>
          <Button title="Start Session" onPress={async () => {
            await updateDoc(doc(db, 'class_sessions', session.id), { status: 'active', start_time: Timestamp.now() });
          }} />
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
        <Text style={styles.headerTitle}>Live Attendance</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle}>{session.subject || session.courseTitle} ({session.code || session.classCode})</Text>
        <Text style={styles.sessionLocation}>📍 {session.location?.name || session.location_name || 'No location'}</Text>
        <Text style={styles.sessionStatus}>
          Status: {sessionEnded || session.status === 'ended' ? 'Ended' : 'Ongoing'}
        </Text>
        <Text style={styles.sessionTimer}>Duration: {Math.floor(timer / 60)}:{('0' + (timer % 60)).slice(-2)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', margin: 16 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 }} onPress={() => setShowQRModal(true)}>
          <Ionicons name="qr-code" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>Show QR Code</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.attendanceFeed}>
        <Text style={styles.feedTitle}>Live Attendance Feed</Text>
        <View style={styles.addStudentRow}>
          <TextInput
            style={styles.addStudentInput}
            placeholder="Add by Matric No."
            value={addMatric}
            onChangeText={setAddMatric}
            editable={!addLoading}
          />
          <TouchableOpacity style={styles.addStudentButton} onPress={handleAddStudent} disabled={addLoading}>
            {addLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="add" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
        {students.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
            <Text style={{ color: '#9ca3af', fontSize: 16, marginBottom: 12 }}>No students have marked attendance yet.</Text>
            <Button title="Back to Session" onPress={() => router.back()} type="secondary" />
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.studentRow}>
                <Ionicons name="person-circle" size={28} color={item.present ? "#3b82f6" : "#ef4444"} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentMatric}>{item.matricNo} • {item.time}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleButton, item.present ? styles.present : styles.absent]}
                  onPress={() => handleTogglePresent(item)}
                  disabled={actionLoading === item.id}
                >
                  {actionLoading === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.toggleButtonText}>{item.present ? 'Mark Absent' : 'Mark Present'}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveStudent(item)}
                  disabled={actionLoading === item.id}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyFeed}>No students yet.</Text>}
          />
        )}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.endButton, (sessionEnded || session.status === 'ended') && styles.disabledButton]}
          onPress={handleEndSession}
          disabled={sessionEnded || session.status === 'ended'}
        >
          <Ionicons name="stop" size={20} color="#fff" />
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={showQRModal} transparent animationType="fade" onRequestClose={() => setShowQRModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', width: 320, maxWidth: '90%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Session QR Code</Text>
            <QRCode value={String(sessionId)} size={200} />
            <Text style={{ marginTop: 16, color: '#374151', textAlign: 'center' }}>Students can scan this QR code to mark their attendance for this session.</Text>
            <TouchableOpacity style={{ marginTop: 24, backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }} onPress={() => setShowQRModal(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  sessionTimer: { fontSize: 16, color: '#10b981', marginTop: 8 },
  attendanceFeed: { flex: 1, padding: 20 },
  feedTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  studentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  studentName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  studentMatric: { fontSize: 14, color: '#6b7280' },
  emptyFeed: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  endButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 10 },
  endButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  disabledButton: { opacity: 0.5 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addStudentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  addStudentInput: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff', marginRight: 8 },
  addStudentButton: { backgroundColor: '#3b82f6', padding: 10, borderRadius: 8 },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8 },
  present: { backgroundColor: '#10b981' },
  absent: { backgroundColor: '#ef4444' },
  toggleButtonText: { color: '#fff', fontWeight: 'bold' },
  removeButton: { padding: 8 },
});

export default LiveAttendancePage; 