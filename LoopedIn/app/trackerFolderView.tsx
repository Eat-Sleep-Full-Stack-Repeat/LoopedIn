import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TrackerFolderView() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      backgroundColor: colors.background,
      flexDirection: "column",
    },
    backFab: {
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.boxBackground,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },
    headerBox: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 30,
    },
    folderName: {
      paddingVertical: 16,
      alignItems: "center",
    },
    titleText: {
      color: colors.text,
      fontSize: 35,
      fontWeight: "bold",
    },
    projectFiltersBar: {
      flexDirection: "row",
      justifyContent: "space-evenly",
    },
    projectFilterButton: {
        color: colors.text,
        backgroundColor: colors.exploreCardBackground,
        padding: 10,
        borderRadius: 14
    }
  });

  return (
    <View style={styles.container}>
      {/* Back Button + Search Bar Icon */}
      <View style={styles.headerBox}>
        <Pressable style={styles.backFab} onPress={() => router.back()}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <Feather name="search" size={24} color={colors.text} />
      </View>

      {/*Folder Name title*/}
      <View style={styles.folderName}>
        {/* TODO: Update the folder name from backend here */}
        <Text style={styles.titleText}>Folder Name</Text>
      </View>

      {/* Filter options -> not started, in progress, completed */}
      <View style={styles.projectFiltersBar}>
        <Pressable>
          <Text style={styles.projectFilterButton}> Not Started </Text>
        </Pressable>

        <Pressable>
          <Text style={styles.projectFilterButton}> In Progress </Text>
        </Pressable>

        <Pressable>
          <Text style={styles.projectFilterButton}> Completed </Text>
        </Pressable>
      </View>

      {/* Project info (Assuming an infinite scroll here?) */}
    </View>
  );
}
