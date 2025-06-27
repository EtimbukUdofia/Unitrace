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

// export const AuthContext = createContext({});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [userData, setUserData] = useState<UserData>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        const data = docSnap.data();
        setUser(currentUser);
        setUserData(data);
        console.log("setting Role:", data?.role);
        setRole(data?.role);
      } else {
        setUser(null);
        setRole(null);
      }

      setIsLoading(false);
    })

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log(role);
  }, [role]);

  return (
    <AuthContext.Provider value= {{ user, role, isLoading, userData }}>
      { children }
    </AuthContext.Provider>
  )
}