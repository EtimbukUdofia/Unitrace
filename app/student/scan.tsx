import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

const QRScannerScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [isFocused, setIsFocused] = useState(false); // Changed from null to false
  const [cameraKey, setCameraKey] = useState(0); // Add key to force camera remount
  const router = useRouter();

  // Animation values
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Reset component state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      resetScanner();
      
      // Force camera remount by changing key
      setCameraKey(prev => prev + 1);
      
      // Re-check permissions and start animations
      const initializeCamera = async () => {
        await getCameraPermissions();
        startScanAnimation();
      };
      
      initializeCamera();
      
      return () => {
        setIsFocused(false);
        // Clean up animations when leaving screen
        scanLineAnim.stopAnimation();
        pulseAnim.stopAnimation();
        successAnim.stopAnimation();
        
        // Reset flash when leaving
        setFlashOn(false);
      };
    }, [])
  );

  useEffect(() => {
    // Initial setup only
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  const startScanAnimation = () => {
    if (!isFocused) return;
    
    // Stop any existing animations first
    scanLineAnim.stopAnimation();
    pulseAnim.stopAnimation();
    
    // Reset animation values
    scanLineAnim.setValue(0);
    pulseAnim.setValue(1);
    
    // Scanning line animation
    const scanLineAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation for scan area
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Only start animations if screen is focused
    if (isFocused) {
      scanLineAnimation.start();
      pulseAnimation.start();
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading || !isFocused) return;

    setScanned(true);
    setLoading(true);

    try {
      // Validate QR code format
      // const qrData = JSON.parse(data);
      
      // if (!qrData.classId || !qrData.sessionId || !qrData.timestamp) {
      //   throw new Error('Invalid QR code format');
      // }

      // // Check if QR code is still valid (not expired)
      // const currentTime = new Date().getTime();
      // const qrTime = new Date(qrData.timestamp).getTime();
      // const timeDiff = Math.abs(currentTime - qrTime);
      // const maxValidTime = 10 * 60 * 1000; // 10 minutes

      // if (timeDiff > maxValidTime) {
      //   throw new Error('QR code has expired');
      // }

      // // Simulate API call to mark attendance
      // await markAttendance(qrData);
      await markAttendance(data);

    } catch (error) {
      console.error('QR Scan Error:', error);
      showErrorAlert(error.message);
    }
  };

  const markAttendance = async (qrData) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful response
      const mockResponse = {
        success: true,
        data: {
          subject: 'Data Structures',
          lecturer: 'Dr. Smith',
          location: 'Room 101',
          time: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          date: new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          }),
          status: 'present',
        }
      };

      if (mockResponse.success) {
        setAttendanceData(mockResponse.data);
        setLoading(false);
        showSuccessAnimation();
      } else {
        throw new Error('Failed to mark attendance');
      }

    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const showSuccessAnimation = () => {
    setScanSuccess(true);
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    // Auto close after 3 seconds
    setTimeout(() => {
      router.back();
    }, 3000);
  };

  const showErrorAlert = (message) => {
    setLoading(false);
    Alert.alert(
      'Scan Failed',
      message || 'Unable to process QR code. Please try again.',
      [
        {
          text: 'Retry',
          onPress: resetScanner,
        },
        {
          text: 'Cancel',
          onPress: () => router.back(),
          style: 'cancel',
        },
      ]
    );
  };

  const resetScanner = () => {
    setScanned(false);
    setLoading(false);
    setScanSuccess(false);
    setAttendanceData(null);
    setFlashOn(false);
    successAnim.setValue(0);
    
    // Restart animations if screen is focused
    if (isFocused) {
      setTimeout(() => {
        startScanAnimation();
      }, 100);
    }
  };

  const toggleFlash = () => {
    if (isFocused && hasPermission) {
      setFlashOn(!flashOn);
    }
  };

  const handleManualEntry = () => {
    Alert.alert(
      'Manual Entry',
      'Contact your lecturer if you cannot scan the QR code.',
      [{ text: 'OK' }]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color="#9ca3af" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          Please allow camera access to scan QR codes for attendance.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={getCameraPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <Ionicons 
            name={flashOn ? "flash" : "flash-off"} 
            size={24} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {/* Only render camera when focused and has permission */}
        {isFocused && hasPermission && (
          <CameraView
            key={cameraKey} // Force remount with key
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.camera}
            enableTorch={flashOn}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"]
            }}
          />
        )}

        {/* Scan Overlay */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={styles.overlayTop} />
          
          {/* Middle section with scan area */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            
            {/* Scan Area */}
            <Animated.View 
              style={[
                styles.scanArea,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              {/* Corner indicators */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Scanning line */}
              {scanning && !scanned && !loading && isFocused && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, SCAN_AREA_SIZE - 4],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
            </Animated.View>
            
            <View style={styles.overlaySide} />
          </View>
          
          {/* Bottom overlay */}
          <View style={styles.overlayBottom} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionTitle}>
            {loading ? 'Processing...' : 'Position QR code within frame'}
          </Text>
          <Text style={styles.instructionText}>
            {loading 
              ? 'Please wait while we mark your attendance' 
              : 'Hold steady and ensure good lighting'
            }
          </Text>
        </View>

        {/* Manual Entry Button */}
        <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry}>
          <Ionicons name="create-outline" size={20} color="#ffffff" />
          <Text style={styles.manualButtonText}>Can&apos;t scan? Get help</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Marking attendance...</Text>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={scanSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <Animated.View 
            style={[
              styles.successContainer,
              {
                transform: [
                  { scale: successAnim },
                  {
                    translateY: successAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
                opacity: successAnim,
              },
            ]}
          >
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color="#ffffff" />
            </View>
            <Text style={styles.successTitle}>Attendance Marked!</Text>
            {attendanceData && (
              <View style={styles.successDetails}>
                <Text style={styles.successSubject}>{attendanceData.subject}</Text>
                <Text style={styles.successInfo}>
                  {attendanceData.lecturer} • {attendanceData.location}
                </Text>
                <Text style={styles.successTime}>
                  {attendanceData.date} at {attendanceData.time}
                </Text>
              </View>
            )}
            <Text style={styles.successFooter}>Returning to dashboard...</Text>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  flashButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
    borderColor: '#3b82f6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
  },
  manualButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  manualButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#1f2937',
    marginTop: 15,
    textAlign: 'center',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: '90%',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  successDetails: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  successInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  successTime: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  successFooter: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default QRScannerScreen;