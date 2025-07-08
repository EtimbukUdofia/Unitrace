import React, { useState, useEffect, useRef, useContext } from 'react';
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, DocumentData, DocumentReference, getDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import * as Location from "expo-location";
import { AttendanceContext } from '@/context/AttendanceContext';
import { AuthContext } from '@/context/AuthContext';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

function isPointInPolygon(point: { latitude: number, longitude: number }, polygon: { latitude: number, longitude: number }[]): boolean {
  const { latitude: x, longitude: y } = point;
  let inside = false;

  console.log("polygon:", polygon);
  console.log("X:", x);
  console.log("y:", y);
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude, yi = polygon[i].longitude;
    const xj = polygon[j].latitude, yj = polygon[j].longitude;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const QRScannerScreen = () => {
  const { setCurrentLectureData, ongoingLecture } = useContext(AttendanceContext);
  const {user, initialLocation, userData} = useContext(AuthContext);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  // const [locationStatus, locationPermission] = Location.useForegroundPermissions();
  const [hasForegroundLocationPermission, setHasForegroundLocationPermission] = useState<boolean | null>(null);
  const [hasBackgroundLocationPermission, setHasBackgroundLocationPermission] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<undefined | Location.LocationObject>(undefined);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  type AttendanceDisplayData = {
    title: string;
    code: string;
    lecturer: string;
    location: string;
    time: string;
    date: string;
    status: string;

    location_id?: DocumentReference; // Add location_id to the type
    locationData?: [] | DocumentData | { coordinates: { latitude: number; longitude: number }[] }; // Add resolved location data
    start_time?: Timestamp | Date; // Add class start time
    end_time?: Timestamp | Date; // Add class end time
    attendanceLogDocId?: string; // To store reference to background log document
  };
  const [attendanceDisplayData, setAttendanceDisplayData] = useState<AttendanceDisplayData | DocumentData | null>(null);
  const [isFocused, setIsFocused] = useState(false); // Changed from null to false
  const [cameraKey, setCameraKey] = useState(0); // Add key to force camera remount
  const router = useRouter();

  // if (locationStatus === null) {
  //   locationPermission();
  // }

  // Only get location on entering page, and clean up on leave
  // useEffect(() => {
  //   let isMounted = true;
  //   const getCurrentLocation = async () => {
  //     try {
  //       const currentLocation = await Location.getCurrentPositionAsync({
  //         accuracy: Location.LocationAccuracy.Highest
  //       });
  //       if (isMounted) setLocation(currentLocation);
  //     } catch (error) {
  //       if (isMounted) setLocation(undefined);
  //     }
  //   };
  //   getCurrentLocation();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, []);

  // useEffect(() => {
  //   const getCurrentLocation = async () => {
  //     let currentLocation = await Location.getCurrentPositionAsync({
  //       accuracy: Location.LocationAccuracy.Highest
  //     });
  //     setLocation(currentLocation);
  //     console.log("Current Location:", currentLocation);
  //   };

  //   getCurrentLocation();
  // });

  useEffect(() => {
    const requestAllPermissions = async () => {
      // Foreground Location
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      setHasForegroundLocationPermission(foregroundStatus === 'granted');

      // Background Location (if foreground is granted)
      let backgroundStatus = 'denied';
      if (foregroundStatus === 'granted') {
        if (Platform.OS === 'ios') {
          const { status } = await Location.requestBackgroundPermissionsAsync();
          backgroundStatus = status;
        } else { // Android specific
          // On Android, background location typically needs to be requested separately if not 'always' was granted initially
          const { status } = await Location.requestBackgroundPermissionsAsync();
          backgroundStatus = status;
        }
      }
      setHasBackgroundLocationPermission(backgroundStatus === 'granted');

      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please grant foreground location access to verify your attendance location.'
        );
      }
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Background Location Recommended',
          'Allow "Always" location access to continuously verify your presence in the lecture, even when the app is in the background. You can enable this in your device settings. Without it, continuous geofence checks may not work.'
        );
      }
    };
    requestAllPermissions();
  }, []);

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


      const initializeScreen = async () => {
        await getCameraPermissions(); // Ensure camera permissions are checked

        if (hasForegroundLocationPermission) {
          await getCurrentUserLocation(); // Get initial location
        } else {
          // Re-request if somehow not granted, or inform user
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            setHasForegroundLocationPermission(true);
            await getCurrentUserLocation();
          } else {
            console.warn('Foreground location permission not granted on focus, and user denied again.');
            // Optionally, direct user to settings here
          }
        }
        startScanAnimation();
      };

      initializeScreen();

      return () => {
        setIsFocused(false);
        // Clean up animations when leaving screen
        scanLineAnim.stopAnimation();
        pulseAnim.stopAnimation();
        successAnim.stopAnimation();

        // Reset flash when leaving
        setFlashOn(false);
      };
    }, [hasForegroundLocationPermission, hasBackgroundLocationPermission])
  );

  const getCurrentUserLocation = async () => {
    try {
      // setLoading(true);
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Highest,
      });
      setCurrentLocation(locationResult);
      console.log('Current Foreground Location:', locationResult.coords);
    } catch (error) {
      console.error('Error getting current location:', error);
      
      // If we have initial location, we can still proceed
      if (initialLocation) {
        console.log('Using initial location as fallback for QR scanning');
        // Don't show error alert, just log the issue
      } else {
        Alert.alert(
          'Location Error',
          'Could not get your current location. Please ensure location services are enabled and permissions are granted.',
          [{ text: 'OK', onPress: () => router.back() }] // Go back if location is critical
        );
      }
      setCurrentLocation(undefined);
    } finally {
      setLoading(false);
    }
  };

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

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading || !isFocused) return;

    setScanned(true);
    setLoading(true);

    try {
      // Use current location if available, otherwise fall back to initial location
      const locationToUse = currentLocation || initialLocation;
      
      if (!locationToUse) {
        throw new Error('Location not available. Please ensure location services are enabled and permissions are granted.');
      }

      // 1. Fetch class session details
      const classSessionDocRef = doc(db, 'class_sessions', data);
      const classSessionDocSnap = await getDoc(classSessionDocRef);
      const classSessionData = classSessionDocSnap.data() as AttendanceDisplayData;

      if (!classSessionData || !classSessionData.location) {
        throw new Error('Class session or location not found.');
      }
      console.log("passed");

      // Check for existing attendance log for this user and session
      const attendanceLogQuery = query(
        collection(db, 'attendance_logs'),
        where('userId', '==', user?.uid),
        where('sessionId', '==', classSessionDocSnap.id)
      );
      const attendanceLogSnap = await getDocs(attendanceLogQuery);
      if (!attendanceLogSnap.empty) {
        setLoading(false);
        Alert.alert(
          'Already Marked',
          'You have already marked attendance for this class. You cannot scan the QR code again.',
          [
            { text: 'OK', onPress: resetScanner }
          ]
        );
        return;
      }

      // 2. Use the embedded location object
      const locationData = classSessionData.location;
      console.log(locationData);

      if (!locationData || !locationData.coordinates || locationData.coordinates.length < 3) {
        throw new Error('Geofence polygon coordinates not found for this location.');
      }

      const polygon = locationData.coordinates;

      // 3. Perform Foreground Geofence Check
      const currentPoint = {
        latitude: locationToUse.coords.latitude,
        longitude: locationToUse.coords.longitude,
      };

      const isInGeofence = isPointInPolygon({latitude: 7.6240666, longitude: 4.206619}, polygon);

      if (!isInGeofence) {
        throw new Error('You are outside the designated lecture area. Cannot mark attendance.');
      }

      console.log('Initial scan: User is within geofence.');

      // 4. Mark Attendance (if within geofence)
      // You might have a separate Firebase function for marking attendance,
      // which would also record the initial location check.
      // For this example, let's create a log entry in Firestore.
      if (!user?.uid) {
        throw new Error('User ID is not available. Please log in again.');
      }
      const attendanceLogRef = await addDoc(collection(db, 'attendance_logs'), {
        userId: user.uid, // Store as string for easier querying
        sessionId: classSessionDocSnap.id, // Store as string for easier querying
        timestamp: Timestamp.now(),
        studentName: userData?.fullName || '',
        matricNo: userData?.matricNo || '',
        initialLocation: {
          latitude: currentPoint.latitude,
          longitude: currentPoint.longitude,
          isInGeofence: true,
          locationSource: currentLocation ? 'current' : 'initial', // Track which location was used
        },
        // You can add more fields related to the class/user here
        // Store location data and times for background task reference
        locationData: locationData, // Pass the polygon data
        start_time: classSessionData.start_time,
        end_time: classSessionData.end_time,
        // Initialize fields for background checks
        currentIsInGeofence: true,
        lastCheckedAt: Timestamp.now(),
        halfDurationChecked: false, // Flag to ensure half-duration check is only logged once
        lastGeofenceStatus: true, // Track last status for notifications
      });

      // Pass the log document ID to the ongoingLecture context for background task
      const updatedLectureData: AttendanceDisplayData = {
        ...classSessionData,
        id: classSessionDocSnap.id, // Add the session document ID
        attendanceLogDocId: attendanceLogRef.id, // Store the log ID
      };
      setCurrentLectureData(updatedLectureData);

      // 5. Start Background Location Tracking
      // if (hasBackgroundLocationPermission && hasNotificationPermission) {
      //   await startBackgroundLocationTracking(updatedLectureData);
      // } else {
      //   Alert.alert(
      //     'Background Tracking Limited',
      //     'Background location tracking and/or notifications are not fully permitted. Continuous geofence checks may be limited.'
      //   );
      // }

      setLoading(false);
      showSuccessAnimation();

    } catch (error) {
      console.error('QR Scan/Geofence Error:', error);
      showErrorAlert(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : 'An unexpected error occurred during QR scan or geofence check.'
      );
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (qrData: string) => {
    try {
      const docsnap = await getDoc(doc(db, 'class_session', qrData));
      const data = docsnap.data();
      if (!data) {
        throw new Error('Class session not found');
      }

      setCurrentLectureData(data);
      setLoading(false);
      showSuccessAnimation();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Effect to watch for context update and set display data
  useEffect(() => {
    if (ongoingLecture) {
      setAttendanceDisplayData(ongoingLecture);
    }
  }, [ongoingLecture]);

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

  const showErrorAlert = (message: string) => {
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
    setAttendanceDisplayData(null);
    setFlashOn(false);
    successAnim.setValue(0);

    // Always restart animations
    setTimeout(() => {
      startScanAnimation();
    }, 100);
  };

  const toggleFlash = () => {
    if (isFocused && hasPermission) {
      setFlashOn(!flashOn);
    }
  };

  const refreshLocation = async () => {
    try {
      setLoading(true);
      await getCurrentUserLocation();
    } catch (error) {
      console.error('Error refreshing location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => {
    Alert.alert(
      'Manual Entry',
      'Contact your lecturer if you cannot scan the QR code.',
      [{ text: 'OK' }]
    );
  };

  if (hasPermission === null || hasForegroundLocationPermission === null || hasBackgroundLocationPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.permissionText}>Requesting permissions...</Text>
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

  if (hasForegroundLocationPermission === false) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="location-outline" size={80} color="#9ca3af" />
        <Text style={styles.permissionTitle}>Location Permission Required</Text>
        <Text style={styles.permissionText}>
          Please allow location access to verify your attendance.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => Location.requestForegroundPermissionsAsync()}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        {/* You might want a button to open app settings here for persistent denial */}
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
        <View style={styles.headerRight}>
          {/* Location Status Indicator */}
          <TouchableOpacity style={styles.locationStatus} onPress={refreshLocation}>
            <Ionicons 
              name="location" 
              size={16} 
              color={currentLocation ? "#10b981" : initialLocation ? "#f59e0b" : "#ef4444"} 
            />
            <Text style={[
              styles.locationStatusText,
              { color: currentLocation ? "#10b981" : initialLocation ? "#f59e0b" : "#ef4444" }
            ]}>
              {currentLocation ? "Live" : initialLocation ? "Saved" : "None"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Ionicons
              name={flashOn ? "flash" : "flash-off"}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
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
              : currentLocation 
                ? 'Location ready - Hold steady and ensure good lighting'
                : initialLocation 
                  ? 'Using saved location - Hold steady and ensure good lighting'
                  : 'Getting location... - Please wait'
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
            {attendanceDisplayData && (
              <View style={styles.successDetails}>
                <Text style={styles.successSubject}>{attendanceDisplayData.title}</Text>
                <Text style={styles.successInfo}>
                  {attendanceDisplayData.lecturer} • {attendanceDisplayData.location}
                </Text>
                <Text style={styles.successTime}>
                  {attendanceDisplayData.date} at {attendanceDisplayData.time}
                </Text>
              </View>
            )}
            {/* )} */}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  locationStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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