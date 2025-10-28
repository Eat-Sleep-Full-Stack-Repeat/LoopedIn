import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { Stack } from "expo-router";
import BottomNavButton from "@/components/bottomNavBar";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ExplorePage() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const [selectedFilter, setSelectedFilter] = useState("All");
  const filters = ["All", "Crochet", "Knit"];
  const insets = useSafeAreaInsets();

  const ThemedIcon = ({ source }: { source: any }) => (
    <Image
      source={source}
      style={[
        styles.actionIcon,
        { tintColor: currentTheme === "light" ? "#000000" : "#FFFFFF" },
      ]}
    />
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      backgroundColor: colors.exploreBackground,
      justifyContent: "center",
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: "700",
      textAlign: "center",
      marginVertical: 15,
      color: colors.text,
    },
    searchBar: {
      height: 40,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      marginHorizontal: 20,
      borderColor: colors.exploreFilterSelected,
      backgroundColor: "#FFFFFF",
      color: colors.text,
    },
    filterContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 15,
      marginVertical: 15,
    },
    filterTag: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 15,
      backgroundColor: currentTheme === "light" ? "#FFFFFF" : "#2E2E2E",
      borderWidth: 1,
      borderColor: colors.exploreBorder,
    },
    filterTagSelected: {
      backgroundColor: colors.exploreFilterSelected,
      borderColor: colors.exploreFilterSelected,
    },
    filterText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    filterTextSelected: {
      color: currentTheme === "light" ? colors.text : "#FFFFFF",
    },
    postContainer: {
      backgroundColor: colors.exploreCardBackground,
      marginHorizontal: 20,
      marginBottom: 25,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.exploreBorder,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    profilePic: {
      width: 35,
      height: 35,
      borderRadius: 17,
      backgroundColor: "#E0E0E0",
      marginRight: 10,
    },
    username: {
      fontWeight: "600",
      fontSize: 15,
      color: colors.text,
    },
    postImage: {
      width: "100%",
      height: 180,
      borderRadius: 8,
      backgroundColor: "#EAEAEA",
    },
    postActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 10,
    },
    postAction: {
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    actionIcon: {
      width: 20,
      height: 20,
      resizeMode: "contain",
    },
    postActionText: {
      color: colors.text,
      fontSize: 12,
    },
  });

  return (
    <>
      {/* ✅ Disable transition animation for Explore only */}
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "none", // disables slide-in animation
        }}
      />

      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Explore</Text>

          {/* Search Bar */}
          <TextInput
            style={styles.searchBar}
            placeholder="Search"
            placeholderTextColor="#666"
          />

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            {filters.map((filterOption) => (
              <Pressable
                key={filterOption}
                onPress={() => setSelectedFilter(filterOption)}
                style={[
                  styles.filterTag,
                  selectedFilter === filterOption && styles.filterTagSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filterOption &&
                      styles.filterTextSelected,
                  ]}
                >
                  {filterOption}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Example Post Cards */}
          {[1, 2].map((index) => (
            <View key={index} style={styles.postContainer}>
              <View style={styles.profileRow}>
                <View style={styles.profilePic} />
                <Text style={styles.username}>
                  {index === 1 ? "Username" : "Username #2"}
                </Text>
              </View>

              <View style={styles.postImage} />

              {/* Post Actions */}
              <View style={styles.postActions}>
                <View style={styles.postAction}>
                  <ThemedIcon source={require("../assets/images/heart.png")} />
                  <Text style={styles.postActionText}>Like</Text>
                </View>

                <View style={styles.postAction}>
                  <ThemedIcon source={require("../assets/images/comment.png")} />
                  <Text style={styles.postActionText}>Comment</Text>
                </View>

                <View style={styles.postAction}>
                  <ThemedIcon source={require("../assets/images/tags.png")} />
                  <Text style={styles.postActionText}>Tags</Text>
                </View>

                <View style={styles.postAction}>
                  <ThemedIcon source={require("../assets/images/saved.png")} />
                  <Text style={styles.postActionText}>Saved</Text>
                </View>
              </View>
            </View>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>

        <BottomNavButton />
      </View>
    </>
  );
}

