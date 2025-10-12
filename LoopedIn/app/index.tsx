import { Colors } from "@/Styles/colors";
import BottomNavButton from "@/components/bottomNavBar";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { Button, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { currentTheme, toggleTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ color: colors.text }}>
        This will be the welcome screen!
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/login")}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: colors.text }}>Login Page</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/otherUserProfile")}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: colors.text }}>Other User Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/welcomePage")}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: colors.text }}>Welcome Page</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/followers")}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: colors.text }}>Followers Page</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/following")}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: colors.text }}>Following Page</Text>
      </TouchableOpacity>

      <Button title="Toggle Theme" onPress={toggleTheme}/>

      <BottomNavButton />
    </View>
  );
}
