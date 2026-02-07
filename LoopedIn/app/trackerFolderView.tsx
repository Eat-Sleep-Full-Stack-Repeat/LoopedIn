import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Entypo, Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { View, StyleSheet, Text, Pressable, FlatList, Modal, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FolderProject = {
  id: string;
  title: string;
  isStarted: boolean;
  isFinished: boolean;
};

const sampleProjects: FolderProject[] = [
  {
    id: "1",
    title: "Shrek",
    isStarted: true,
    isFinished: false,
  },
  {
    id: "2",
    title: "Cat",
    isStarted: false,
    isFinished: false,
  },
  {
    id: "3",
    title: "Bunny",
    isStarted: true,
    isFinished: true,
  },
  {
    id: "4",
    title:
      "A really long title to test how this will look if the project name is really long for no apparent reason",
    isStarted: false, //should this even be possible? Started = true but the user finished it?
    isFinished: true,
  },
];

export default function TrackerFolderView() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();

  // projects is the data used in the infinite scroll
  // TODO: update the initial sampleProjects to be empty
  const [projects, setProjects] = useState<FolderProject[]>(sampleProjects);

  // used to apply the filters for which projects to display
  // available filters: "Not Started", "In Progress", "Completed" -> cannot have all 3 (that is equal to no filter)
  const [filter, setFilter] = useState<string[]>([]);

  // Function declarations:

  // To update the filters list:
  const updateFilters = (filterName: string) => {
    if (!["Not Started", "In Progress", "Completed"].includes(filterName)) {
      console.log("Error when updating the filter list: Incorrect filter name");
    }

    if (filter.includes(filterName)) {
      // Means the filter was already selected, so de-select it
      const newFilter = filter.filter((item) => item !== filterName);
      setFilter(newFilter);
    } else {
      setFilter((prev) => [...prev, filterName]);
    }
  };

  const filterStyles = StyleSheet.create({
    default: {
      backgroundColor: colors.exploreCardBackground,
      borderWidth: 1,
      borderColor: colors.exploreCardBackground,
    },
    red: {
      backgroundColor:
        currentTheme === "light" ? "#FF746C" : colors.exploreCardBackground,
      borderWidth: 1,
      borderColor: "#FF2C2C",
    },
    yellow: {
      backgroundColor:
        currentTheme === "light" ? "#FFEE8C" : colors.exploreCardBackground,
      borderWidth: 1,
      borderColor: "#FFBF00",
    },
    green: {
      backgroundColor:
        currentTheme === "light" ? "#A3C585" : colors.exploreCardBackground,
      borderWidth: 1,
      borderColor: "green",
    },
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      backgroundColor: colors.background,
      flexDirection: "column",
    },
    backButton: {
      paddingRight: 8,
      paddingVertical: 6,
    },
    headerBox: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 30,
      alignItems: "center",
      alignContent: "center"
    },
    folderName: {
      paddingBottom: 16,
      alignItems: "center",
    },
    titleText: {
      color: colors.text,
      fontSize: 35,
      fontWeight: "bold",
    },
    projectFiltersBar: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 25,
      paddingBottom: 16,
    },
    projectFilterButton: {
      color: colors.text,
      backgroundColor: colors.exploreCardBackground,
      padding: 10,
      borderRadius: 14,
    },
    projectContainer: {
      backgroundColor: colors.exploreCardBackground,
      paddingHorizontal: 12,
      alignItems: "flex-start",
      borderRadius: 16,
      paddingVertical: 16,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
      flexDirection: "row",
    },
    statusDot: {
      height: 20,
      width: 20,
      borderRadius: 16,
      marginLeft: 5,
    },
    floatingButton: {
      position: "absolute",
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.decorativeBackground,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 5,
    },
  });

  return (
    <View style={styles.container}>
      {/* Back Button + Search Bar Icon */}
      <View style={styles.headerBox}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color={colors.text} />
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
        <Pressable onPress={() => updateFilters("Not Started")}>
          <Text
            style={[
              styles.projectFilterButton,
              filter.includes("Not Started")
                ? filterStyles.red
                : filterStyles.default,
            ]}
          >
            {" "}
            Not Started{" "}
          </Text>
        </Pressable>

        <Pressable onPress={() => updateFilters("In Progress")}>
          <Text
            style={[
              styles.projectFilterButton,
              filter.includes("In Progress")
                ? filterStyles.yellow
                : filterStyles.default,
            ]}
          >
            {" "}
            In Progress{" "}
          </Text>
        </Pressable>

        <Pressable onPress={() => updateFilters("Completed")}>
          <Text
            style={[
              styles.projectFilterButton,
              filter.includes("Completed")
                ? filterStyles.green
                : filterStyles.default,
            ]}
          >
            {" "}
            Completed{" "}
          </Text>
        </Pressable>
      </View>

      {/* Project info (Assuming an infinite scroll here?) */}
      <FlatList
        data={projects}
        renderItem={({ item }) => (
          <View style={styles.projectContainer}>
            <View
              style={{ justifyContent: "space-between", flexDirection: "row" }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  flex: 1,
                  paddingRight: 12,
                }}
              >
                <Text style={{ color: colors.text, flexShrink: 1 }}>
                  {item.title}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    item.isFinished
                      ? filterStyles.green
                      : item.isStarted
                      ? filterStyles.yellow
                      : filterStyles.red,
                  ]}
                />
              </View>
              <Pressable>
                    <Entypo
                      name="dots-three-vertical"
                      size={20}
                      color={colors.text}
                    />
                  </Pressable>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
        contentContainerStyle={{
          paddingTop: 16,
          paddingHorizontal: 30,
          flexGrow: 1,
        }}
      />
      <Pressable
        style={[styles.floatingButton, { bottom: insets.bottom }]}
        onPress={() => console.log("Will update to add a project!")}
      >
        <Feather name="plus" size={28} color={colors.decorativeText} />
      </Pressable>
    </View>
  );
}
