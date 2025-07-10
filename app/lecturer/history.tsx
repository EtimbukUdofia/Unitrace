import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AuthContext } from '@/context/AuthContext';

const LecturerHistoryPage = () => {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Move fetchSessions outside useEffect so it can be reused
  const fetchSessions = async () => {
    if (!user?.uid) return;
    setLoading(true);
    const sessionsQuery = query(
      collection(db, 'class_sessions'),
      where('lecturer.id', '==', user.uid),
      where('status', 'in', ['completed', 'ended'])
    );
    const snap = await getDocs(sessionsQuery);
    const sessionData = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        subject: data.subject || data.courseTitle || '',
        code: data.code || data.classCode || '',
        location: typeof data.location === 'object' && data.location !== null ? (data.location.name || JSON.stringify(data.location)) : (data.location || ''),
        status: data.status || '',
        time: data.end_time ? (data.end_time.seconds ? new Date(data.end_time.seconds * 1000).toLocaleString() : new Date(data.end_time as any).toLocaleString()) : '',
        end_time: data.end_time ? (data.end_time.seconds ? data.end_time.seconds : new Date(data.end_time as any).getTime()/1000) : 0,
      };
    })
    .sort((a, b) => b.end_time - a.end_time); // Sort by end_time descending
    setSessions(sessionData);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [user?.uid]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
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
        <Text style={styles.headerTitle}>Class History</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        style={styles.list}
        ListHeaderComponent={<Text style={styles.listHeader}>Previously Held Classes</Text>}
        renderItem={({ item }) => (
          <View style={styles.sessionRow}>
            <Ionicons name="time-outline" size={22} color="#8b5cf6" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.sessionName}>{item.subject} ({item.code})</Text>
              <Text style={styles.sessionLocation}>{item.location}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
            </View>
            {/* <Text style={[styles.statusText, { color: item.status === 'completed' ? '#10b981' : '#6b7280' }]}>{item.status}</Text> */}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyFeed}>No previous classes found.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  list: { flex: 1, backgroundColor: '#fff' },
  listHeader: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', margin: 16 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sessionName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  sessionLocation: { fontSize: 14, color: '#6b7280' },
  statusText: { fontSize: 14, fontWeight: 'bold', marginLeft: 12 },
  timeText: { fontSize: 12, color: '#6b7280'},
  emptyFeed: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default LecturerHistoryPage; 