import { useAppSize } from "@/Hooks/useSize";
import { Colors } from "@/Styles/colors";
import { useSize } from "@/context/SizeContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter, useRootNavigationState } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Switch, Text, View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Storage } from "@/utils/storage";
import API_URL from "@/utils/config";

export default function Index() {
  const { currentTheme, toggleTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [isEnabled, setIsEnabled] = useState(currentTheme === "dark");

  const size = useAppSize();
  const toggleSwitch = () => {
    setIsEnabled((previousState) => !previousState);
    toggleTheme();
  };

  useEffect(() => {
    setIsEnabled(currentTheme === "dark");
  }, [currentTheme]);

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const checkAuth = async () => {
      try {
        const token = await Storage.getItem("token");

        if (!token || token === "null" || token.trim() === "") {
          router.replace("/login");
          return;
        }

        const response = await fetch(`${API_URL}/api/login/verify`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          router.replace("/(tabs)/explore");
        } else {
          await Storage.removeItem("token");
          router.replace("/login");
        }
      } catch (error) {
        console.log("Error checking auth:", error);
        await Storage.removeItem("token");
        router.replace("/login");
      }
    };

    checkAuth();
  }, [rootNavigationState?.key]);

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.text} />

      <Text
        style={{
          color: colors.text,
          marginTop: 10,
          fontSize: size.font.bodyText,
        }}
      >
        Checking login...
      </Text>

      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          marginTop: 20,
        }}
      >
        <Text style={{ color: colors.text, fontSize: size.font.bodyText }}>
          {" "}
          Dark Mode?{" "}
        </Text>
        <Switch
          onValueChange={toggleSwitch}
          trackColor={{ false: "#767577", true: "#E0D5DD" }}
          thumbColor={isEnabled ? "#F7B557" : "#f4f3f4"}
          value={isEnabled}
          style={{ justifyContent: "center" }}
        />
      </View>
    </GestureHandlerRootView>
  );
}
