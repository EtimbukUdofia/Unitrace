import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import * as Location from 'expo-location';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('student'); // 'student' or 'lecturer'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    matricNo: '',
    department: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const auth = getAuth();
  const firestore = getFirestore();

  const handleInputChange = (field:any, value:any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (isLogin) {
      // Login logic
      try {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        console.log("login clicked")
      } catch (error) {
        console.error('Login error:', error);
      }
    } else {
      // Registration logic
      if (formData.password !== formData.confirmPassword) {
        // Handle password mismatch
        console.error('Passwords do not match');
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        // Optionally update display name
        await updateProfile(user, { displayName: formData.fullName });
        
        // For students, request location permission and capture initial location
        let initialLocationData = null;
        if (userType === 'student') {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.LocationAccuracy.High,
              });
              initialLocationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: new Date(),
              };
            }
          } catch (locationError) {
            console.log('Location permission not granted during registration:', locationError);
          }
        }
        
        // Save user data to Firestore
        await setDoc(doc(firestore, userType , user.uid), {
          email: formData.email,
          fullName: formData.fullName,
          role: userType,
          // Only include matricNo for students
          ...(userType === 'student' && { matricNo: formData.matricNo }),
          // matricNo: formData.matricNo,
          department: formData.department,
          // createdAt: new Date().toISOString(),
          createdAt: Timestamp.now(),
          // Include initial location for students
          ...(userType === 'student' && initialLocationData && { lastKnownLocation: initialLocationData }),
        });
        // Force reload of user data after registration to ensure AuthContext picks up the new Firestore document
        await auth.currentUser?.reload();
      } catch (error) {
        // Handle registration error (show message to user)
        console.error('Registration error:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      matricNo: '',
      department: '',
    });
  };

  const switchAuthMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const switchUserType = (type:'lecturer'|'student') => {
    setUserType(type);
    resetForm();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <View style={styles.backgroundContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="school-outline" size={50} color="#ffffff" />
              </View>
              <Text style={styles.appTitle}>UniTrace</Text>
              <Text style={styles.appSubtitle}>
                {isLogin ? 'Welcome back!' : 'Join us today!'}
              </Text>
            </View>

            {/* User Type Selector */}
            <View style={styles.userTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'student' && styles.userTypeButtonActive
                ]}
                onPress={() => switchUserType('student')}
              >
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={userType === 'student' ? '#667eea' : '#ffffff'} 
                />
                <Text style={[
                  styles.userTypeText,
                  userType === 'student' && styles.userTypeTextActive
                ]}>
                  Student
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'lecturer' && styles.userTypeButtonActive
                ]}
                onPress={() => switchUserType('lecturer')}
              >
                <Ionicons 
                  name="person-circle-outline" 
                  size={20} 
                  color={userType === 'lecturer' ? '#667eea' : '#ffffff'} 
                />
                <Text style={[
                  styles.userTypeText,
                  userType === 'lecturer' && styles.userTypeTextActive
                ]}>
                  Lecturer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {isLogin 
                    ? `Sign in to your ${userType} account` 
                    : `Create your ${userType} account`
                  }
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.inputContainer}>
                {!isLogin && (
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Full Name"
                      placeholderTextColor="#9ca3af"
                      value={formData.fullName}
                      onChangeText={(text) => handleInputChange('fullName', text)}
                    />
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email Address"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                  />
                </View>

                {!isLogin && userType === 'student' && (
                  <View style={styles.inputWrapper}>
                    <Ionicons name="card-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Matric No"
                      placeholderTextColor="#9ca3af"
                      value={formData.matricNo}
                      onChangeText={(text) => handleInputChange('matricNo', text)}
                    />
                  </View>
                )}

                {!isLogin && (
                  <View style={styles.inputWrapper}>
                    <Ionicons name="business-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={userType === 'student' ? 'Department' : 'Faculty/Department'}
                      placeholderTextColor="#9ca3af"
                      value={formData.department}
                      onChangeText={(text) => handleInputChange('department', text)}
                    />
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#9ca3af" 
                    />
                  </TouchableOpacity>
                </View>

                {!isLogin && (
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm Password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showConfirmPassword}
                      value={formData.confirmPassword}
                      onChangeText={(text) => handleInputChange('confirmPassword', text)}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color="#9ca3af" 
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Forgot Password */}
              {isLogin && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <View style={styles.submitButtonContent}>
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Switch Auth Mode */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={switchAuthMode}>
                  <Text style={styles.switchLink}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userTypeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4,
    marginBottom: 30,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  userTypeButtonActive: {
    backgroundColor: '#ffffff',
  },
  userTypeText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  userTypeTextActive: {
    color: '#667eea',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonContent: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: '#6b7280',
    fontSize: 14,
  },
  switchLink: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthScreen;