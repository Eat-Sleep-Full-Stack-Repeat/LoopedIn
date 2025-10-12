import BottomNavButton from "@/components/bottomNavBar";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";


export default function Index() {
  const router = useRouter();

  return (
     <GestureHandlerRootView style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>This will be the welcome screen!</Text>

      <TouchableOpacity onPress={() => router.push("/login")} style={{ marginTop: 20 }}>
        <Text>Login Page</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/otherUserProfile")} style={{ marginTop: 20 }}>
        <Text>Other User Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/welcomePage")} style={{ marginTop: 20 }}>
        <Text>Welcome Page</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/followers")} style={{ marginTop: 20 }}>
        <Text>Followers Page</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/following")} style={{ marginTop: 20 }}>
        <Text>Following Page</Text>
      </TouchableOpacity>

      <BottomNavButton />
    </GestureHandlerRootView>
  );
}
