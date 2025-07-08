import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { AuthContext } from '@/context/AuthContext';
import { AttendanceContext } from '@/context/AttendanceContext';

const StudentProfileScreen = () => {
  const { user, userData, isLoading } = useContext(AuthContext);
  const { clearOngoingLecture } = useContext(AttendanceContext);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();

  // Use actual user data from AuthContext instead of mock data
  const [studentData, setStudentData] = useState({
    name: userData?.fullName || 'Student Name',
    email: userData?.email || 'student@university.edu',
    phone: userData?.phone || '+1 (555) 123-4567',
    studentId: userData?.matricNo || 'ST12345',
    department: userData?.department || 'Computer Science',
    program: 'Bachelor of Science',
    semester: '6th Semester',
    batch: '2022-2026',
    cgpa: '3.85',
    profileImage: null,
    address: userData?.address || '123 University Street, Campus City',
    emergencyContact: userData?.emergencyContact || '+1 (555) 987-6543',
    dateOfBirth: userData?.dateOfBirth || '1999-03-15',
    bloodGroup: userData?.bloodGroup || 'O+',
  });

  const [editedData, setEditedData] = useState(studentData);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [attendanceStats] = useState({
    totalClasses: 80,
    attended: 68,
    percentage: 85,
    currentStreak: 7,
    bestMonth: 'May 2025',
    worstSubject: 'Mathematics',
  });

  useEffect(() => {
    setEditedData(studentData);
  }, [studentData]);

  // Update student data when userData changes
  useEffect(() => {
    if (userData) {
      setStudentData({
        name: userData.fullName || 'Student Name',
        email: userData.email || 'student@university.edu',
        phone: userData.phone || '+1 (555) 123-4567',
        studentId: userData.matricNo || 'ST12345',
        department: userData.department || 'Computer Science',
        program: 'Bachelor of Science',
        semester: '6th Semester',
        batch: '2022-2026',
        cgpa: '3.85',
        profileImage: null,
        address: userData.address || '123 University Street, Campus City',
        emergencyContact: userData.emergencyContact || '+1 (555) 987-6543',
        dateOfBirth: userData.dateOfBirth || '1999-03-15',
        bloodGroup: userData.bloodGroup || 'O+',
      });
    }
  }, [userData]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleSave = () => {
    // Validate data
    if (!editedData.name.trim() || !editedData.email.trim() || !editedData.phone.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Save data (API call would go here)
    setStudentData(editedData);
    setEditMode(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleCancel = () => {
    setEditedData(studentData);
    setEditMode(false);
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Change password (API call would go here)
    Alert.alert('Success', 'Password changed successfully');
    setShowChangePasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              
              // Clear any ongoing lecture data
              clearOngoingLecture();
              
              // Sign out from Firebase
              await signOut(auth);
              
              // Navigate to auth screen
              router.replace('/auth');
              
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(
                'Logout Error',
                'There was an error logging out. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#1f2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Profile</Text>
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => editMode ? handleSave() : setEditMode(true)}
      >
        <Text style={styles.editButtonText}>
          {editMode ? 'Save' : 'Edit'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfileHeader = () => (
    <View style={styles.profileHeaderContainer}>
      <View style={styles.profileImageContainer}>
        {studentData.profileImage ? (
          <Image source={{ uri: studentData.profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Ionicons name="person" size={50} color="#6b7280" />
          </View>
        )}
        {editMode && (
          <TouchableOpacity style={styles.editImageButton}>
            <Ionicons name="camera" size={16} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>
          {isLoading ? 'Loading...' : studentData.name}
        </Text>
        <Text style={styles.profileId}>
          {isLoading ? 'Loading...' : studentData.studentId}
        </Text>
        <Text style={styles.profileDepartment}>
          {isLoading ? 'Loading...' : studentData.department}
        </Text>
        
        <View style={styles.profileStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{attendanceStats.percentage}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          {/* <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{studentData.cgpa}</Text>
            <Text style={styles.statLabel}>CGPA</Text>
          </View> */}
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{attendanceStats.currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Full Name *</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.readOnlyInput]}
          value={editedData.name}
          onChangeText={(text) => setEditedData({...editedData, name: text})}
          editable={editMode}
          placeholder="Enter full name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Email Address *</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.readOnlyInput]}
          value={editedData.email}
          onChangeText={(text) => setEditedData({...editedData, email: text})}
          editable={editMode}
          placeholder="Enter email address"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Phone Number *</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.readOnlyInput]}
          value={editedData.phone}
          onChangeText={(text) => setEditedData({...editedData, phone: text})}
          editable={editMode}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Date of Birth</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.readOnlyInput]}
          value={editedData.dateOfBirth}
          onChangeText={(text) => setEditedData({...editedData, dateOfBirth: text})}
          editable={editMode}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Blood Group</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.readOnlyInput]}
          value={editedData.bloodGroup}
          onChangeText={(text) => setEditedData({...editedData, bloodGroup: text})}
          editable={editMode}
          placeholder="Enter blood group"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Address</Text>
        <TextInput
          style={[styles.textInput, styles.textArea, !editMode && styles.readOnlyInput]}
          value={editedData.address}
          onChangeText={(text) => setEditedData({...editedData, address: text})}
          editable={editMode}
          placeholder="Enter address"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Emergency Contact</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.readOnlyInput]}
          value={editedData.emergencyContact}
          onChangeText={(text) => setEditedData({...editedData, emergencyContact: text})}
          editable={editMode}
          placeholder="Enter emergency contact"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderAcademicInfo = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Academic Information</Text>
      
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Student ID</Text>
          <Text style={styles.infoValue}>{studentData.studentId}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{studentData.department}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Program</Text>
          <Text style={styles.infoValue}>{studentData.program}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Current Semester</Text>
          <Text style={styles.infoValue}>{studentData.semester}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Batch</Text>
          <Text style={styles.infoValue}>{studentData.batch}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Current CGPA</Text>
          <Text style={styles.infoValue}>{studentData.cgpa}</Text>
        </View>
      </View>
    </View>
  );

  const renderAttendanceInsights = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Attendance Insights</Text>
      
      <View style={styles.insightGrid}>
        <View style={styles.insightItem}>
          <View style={styles.insightIcon}>
            <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightValue}>{attendanceStats.totalClasses}</Text>
            <Text style={styles.insightLabel}>Total Classes</Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <View style={styles.insightIcon}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightValue}>{attendanceStats.attended}</Text>
            <Text style={styles.insightLabel}>Classes Attended</Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <View style={styles.insightIcon}>
            <Ionicons name="flame-outline" size={20} color="#f59e0b" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightValue}>{attendanceStats.currentStreak}</Text>
            <Text style={styles.insightLabel}>Current Streak</Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <View style={styles.insightIcon}>
            <Ionicons name="star-outline" size={20} color="#8b5cf6" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightValue}>{attendanceStats.bestMonth}</Text>
            <Text style={styles.insightLabel}>Best Month</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>App Settings</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="notifications-outline" size={20} color="#6b7280" />
          <Text style={styles.settingText}>Push Notifications</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
          thumbColor={notificationsEnabled ? '#3b82f6' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="location-outline" size={20} color="#6b7280" />
          <Text style={styles.settingText}>Location Services</Text>
        </View>
        <Switch
          value={locationEnabled}
          onValueChange={setLocationEnabled}
          trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
          thumbColor={locationEnabled ? '#3b82f6' : '#9ca3af'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="finger-print-outline" size={20} color="#6b7280" />
          <Text style={styles.settingText}>Biometric Login</Text>
        </View>
        <Switch
          value={biometricEnabled}
          onValueChange={setBiometricEnabled}
          trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
          thumbColor={biometricEnabled ? '#3b82f6' : '#9ca3af'}
        />
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Account Actions</Text>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => setShowChangePasswordModal(true)}
      >
        <Ionicons name="key-outline" size={20} color="#3b82f6" />
        <Text style={styles.actionButtonText}>Change Password</Text>
        <Ionicons name="chevron-forward" size={16} color="#6b7280" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="download-outline" size={20} color="#10b981" />
        <Text style={styles.actionButtonText}>Download Data</Text>
        <Ionicons name="chevron-forward" size={16} color="#6b7280" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="help-circle-outline" size={20} color="#8b5cf6" />
        <Text style={styles.actionButtonText}>Help & Support</Text>
        <Ionicons name="chevron-forward" size={16} color="#6b7280" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="document-text-outline" size={20} color="#6b7280" />
        <Text style={styles.actionButtonText}>Privacy Policy</Text>
        <Ionicons name="chevron-forward" size={16} color="#6b7280" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        <Ionicons 
          name={isLoggingOut ? "hourglass-outline" : "log-out-outline"} 
          size={20} 
          color="#ef4444" 
        />
        <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Text>
        {!isLoggingOut && <Ionicons name="chevron-forward" size={16} color="#ef4444" />}
      </TouchableOpacity>
    </View>
  );

  const renderChangePasswordModal = () => (
    <Modal
      visible={showChangePasswordModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowChangePasswordModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                placeholder="Enter current password"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                placeholder="Confirm new password"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowChangePasswordModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.confirmButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderProfileHeader()}
        {renderPersonalInfo()}
        {renderAcademicInfo()}
        {renderAttendanceInsights()}
        {renderSettings()}
        {renderActions()}

        {editMode && (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelEditButton} onPress={handleCancel}>
              <Text style={styles.cancelEditButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveEditButton} onPress={handleSave}>
              <Text style={styles.saveEditButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderChangePasswordModal()}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  profileHeaderContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileDepartment: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  sectionContainer: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  readOnlyInput: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  insightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  insightLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    color: '#ef4444',
  },
  logoutButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
  editActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelEditButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  saveEditButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveEditButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalContent: {
    padding: 20,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});

export default StudentProfileScreen;