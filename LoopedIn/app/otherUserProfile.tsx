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
import { useState } from "react";
import craftIcons from "@/components/craftIcons";
import { useRouter } from "expo-router";

export default function OtherUserProfile() {
  // FIXME: will need to call the userInfo from the backend when time
  const userData = mockUser;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderHeader = () => (
    <View>
      <View style={[styles.renderHeaderStyle, { paddingTop: insets.top + 20 }]}>
        <View style={{ flexDirection: "column" }}>
          {/* user info: pic, username, follower + friend count */}
          <View style={styles.userInfo}>
            <Image
              source={require("@/assets/images/icons8-cat-profile-100.png")}
            />
            <View>
              <Text style={{ fontSize: 20 }}>{userData.userName}</Text>
              <View style={{ flexDirection: "row", gap: 20 }}>
                {/* Followers */}
                <Pressable
                  style={{ flexDirection: "column", alignItems: "center" }}
                  onPress={() => router.push("/followers")}
                >
                  <View style={styles.countCircles}>
                    <Text style={{ fontSize: 24, color: "#C1521E" }}>
                      {userData.numFollowers}
                    </Text>
                  </View>
                  <Text style={styles.countLabel}>Followers</Text>
                </Pressable>

                {/* Following */}
                <Pressable
                  style={{ flexDirection: "column", alignItems: "center" }}
                  onPress={() => router.push("/following")}
                >
                  <View style={styles.countCircles}>
                    <Text style={{ fontSize: 24, color: "#C1521E" }}>
                      {userData.numFriends}
                    </Text>
                  </View>
                  <Text style={styles.countLabel}>Following</Text>
                </Pressable>
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

          {/* follow and message buttons */}
          <View style={styles.contactContainer}>
            <Pressable style={styles.followContainer}>
              <Text style={{ fontSize: 14 }}> Follow </Text>
            </Pressable>
            <View style={styles.followContainer}>
              <Text style={{ fontSize: 14 }}> Message </Text>
            </View>
          </View>
        </View>
      </View>

      {/* user’s posts section */}
      <View style={styles.postTabs}>
        <View style={styles.postTabText}>
          <Text style={{ color: "#C1521E" }}>{userData.userName}'s Posts</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container]}>
      <View style={styles.topBackground} />
      <View style={styles.bottomBackground} />
      <FlatList
        data={userData.posts}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <Image
            source={item}
            resizeMode="cover"
            style={{
              width: Dimensions.get("window").width / 3 - 10,
              height: (Dimensions.get("window").width / 3 - 10) * (16 / 9),
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
  userInfo: {
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
  },
  countLabel: {
    fontSize: 14,
    color: "#000",
    marginTop: 4,
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
  contactContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 30,
    alignItems: "center",
    marginHorizontal: 20,
  },
  followContainer: {
    backgroundColor: "#F8F2E5",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 15,
  },
});
