// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBsUFZZoX1lEwd4JtUwhn_FcdPk5nWCLUc",
  authDomain: "attendanceapp-ee8d5.firebaseapp.com",
  projectId: "attendanceapp-ee8d5",
  storageBucket: "attendanceapp-ee8d5.firebasestorage.app",
  messagingSenderId: "190486058256",
  appId: "1:190486058256:web:72edfd7d611df5782e8195",
  measurementId: "G-92Y0XZETNG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
const db = getFirestore(app);

export { auth, db };