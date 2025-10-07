import BottomNavButton from "@/components/bottomNavBar";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Index() {

  // FIXME: Need to empty this before launch, just to help load app


  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>This will be the welcome screen!</Text>
      
      <TouchableOpacity onPress={() => router.push("/login")}
        style={{ marginTop: 20 }}>
        <Text>Login Page</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/otherUserProfile")}
        style={{ marginTop: 20 }}>
        <Text>other people's profile pages</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/welcomePage")}
        style={{ marginTop: 20 }}>
        <Text>Link to the welcome page </Text>
      </TouchableOpacity>

      <BottomNavButton/>
    </View>
  );
}
