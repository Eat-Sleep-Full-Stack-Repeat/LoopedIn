import BottomNavButton from "@/components/bottomNavBar";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Index() {
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

      <BottomNavButton/>
    </View>
  );
}
