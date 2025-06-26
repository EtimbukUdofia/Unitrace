import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";

export default function RootLayout() {
  const [role, setRole] = useState<string | null>("student");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

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
