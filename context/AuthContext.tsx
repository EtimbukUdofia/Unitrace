import { auth, db } from "@/config/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, DocumentData, getDoc } from "firebase/firestore";
import { createContext, PropsWithChildren, useEffect, useState } from "react";

type Role = "student" | "lecturer" | null;
type UserData = DocumentData | undefined;

export const AuthContext = createContext<{
  user: User | null,
  role: Role,
  isLoading: boolean,
  userData: UserData,
}>({
  user: null,
  role: null,
  isLoading: false,
  userData: undefined,
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [userData, setUserData] = useState<UserData>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
    <AuthContext.Provider value={{ user, role, isLoading, userData }}>
      {children}
    </AuthContext.Provider>
  );
};