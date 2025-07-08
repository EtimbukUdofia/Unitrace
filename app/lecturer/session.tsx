import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { collection, onSnapshot, addDoc, Timestamp, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AuthContext } from '@/context/AuthContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

// const { width } = Dimensions.get('window');

const GenerateQRPage = () => {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const qrRef = useRef<QRCode | null>(null);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  type LocationType = {
    id: string;
    name: string;
    coordinates: { latitude: number; longitude: number }[];
    createdAt?: any;
  };

  const [formData, setFormData] = useState<{
    subject: string;
    classCode: string;
    sessionTitle: string;
    duration: string;
    selectedLocation: LocationType | null;
    notes: string;
  }>({
    subject: '',
    classCode: '',
    sessionTitle: '',
    duration: '120', // in minutes
    selectedLocation: null,
    notes: '',
  });

  // Real locations from Firestore
  const [locations, setLocations] = useState<any[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  const { user, userData } = useContext(AuthContext);

  useEffect(() => {
    setLocationsLoading(true);
    const unsub = onSnapshot(collection(db, 'location'), (snap) => {
      setLocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLocationsLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // If classId is provided, pre-fill form with class data
    if (classId) {
      loadClassData(classId);
    }
  }, [classId]);

  useEffect(() => {
    if (!qrGenerated || !sessionId) return;
    // Listen for session status changes
    const sessionRef = doc(db, 'class_sessions', sessionId);
    const unsub = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'ended') {
          // Reset state to allow new session
          setQrGenerated(false);
          setSessionId('');
          setFormData({
            subject: '',
            classCode: '',
            sessionTitle: '',
            duration: '120',
            selectedLocation: null,
            notes: '',
          });
        }
      }
    });
    return () => unsub();
  }, [qrGenerated, sessionId]);

  const loadClassData = (id:any) => {
    // Mock function to load class data
    const classData = {
      subject: 'Data Structures & Algorithms',
      classCode: 'CSC301',
      sessionTitle: 'Arrays and Linked Lists',
    };
    
    setFormData(prev => ({
      ...prev,
      ...classData,
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationSelect = (location:any) => {
    setFormData(prev => ({
      ...prev,
      selectedLocation: location,
    }));
    setShowLocationModal(false);
  };

  const validateForm = () => {
    const { subject, classCode, sessionTitle, selectedLocation } = formData;
    
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter the subject name');
      return false;
    }
    
    if (!classCode.trim()) {
      Alert.alert('Error', 'Please enter the class code');
      return false;
    }
    
    if (!sessionTitle.trim()) {
      Alert.alert('Error', 'Please enter the session title');
      return false;
    }
    
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location');
      return false;
    }
    
    return true;
  };

  const handleGenerateQR = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // 1. Prevent lecturer from starting more than one active/pending session
      const lecturerQuery = query(
        collection(db, 'class_sessions'),
        where('lecturer.id', '==', user?.uid || ''),
        where('status', 'in', ['pending', 'active', 'ongoing'])
      );
      const lecturerSessionsSnap = await getDocs(lecturerQuery);
      if (!lecturerSessionsSnap.empty) {
        setLoading(false);
        Alert.alert('Not Allowed', 'You already have an ongoing or pending class session. Please end it before starting a new one.');
        return;
      }

      // 2. Prevent duplicate course session by any lecturer
      const courseQuery = query(
        collection(db, 'class_sessions'),
        where('classCode', '==', formData.classCode),
        where('status', 'in', ['pending', 'active', 'ongoing'])
      );
      const courseSessionsSnap = await getDocs(courseQuery);
      if (!courseSessionsSnap.empty) {
        setLoading(false);
        Alert.alert('Not Allowed', 'A session for this course is already ongoing or pending. Please wait until it is ended before creating another.');
        return;
      }

      // Create the class session in Firestore
      const docRef = await addDoc(collection(db, 'class_sessions'), {
        subject: formData.subject,
        classCode: formData.classCode,
        sessionTitle: formData.sessionTitle,
        duration: formData.duration,
        location: formData.selectedLocation ? {
          id: formData.selectedLocation.id,
          name: formData.selectedLocation.name,
          coordinates: formData.selectedLocation.coordinates,
        } : null,
        notes: formData.notes,
        createdAt: Timestamp.now(),
        status: 'pending',
        start_time: null,
        end_time: null,
        lecturer: user && userData ? {
          id: user.uid,
          name: userData.fullName || user.displayName || '',
          email: user.email || '',
        } : null,
      });
      setSessionId(docRef.id);
      setQrGenerated(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = () => {
    Alert.alert(
      'Start Session',
      'Are you ready to start the attendance session? Students will be able to scan the QR code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Session',
          onPress: async () => {
            // Update session document: set start_time and status
            if (sessionId) {
              const sessionRef = collection(db, 'class_sessions');
              await updateDoc(doc(sessionRef, sessionId), {
                start_time: Timestamp.now(),
                status: 'active',
              });
            }
            // Navigate to live attendance view
            router.push({ pathname: '/lecturer/live-attendance/[sessionId]', params: { sessionId: String(sessionId) } });
          },
        },
      ]
    );
  };

  const handleSaveQR = async () => {
    if (!qrRef.current) return;
    setSaving(true);
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot save image without gallery permission.');
        setSaving(false);
        return;
      }
      (qrRef.current as any).toDataURL(async (data: string) => {
        try {
          const fileUri = FileSystem.cacheDirectory + `qr_${sessionId}.png`;
          await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.Base64 });
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('UniTrace QRCodes', asset, false);
          Alert.alert('Success', 'QR Code saved to gallery!');
        } catch (err) {
          Alert.alert('Error', 'Failed to save QR code.');
        } finally {
          setSaving(false);
        }
      });
    } catch (error) {
      setSaving(false);
      Alert.alert('Error', 'Failed to save QR code.');
    }
  };

  // Share QR code as image
  const handleShareQR = async () => {
    if (!qrRef.current) return;
    setSharing(true);
    try {
      (qrRef.current as any).toDataURL(async (data: string) => {
        const fileUri = FileSystem.cacheDirectory + `qr_${sessionId}.png`;
        await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(fileUri, { mimeType: 'image/png', dialogTitle: 'Share QR Code' });
        setSharing(false);
      });
    } catch (error) {
      setSharing(false);
      Alert.alert('Error', 'Failed to share QR code.');
    }
  };

  const renderLocationModal = () => (
    <Modal
      visible={showLocationModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowLocationModal(false)}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Location</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.modalContent}>
          {locationsLoading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
          ) : locations.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="location-outline" size={40} color="#9ca3af" />
              <Text style={{ color: '#9ca3af', marginTop: 10 }}>No locations found.</Text>
            </View>
          ) : locations.map((location: LocationType) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationItem,
                formData.selectedLocation?.id === location.id && styles.selectedLocationItem,
              ]}
              onPress={() => handleLocationSelect(location)}
            >
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationCapacity}>
                  {location.coordinates?.length || 0} corners
                </Text>
                {location.createdAt && (
                  <Text style={styles.locationCreatedAt}>
                    Added: {new Date(location.createdAt.seconds * 1000).toLocaleDateString()}
                  </Text>
                )}
              </View>
              {formData.selectedLocation?.id === location.id && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Class Session Details</Text>
      
      {/* Subject */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Subject *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.subject}
          onChangeText={(value) => handleInputChange('subject', value)}
          placeholder="Enter subject name"
          placeholderTextColor="#9ca3af"
        />
      </View>
      
      {/* Class Code */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Class Code *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.classCode}
          onChangeText={(value) => handleInputChange('classCode', value)}
          placeholder="e.g., CSC301"
          placeholderTextColor="#9ca3af"
        />
      </View>
      
      {/* Session Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Session Title *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.sessionTitle}
          onChangeText={(value) => handleInputChange('sessionTitle', value)}
          placeholder="Enter session/topic title"
          placeholderTextColor="#9ca3af"
        />
      </View>
      
      {/* Duration */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Duration (minutes)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.duration}
          onChangeText={(value) => handleInputChange('duration', value)}
          placeholder="120"
          keyboardType="numeric"
          placeholderTextColor="#9ca3af"
        />
      </View>
      
      {/* Location Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location *</Text>
        <TouchableOpacity
          style={[styles.textInput, styles.locationSelector]}
          onPress={() => setShowLocationModal(true)}
        >
          {formData.selectedLocation ? (
            <View style={styles.selectedLocationDisplay}>
              <Text style={styles.selectedLocationText}>
                {formData.selectedLocation.name}
              </Text>
              <Text style={styles.selectedLocationSubtext}>
                {formData.selectedLocation.coordinates?.length || 0} corners
              </Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Select class location</Text>
          )}
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      {/* Notes */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Notes (Optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.notes}
          onChangeText={(value) => handleInputChange('notes', value)}
          placeholder="Additional notes for students"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderQRCode = () => (
    <View style={styles.qrContainer}>
      <Text style={styles.sectionTitle}>Session QR Code</Text>
      <View style={styles.qrCodeWrapper}>
        <QRCode
          value={sessionId}
          size={200}
          ref={qrRef}
        />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionId}>Session ID: {sessionId}</Text>
        <Text style={styles.sessionDetails}>
          {formData.subject} ({formData.classCode})
        </Text>
        <Text style={styles.sessionLocation}>
          📍 {formData.selectedLocation?.name}
        </Text>
      </View>
      <View style={styles.qrActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton, saving && { opacity: 0.6 }]}
          onPress={handleSaveQR}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Ionicons name="download" size={20} color="#3b82f6" />
          )}
          <Text style={styles.secondaryButtonText}>Save QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleShareQR}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Ionicons name="share-social" size={20} color="#3b82f6" />
          )}
          <Text style={styles.secondaryButtonText}>Share QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleStartSession}
          disabled={saving || sharing}
        >
          <Ionicons name="play" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Start Session</Text>
        </TouchableOpacity>
      </View>
      {/* Back to Dashboard Button */}
      <TouchableOpacity
        style={[styles.actionButton, { marginTop: 20, backgroundColor: '#3b82f6' }, (saving || sharing) && { opacity: 0.6 }]}
        onPress={() => router.replace('/lecturer')}
        disabled={saving || sharing}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate QR Code</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!qrGenerated ? renderForm() : renderQRCode()}
        
        {!qrGenerated && (
          <View style={styles.generateButtonContainer}>
            <TouchableOpacity
              style={[styles.generateButton, loading && styles.disabledButton]}
              onPress={handleGenerateQR}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="qr-code" size={24} color="#ffffff" />
              )}
              <Text style={styles.generateButtonText}>
                {loading ? 'Generating...' : 'Generate QR Code'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {renderLocationModal()}
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  locationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedLocationDisplay: {
    flex: 1,
  },
  selectedLocationText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  selectedLocationSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  generateButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCodeWrapper: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  sessionInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sessionId: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  sessionDetails: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sessionLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  qrActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#10b981',
    marginLeft: 10,
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  locationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedLocationItem: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  locationCapacity: {
    fontSize: 12,
    color: '#9ca3af',
  },
  locationCreatedAt: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  bottomPadding: {
    height: 20,
  },
});

export default GenerateQRPage;