import {
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  ScrollView,
} from "react-native";
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
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <View style={styles.userOptions}>
            <Text> DMs </Text>
            <Text> Settings </Text>
          </View>
        </View>
        {/* Middle section - user info */}
        <View style={styles.userInfo}>
          <Image source={userData.profilePic} />
          <View style={{ flexShrink: 1, rowGap: 10 }}>
            <Text>{userData.userName}</Text>
            <View style={styles.userCount}>
              <View style={styles.countLabel}>
                <Text>{userData.numFollowers}</Text>
                <Text> Followers </Text>
              </View>
              <View style={styles.countLabel}>
                <Text>{userData.numFriends}</Text>
                <Text> Friends </Text>
              </View>
            </View>
            <Text>{userData.userBio}</Text>
          </View>
        </View>

        {/* tags */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            gap: 15,
            marginHorizontal: 20,
          }}
        >
          {userData.tags.map((tag, index) => (
            <Text key={index} style={styles.userTags}>
              {tag}
            </Text>
          ))}
        </View>

        {/* posts */}
        <View style={styles.userPosts}>
          <Text> Posts </Text>
          <Text> Saved </Text>
        </View>

        <FlatList
          data={userData.posts}
          numColumns={3}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Image
              source={item}
              resizeMode="cover"
              style={{
                width: Dimensions.get("window").width / 3 - 10,
                height: (Dimensions.get("window").width / 3 - 10) * (16 / 9),
                borderRadius: 10,
                marginBottom: 5,
              }}
            />
          )}
          contentContainerStyle={{ paddingBottom: 70, marginHorizontal: 10 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
        />
      </ScrollView>

      <BottomNavButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // overflow: "scroll",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 20,
    marginHorizontal: 20,
  },
  userOptions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  userInfo: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  userTags: {
    backgroundColor: "pink",
    padding: 5,
    flexShrink: 1,
    borderRadius: 10,
    marginBottom: 20,
  },
  userPosts: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    borderBottomColor: "black",
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  userCount: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  countLabel: {
    flexDirection: "column",
    alignItems: "center",
  },
});
