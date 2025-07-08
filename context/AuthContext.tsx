import { auth, db } from "@/config/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, DocumentData, getDoc, updateDoc } from "firebase/firestore";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import * as Location from "expo-location";

type Role = "student" | "lecturer" | null;
type UserData = DocumentData | undefined;

export const AuthContext = createContext<{
  user: User | null,
  role: Role,
  isLoading: boolean,
  userData: UserData,
  initialLocation: Location.LocationObject | null,
  captureInitialLocation: () => Promise<void>,
}>({
  user: null,
  role: null,
  isLoading: false,
  userData: undefined,
  initialLocation: null,
  captureInitialLocation: async () => {},
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [userData, setUserData] = useState<UserData>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialLocation, setInitialLocation] = useState<Location.LocationObject | null>(null);

  const captureInitialLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.High,
      });

      setInitialLocation(location);
      console.log('Initial location captured:', location.coords);

      // If user is a student, save location to their profile
      if (user && role === 'student') {
        try {
          await updateDoc(doc(db, 'student', user.uid), {
            lastKnownLocation: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: new Date(),
            }
          });
        } catch (error) {
          console.error('Error saving location to user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error capturing initial location:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      setIsLoading(true);
      if (currentUser) {
        try {
          // Try to get from 'student' collection first
          let docSnap = await getDoc(doc(db, "student", currentUser.uid));
          let data = docSnap.exists() ? docSnap.data() : undefined;
          let foundRole = data?.role ?? null;

          // If not found in 'student', try 'lecturer'
          if (!data) {
            docSnap = await getDoc(doc(db, "lecturer", currentUser.uid));
            data = docSnap.exists() ? docSnap.data() : undefined;
            foundRole = data?.role ?? null;
          }

          if (!isMounted) return;
          setUserData(data);
          setRole(foundRole);
          setUser(currentUser);

          // Capture initial location for students
          if (foundRole === 'student') {
            // Check if user has saved location in profile
            if (data?.lastKnownLocation) {
              // Convert saved location to LocationObject format
              const savedLocation: Location.LocationObject = {
                coords: {
                  latitude: data.lastKnownLocation.latitude,
                  longitude: data.lastKnownLocation.longitude,
                  altitude: null,
                  accuracy: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                },
                timestamp: data.lastKnownLocation.timestamp?.toDate?.() || new Date(),
              };
              setInitialLocation(savedLocation);
              console.log('Loaded saved location from profile:', savedLocation.coords);
            }
            
            // Still try to get fresh location
            await captureInitialLocation();
          }
        } catch (error) {
          if (!isMounted) return;
          setUser(null);
          setUserData(undefined);
          setRole(null);
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
        setUserData(undefined);
        setRole(null);
        setInitialLocation(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log(role)
  }, [role]);

  return (
    <AuthContext.Provider value={{ user, role, isLoading, userData, initialLocation, captureInitialLocation }}>
      {children}
    </AuthContext.Provider>
  );
};