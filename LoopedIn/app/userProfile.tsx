import { Text, View, StyleSheet, Image } from "react-native";
import BottomNavButton from "@/components/bottomNavBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// FIXME: delete the following line when backend set up
import mockUser from "./mockData";

export default function UserProfile() {
  // FIXME: will need to call the userInfo from the backend when time
  const userData = mockUser;
  const insets = useSafeAreaInsets();

  return (
    // Additional navigation for the user
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.topBar}>
        <Text> Back </Text>
        <View style={styles.userOptions}>
          <Text> DMs </Text>
          <Text> Settings </Text>
        </View>
      </View>
      {/* Middle section - user info */}
      <View>
        <Image source={userData.profilePic} />
        <View>
          <Text>{userData.userName}</Text>
          <View>
            <Text>{userData.numFollowers}</Text>
            <Text>{userData.numFriends}</Text>
          </View>
          <Text>{userData.userBio}</Text>
        </View>
      </View>

      <BottomNavButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  userOptions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  userInfo: {},
  userTags: {},
  userPosts: {},
});
