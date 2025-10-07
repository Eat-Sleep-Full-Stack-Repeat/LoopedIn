import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{headerShown: false, animation: "none"}}/>
      <Stack.Screen name="userProfile" options={{headerShown: false, animation: "none"}}/>
      <Stack.Screen name="otherUserProfile" options={{headerShown: false, animation: "none"}}/>
      <Stack.Screen name="welcomePage" options={{headerShown: false, animation: "none"}}/>
    </Stack>
  );
}
