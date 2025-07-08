import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { getStatusIcon, getStatusColor } from '@/utils/utils';
import { Ionicons } from '@expo/vector-icons';
import { AttendanceContext } from '@/context/AttendanceContext';
import { AuthContext } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useRouter } from 'expo-router';

type PropType = {
  styles: any,
}

const TodaysClasses: React.FC<PropType> = ({ styles }) => {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [ongoingClasses, setOngoingClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    // Listen for attendance_logs where userId == user.uid and session is ongoing
    const q = query(
      collection(db, 'attendance_logs'),
      where('userId', '==', user.uid),
      where('currentIsInGeofence', '==', true) // or another field to indicate valid attendance
    );
    let sessionUnsubs: (() => void)[] = [];
    let sessionMap: Record<string, any> = {};
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // For each attendance log, fetch the session details if session is ongoing
      const logs = snapshot.docs.map(doc => doc.data());
      const sessionIds = logs.map(log => log.sessionId?.id || log.sessionId);
      // Clean up previous listeners
      sessionUnsubs.forEach(unsub => unsub());
      sessionUnsubs = [];
      sessionMap = {};
      if (sessionIds.length === 0) {
        setOngoingClasses([]);
        setLoading(false);
        return;
      }
      let completed = 0;
      sessionIds.forEach((id) => {
        const sessionDocRef = doc(db, 'class_sessions', id);
        const unsub = onSnapshot(sessionDocRef, (sessionDocSnap) => {
          completed++;
          if (sessionDocSnap.exists() && ['active', 'ongoing'].includes(sessionDocSnap.data().status)) {
            sessionMap[id] = { id, ...sessionDocSnap.data() };
          } else {
            // Remove session if ended
            delete sessionMap[id];
          }
          // Only update state when all listeners have fired at least once
          if (completed === sessionIds.length) {
            setOngoingClasses(Object.values(sessionMap));
            setLoading(false);
          }
        });
        sessionUnsubs.push(unsub);
      });
    });
    return () => {
      unsubscribe();
      sessionUnsubs.forEach(unsub => unsub());
    };
  }, [user?.uid]);

  const handleViewDetails = (sessionId: string) => {
    router.push({ pathname: '/student/session/[sessionId]/details', params: { sessionId } });
  };

  if (loading) {
    return <View style={styles.classesContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.classesContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ongoing Class</Text>
      </View>
      {ongoingClasses.length === 0 && (
        <View style={styles.noClassesContainer}>
          <Ionicons name="calendar-outline" size={40} color="#9ca3af" />
          <Text style={styles.noClassesText}>No Ongoing Class</Text>
        </View>
      )}
      {ongoingClasses.map((session) => (
        <View key={session.id} style={styles.classItem}>
          <View style={styles.classIcon}>
            <Ionicons
              name={getStatusIcon(session.status)}
              size={20}
              color={getStatusColor(session.status)}
            />
          </View>
          <View style={styles.classContent}>
            <Text style={styles.classSubject}>{session.subject || session.courseTitle}   {session.code || session.classCode}</Text>
            <Text style={styles.classDetails}>{
              (typeof session.lecturer === 'object' && session.lecturer?.name) ? session.lecturer.name : (session.lecturer || session.lecturerName)
            } • {
              (typeof session.location === 'object' && session.location?.name) ? session.location.name : (session.location || session.location_name)
            }</Text>
            <Text style={styles.classTime}>{session.time || (session.start_time && new Date(session.start_time.seconds * 1000).toLocaleTimeString())}</Text>
          </View>
          <View style={styles.classStatus}>
            <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>Ongoing</Text>
            <TouchableOpacity style={styles.detailsButton} onPress={() => handleViewDetails(session.id)}>
              <Ionicons name="eye" size={18} color="#3b82f6" />
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  )
}

export default TodaysClasses