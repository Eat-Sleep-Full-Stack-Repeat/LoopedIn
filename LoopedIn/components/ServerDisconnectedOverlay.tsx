import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { useServerStatus } from "@/context/ServerStatusContext";
import { Colors } from "@/Styles/colors";

export default function ServerDisconnectedOverlay() {
  const { currentTheme } = useTheme();
  const { isServerDisconnected, isRetrying, retryConnection } = useServerStatus();

  if (!isServerDisconnected) return null;

  const palette = Colors[currentTheme];

  return (
    <View
      style={[
        styles.backdrop,
        {
          backgroundColor: `${palette.background}E6`,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.boxBackground,
            borderColor: palette.blockedBackground,
          },
        ]}
      >
        <Text style={[styles.title, { color: palette.text }]}>Server Not Found</Text>
        <Text style={[styles.description, { color: palette.settingsText }]}>
          Oops, looks like we lost connection! Check your connection and try again.
        </Text>
        <Pressable
          onPress={retryConnection}
          disabled={isRetrying}
          style={[
            styles.button,
            {
              backgroundColor: isRetrying ? palette.disabledButton : palette.activeContainer,
            },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: isRetrying ? palette.disabledButtonText : palette.background,
              },
            ]}
          >
            {isRetrying ? "Checking Server..." : "Reconnect to Server"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 24,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 999,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 420,
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
