import React, { useState, useEffect, useRef } from 'react';
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

// const { width } = Dimensions.get('window');

const GenerateQRPage = () => {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const qrRef = useRef<QRCode | null>(null);

  // Form state
  type LocationType = {
    id: number;
    name: string;
    building: string;
    capacity: number;
    coordinates: {
      latitude: number;
      longitude: number;
      radius: number;
    };
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

  // Preset locations with boundary coordinates
  const [locations] = useState([
    {
      id: 1,
      name: 'Computer Lab 301',
      building: 'Science Block A',
      capacity: 45,
      coordinates: {
        latitude: 6.5244,
        longitude: 3.3792,
        radius: 50, // meters
      },
    },
    {
      id: 2,
      name: 'Lecture Room 205',
      building: 'Main Academic Block',
      capacity: 60,
      coordinates: {
        latitude: 6.5246,
        longitude: 3.3794,
        radius: 30,
      },
    },
    {
      id: 3,
      name: 'Software Engineering Lab',
      building: 'Engineering Block',
      capacity: 35,
      coordinates: {
        latitude: 6.5248,
        longitude: 3.3796,
        radius: 40,
      },
    },
    {
      id: 4,
      name: 'Seminar Hall 401',
      building: 'Conference Center',
      capacity: 80,
      coordinates: {
        latitude: 6.5250,
        longitude: 3.3798,
        radius: 60,
      },
    },
    {
      id: 5,
      name: 'Database Lab',
      building: 'Science Block B',
      capacity: 40,
      coordinates: {
        latitude: 6.5252,
        longitude: 3.3800,
        radius: 45,
      },
    },
  ]);

  // Mock subjects for auto-fill (in real app, fetch from user's subjects)
  const [userSubjects] = useState([
    { code: 'CSC301', name: 'Data Structures & Algorithms' },
    { code: 'CSC401', name: 'Database Management Systems' },
    { code: 'CSC501', name: 'Software Engineering' },
    { code: 'MTH201', name: 'Discrete Mathematics' },
  ]);

  useEffect(() => {
    // If classId is provided, pre-fill form with class data
    if (classId) {
      loadClassData(classId);
    }
  }, [classId]);

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

  const generateSessionId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`.toUpperCase();
  };

  const handleInputChange = (field, value) => {
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      setQrGenerated(true);
      
      // In real app, save session data to backend
      console.log('Session created:', {
        sessionId: newSessionId,
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'active',
      });
      
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
          onPress: () => {
            // Navigate to live attendance view
            router.navigate(`/lecturer/live-attendance/${sessionId}`);
          },
        },
      ]
    );
  };

  const handleSaveQR = () => {
    // In real app, implement QR code saving functionality
    Alert.alert('Success', 'QR Code saved to gallery');
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
          {locations.map((location) => (
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
                <Text style={styles.locationBuilding}>{location.building}</Text>
                <Text style={styles.locationCapacity}>
                  Capacity: {location.capacity} students
                </Text>
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
                {formData.selectedLocation.building}
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
          value={JSON.stringify({
            sessionId,
            subject: formData.subject,
            classCode: formData.classCode,
            location: formData.selectedLocation,
            timestamp: Date.now(),
          })}
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
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleSaveQR}
        >
          <Ionicons name="download" size={20} color="#3b82f6" />
          <Text style={styles.secondaryButtonText}>Save QR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleStartSession}
        >
          <Ionicons name="play" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Start Session</Text>
        </TouchableOpacity>
      </View>
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
  locationBuilding: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  locationCapacity: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bottomPadding: {
    height: 20,
  },
});

export default GenerateQRPage;