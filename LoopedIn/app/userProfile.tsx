import {
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  Pressable,
} from "react-native";
import BottomNavButton from "@/components/bottomNavBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// FIXME: delete the following line when backend set up
import mockUser from "./mockData";
import { Fragment, useState } from "react";
import craftIcons from "@/components/craftIcons";

export default function UserProfile() {
  // FIXME: will need to call the userInfo from the backend when time
  const userData = mockUser;
  const insets = useSafeAreaInsets();
  const [activeTab, setTab] = useState("posts");
  const [currentPosts, setPosts] = useState(userData.posts);

  const handlePostPress = () => (setTab("posts"), setPosts(userData.posts));

  const handleSavedPress = () => (
    setTab("saved"), setPosts(userData.savedPosts)
  );

  const renderHeader = () => (
    <View>
      <View style={[styles.renderHeaderStyle, { paddingTop: insets.top }]}>
        <View style={{ flexDirection: "column" }}>
          <View style={styles.topAccountManagement}>
            <Text> DMs </Text>
            <Text> Settings </Text>
          </View>

          {/* user info: pic, username, follower + friend count */}
          <View style={styles.userInfoContainer}>
            <Image
              source={require("@/assets/images/icons8-cat-profile-100.png")}
            />
            <View>
              <Text style={{ fontSize: 20 }}>{userData.userName}</Text>
              <View style={{ flexDirection: "row", gap: 20 }}>
                <View style={{ flexDirection: "column", alignItems: "center" }}>
                  <View style={styles.countCircles}>
                    <Text style={{ fontSize: 24, color: "#C1521E" }}>
                      {userData.numFollowers}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14 }}> Followers </Text>
                </View>
                <View style={{ flexDirection: "column", alignItems: "center" }}>
                  <View style={styles.countCircles}>
                    <Text style={{ fontSize: 24, color: "#C1521E" }}>
                      {userData.numFriends}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14 }}> Friends </Text>
                </View>
              </View>
            </View>
          </View>

          {/* bio */}
          <View style={styles.bioContainer}>
            <Text style={{ fontSize: 14 }}> Bio </Text>
            <View style={styles.bioContentContainer}>
              <Text style={{ fontSize: 14 }}>{userData.userBio}</Text>
            </View>
          </View>

          {/* craft tags */}
          <View style={styles.tagsContainer}>
            <Text> Crafts </Text>
            <View style={styles.tagsContentContainer}>
              {userData.tags.map((item, index) => (
                <View
                  key={index}
                  style={{ flexDirection: "column", alignItems: "center" }}
                >
                  <Text>{item.craft}</Text>
                  <Image source={craftIcons[item.craft]} />
                  <Text>{item.skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* edit profile button */}
          <View style={styles.editProfileButton}>
            <Text style={{ fontSize: 14 }}> Edit Profile </Text>
          </View>
        </View>
      </View>

      {/* Post tab navigation (my posts vs saved posts) */}
      {activeTab == "posts" ? (
        <View style={styles.postTabs}>
          <View style={styles.postTabText}>
            <Text style={{ color: "#C1521E" }}> My Posts </Text>
          </View>
          <Pressable onPress={handleSavedPress} style={{ padding: 10 }}>
            <Text> Saved Posts </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.postTabs}>
          <Pressable onPress={handlePostPress} style={{ padding: 10 }}>
            <Text> My Posts </Text>
          </Pressable>
          <View style={styles.postTabText}>
            <Text style={{ color: "#C1521E" }}> Saved Posts </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container]}>
      <View style={styles.topBackground} />
      <View style={styles.bottomBackground} />
      <FlatList
        data={currentPosts}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <Image
            source={item}
            resizeMode="cover"
            style={{
              width: Dimensions.get("window").width / 3 - 10,
              height: (Dimensions.get("window").width / 3 - 10) * (16 / 9), //aspect ration 16/9
              borderRadius: 20,
              marginBottom: 5,
            }}
          />
        )}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          backgroundColor: "#F8F2E5",
        }}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginHorizontal: 10,
        }}
      />
      <BottomNavButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    marginBottom: 20,
    alignItems: "center",
  },
  postTabText: {
    backgroundColor: "#F7B557",
    padding: 10,
    borderRadius: 15,
  },
  topBackground: {
    backgroundColor: "#E0D5DD",
    height: "50%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  bottomBackground: {
    backgroundColor: "#F8F2E5",
    height: "50%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  renderHeaderStyle: {
    backgroundColor: "#E0D5DD",
    flexDirection: "column",
    flex: 1,
    width: "100%",
    marginBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topAccountManagement: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 20,
    marginBottom: 20,
    marginRight: 20,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  countCircles: {
    backgroundColor: "#F7B557",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    flexDirection: "row",
  },
  bioContainer: {
    flexDirection: "column",
    marginHorizontal: 30,
    marginBottom: 20,
    marginTop: 10,
  },
  bioContentContainer: {
    backgroundColor: "#F8F2E5",
    padding: 10,
    borderRadius: 15,
  },
  tagsContainer: {
    flexDirection: "column",
    marginBottom: 30,
    marginHorizontal: 30,
  },
  tagsContentContainer: {
    backgroundColor: "#F8F2E5",
    padding: 10,
    borderRadius: 15,
    flexDirection: "row",
    gap: 30,
  },
  editProfileButton: {
    backgroundColor: "#F8F2E5",
    marginBottom: 30,
    marginHorizontal: 85,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 15,
  },
});
