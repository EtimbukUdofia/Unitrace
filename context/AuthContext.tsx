import { auth, db } from "@/config/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, PropsWithChildren, useEffect, useState } from "react";

type Role = "student" | "staff" | null;

export const AuthContext = createContext<{
  user: User | null,
  role: Role,
  isLoading: boolean
}>({
  user: null,
  role: null,
  isLoading: false
});

// export const AuthContext = createContext({});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        const data = docSnap.data();
        setUser(currentUser);
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
    <AuthContext.Provider value= {{ user, role, isLoading }}>
      { children }
    </AuthContext.Provider>
  )
}