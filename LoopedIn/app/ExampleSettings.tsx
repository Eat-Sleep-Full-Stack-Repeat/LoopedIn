import React, { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import SettingsOverlay from "./settingsoverlay"; // note: filename case

export default function ExampleSettingsScreen() {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ flex: 1, paddingTop: 64, alignItems: "center" }}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 10,
          backgroundColor: "#4F46E5",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Open Settings</Text>
      </Pressable>

      <SettingsOverlay
        visible={open}
        onClose={() => setOpen(false)}
        onEditProfile={() => Alert.alert("Edit Profile")}
        onAccessibility={() => Alert.alert("Accessibility")}
        onAppearance={() => Alert.alert("Appearance")}
        onLogout={() => Alert.alert("Logged out")}
      />
    </View>
  );
}
