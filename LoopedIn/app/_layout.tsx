import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { Stack } from "expo-router";
import {StatusBar} from 'expo-status-bar'

function ThemedStatusBar() {
  const { currentTheme } = useTheme();
  return <StatusBar style={currentTheme === "dark" ? "light" : "dark"}/>
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      
      <ThemedStatusBar/>
      <Stack>
        <Stack.Screen name="index" options={{headerShown: false, animation: "none"}}/>
        <Stack.Screen name="userProfile" options={{headerShown: false, animation: "none"}}/>
        {/*<Stack.Screen name="otherUserProfile" options={{headerShown: false, animation: "none"}}/>*/}
        <Stack.Screen name="welcomePage" options={{headerShown: false, animation: "none"}}/>
        <Stack.Screen name="forumFeed" options={{headerShown: false, animation: "none"}}/>
        <Stack.Screen name="newforumpost" options={{headerShown: false, animation: "none"}}/>
        {/* <Stack.Screen name="singleForums" options={{headerShown: false, animation: "none"}}/> */}
        <Stack.Screen name="newpost" options={{headerShown: false, animation: "none"}}/>
        <Stack.Screen name="login" options={{headerShown: false, animation: "none"}}/>
        <Stack.Screen name="signup" options={{headerShown: false, animation: "none"}}/>
        <Stack.Screen name="editforum" options={{headerShown: false, animation: "none"}}/>
        <Stack.Screen name="editpost" options={{headerShown: false, animation: "none"}}/>
        <Stack.Screen name="myposts" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="savedposts" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="singlepost" options={{ headerShown: false, animation: "none" }} />
      </Stack>

      
    </ ThemeProvider>
  );
}