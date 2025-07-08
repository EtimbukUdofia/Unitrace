import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useContext } from 'react'
import { getClassStatusColor, getClassStatusIcon } from '@/utils/utils';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

type PropType = {
  styles: any
}

const LecturerOngoingClass: React.FC<PropType> = ({styles}) => {
  const { user } = useContext(AuthContext);
  const [ongoingClasses, setOngoingClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    // Listen for sessions with status 'active' or 'ongoing' for this lecturer
    const q = query(
      collection(db, 'class_sessions'),
      where('lecturer.id', '==', user.uid),
      where('status', 'in', ['active', 'ongoing', 'pending'])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOngoingClasses(sessions);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleLiveView = (sessionId: string) => {
    router.push({ pathname: '/lecturer/live-attendance/[sessionId]', params: { sessionId } });
  };

  if (loading) {
    return <View style={styles.classesContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.classesContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ongoing Class</Text>
        <Text style={styles.classCount}>{ongoingClasses.length} classes</Text>
      </View>
      {ongoingClasses.length === 0 && (
        <View style={styles.noClassesContainer}>
          <Ionicons name="calendar-outline" size={40} color="#9ca3af" />
          <Text style={styles.noClassesText}>No Ongoing Class</Text>
        </View>
      )}
      {ongoingClasses.map((classItem) => (
        <View key={classItem.id} style={styles.classCard}>
          <View style={styles.classHeader}>
            <View style={styles.classInfo}>
              <Text style={styles.classSubject}>{classItem.subject || classItem.courseTitle}</Text>
              <Text style={styles.classCode}>{classItem.code || classItem.classCode}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getClassStatusColor(classItem.status)}20` }]}> 
              <Ionicons 
                name={getClassStatusIcon(classItem.status)} 
                size={16} 
                color={getClassStatusColor(classItem.status)} 
              />
              <Text style={[styles.statusText, { color: getClassStatusColor(classItem.status) }]}> 
                {classItem.status}
              </Text>
            </View>
          </View>
          <View style={styles.classDetails}>
            <View style={styles.classDetailItem}>
              <Ionicons name="time" size={16} color="#6b7280" />
              <Text style={styles.classDetailText}>{classItem.time || (classItem.start_time && new Date(classItem.start_time.seconds * 1000).toLocaleTimeString())}</Text>
            </View>
            <View style={styles.classDetailItem}>
              <Ionicons name="location" size={16} color="#6b7280" />
              <Text style={styles.classDetailText}>{classItem.location?.name || classItem.location_name || ''}</Text>
            </View>
          </View>
          <View style={styles.attendanceInfo}>
            <Text style={styles.attendanceText}>
              {/* Placeholder: You can fetch studentsEnrolled/studentsPresent if needed */}
              Ongoing
            </Text>
          </View>
          <View style={styles.classActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleLiveView(classItem.id)}
            >
              <Ionicons name="radio" size={16} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Live View</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  )
}

export default LecturerOngoingClass