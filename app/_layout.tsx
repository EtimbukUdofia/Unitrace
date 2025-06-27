import { AuthContext, AuthProvider } from "@/context/AuthContext";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useContext, useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function appLayout() {
  return (
    <AuthProvider>
      <RootLayout/>
    </AuthProvider>
  )
}

function RootLayout() {
  const { role, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Protected guard={role === "student"}>
          <Stack.Screen name="student" options={{headerShown: false}}/>
        </Stack.Protected>
        <Stack.Protected guard={role === "lecturer"}>
          <Stack.Screen name="lecturer" options={{headerShown: false}}/>
        </Stack.Protected>
        <Stack.Screen name="auth" options={{headerShown: false}}/>
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
