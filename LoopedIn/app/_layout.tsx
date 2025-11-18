import { ThemeProvider } from "@/context/ThemeContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="userProfile" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="otherUserProfile" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="welcomePage" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="forumFeed" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="newforumpost" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="myposts" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="savedposts" options={{ headerShown: false, animation: "none" }} />
      </Stack>
    </ThemeProvider>
  );
}
