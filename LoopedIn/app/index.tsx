import { Colors } from "@/Styles/colors";
import BottomNavButton from "@/components/bottomNavBar";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Index() {
  const { currentTheme, toggleTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(currentTheme === "dark");

  const toggleSwitch = () => {
    setIsEnabled((previousState) => !previousState);
    toggleTheme();
  };

  useEffect(() => {
    setIsEnabled(currentTheme === "dark");
  }, [currentTheme]);

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ color: colors.text }}>This will be the welcome screen!</Text>

      <TouchableOpacity
        onPress={() => router.push("/login")}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: colors.text }}>Login Page</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/welcomePage")}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: colors.text }}>Welcome Page</Text>
      </TouchableOpacity>

      {}
      <TouchableOpacity
        onPress={() => router.push("/myposts" as never)}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: colors.text }}>My Posts Page</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/folderscreen")}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: colors.text }}> My Folders </Text>
      </TouchableOpacity>

      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          marginTop: 10,
        }}
      >
        <Text style={{ color: colors.text }}> Dark Mode? </Text>
        <Switch
          onValueChange={toggleSwitch}
          trackColor={{ false: "#767577", true: "#E0D5DD" }}
          thumbColor={isEnabled ? "#F7B557" : "#f4f3f4"}
          value={isEnabled}
          style={{ justifyContent: "center" }}
        />
        
      </View>

      <BottomNavButton />
    </GestureHandlerRootView>
  );
}