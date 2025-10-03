import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index"/>
      <Stack.Screen name="userProfile" options={{headerShown: false, animation: "none"}}/>
    </Stack>
  );
}
