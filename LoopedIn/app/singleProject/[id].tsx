import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";

export default function SingleProject() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const thumbIcons: Array<
    "image" | "aperture" | "camera" | "grid" | "layers"
  > = ["image", "aperture", "camera", "grid", "layers"];
  const [selectedThumb, setSelectedThumb] = useState(0);
  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top + 8,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    backButton: {
      paddingRight: 8,
      paddingVertical: 6,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 30,
    },
    createButton: {
      paddingLeft: 8,
      paddingVertical: 6,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "600",
    },
    statusPill: {
      alignSelf: "center",
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.topBackground,
    },
    statusText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
    },
    startDateText: {
      color: colors.settingsText,
      fontSize: 12,
      marginTop: 6,
      textAlign: "center",
    },
    mainPhotoPlaceholder: {
      marginTop: 12,
      width: 240,
      aspectRatio: 3 / 4,
      borderRadius: 16,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.topBackground,
      alignSelf: "center",
    },
    mainPhotoText: {
      color: colors.settingsText,
      marginTop: 8,
      fontSize: 12,
      fontWeight: "500",
    },
    thumbRow: {
      marginTop: 8,
    },
    thumbList: {
      paddingRight: 8,
    },
    thumbCard: {
      width: 70,
      aspectRatio: 3 / 4,
      borderRadius: 10,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.topBackground,
      marginRight: 10,
    },
    thumbCardSelected: {
      borderWidth: 2,
      borderColor: colors.decorativeBackground,
    },
    notePlaceholder: {
      marginTop: 16,
      width: 380,
      height: 180,
      borderRadius: 14,
      backgroundColor: "transparent",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.topBackground,
      alignSelf: "center",
    },
    noteText: {
      color: colors.text,
      fontSize: 14,
    },
  });

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Project Title</Text>
          </View>
          <Pressable style={styles.createButton}>
            <Feather name="edit" size={20} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>Not Started</Text>
        </View>
        <Text style={styles.startDateText}>Started: January 16, 2026</Text>

        <View style={styles.mainPhotoPlaceholder}>
          <Feather
            name={thumbIcons[selectedThumb]}
            size={40}
            color={colors.decorativeText}
          />
          <Text style={styles.mainPhotoText}>Main image placeholder</Text>
        </View>

        <View style={styles.thumbRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbList}
          >
            {thumbIcons.map((icon, index) => (
              <Pressable
                key={`thumb-${index}`}
                onPress={() => setSelectedThumb(index)}
                style={[
                  styles.thumbCard,
                  selectedThumb === index && styles.thumbCardSelected,
                ]}
              >
                <Feather
                  name={icon}
                  size={20}
                  color={colors.decorativeText}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.notePlaceholder}>
          <Text style={styles.noteText}>This is test single view project</Text>
        </View>
      </ScrollView>
    </View>
  );
}
