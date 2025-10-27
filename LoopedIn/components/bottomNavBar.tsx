import { router } from "expo-router";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const handleProfilePress = () => {
  router.replace("/userProfile");
};

const handleForumPress = () => {
  router.replace("/forumFeed");
};

const handleExplorePress = () => {
  router.replace("/explore");
};

const handleProjectTrackerPress = () => {
  // FIXME: update when project tracker screen is ready
  router.replace("/");
};

const BottomNavButton = () => {
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      flexDirection: "row",
      justifyContent: "space-evenly",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#C0C0C0",
      width: "90%",
      padding: 10,
      backgroundColor: "#FFFFFF",
      alignSelf: "center",
      borderRadius: 50,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    iconContainer: {
      flexDirection: "column",
      alignItems: "center",
    },
    iconText: {
      color: "#000000",
      fontSize: 12,
      marginTop: 2,
    },
  });

  return (
    <View style={[styles.container, { bottom: insets.bottom }]}>
      {/* Profile */}
      <Pressable onPress={handleProfilePress}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={40}
            color="#000000"
          />
          <Text style={styles.iconText}>profile</Text>
        </View>
      </Pressable>

      {/* Tracker */}
      <Pressable onPress={handleProjectTrackerPress}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="notebook" size={40} color="#000000" />
          <Text style={styles.iconText}>tracker</Text>
        </View>
      </Pressable>

      {/* Explore */}
      <Pressable onPress={handleExplorePress}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="home" size={40} color="#000000" />
          <Text style={styles.iconText}>explore</Text>
        </View>
      </Pressable>

      {/* Forums */}
      <Pressable onPress={handleForumPress}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="forum-outline" size={40} color="#000000" />
          <Text style={styles.iconText}>forums</Text>
        </View>
      </Pressable>
    </View>
  );
};

export default BottomNavButton;
