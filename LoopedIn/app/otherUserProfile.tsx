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
import craftIcons from "@/components/craftIcons";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";

export default function OtherUserProfile() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  // FIXME: will need to call the userInfo from the backend when time
  const userData = mockUser;
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
      backgroundColor: colors.decorativeBackground,
      padding: 10,
      borderRadius: 15,
    },
    topBackground: {
      backgroundColor: colors.topBackground,
      height: "50%",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: -1,
    },
    bottomBackground: {
      backgroundColor: colors.background,
      height: "50%",
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: -1,
    },
    renderHeaderStyle: {
      backgroundColor: colors.topBackground,
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
      backgroundColor: colors.decorativeBackground,
      width: 50,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 25,
    },
    countLabel: {
      fontSize: 14,
      color: colors.text,
      marginTop: 4,
    },
    bioContainer: {
      flexDirection: "column",
      marginHorizontal: 30,
      marginBottom: 20,
      marginTop: 10,
    },
    bioContentContainer: {
      backgroundColor: colors.boxBackground,
      padding: 10,
      borderRadius: 15,
    },
    tagsContainer: {
      flexDirection: "column",
      marginBottom: 30,
      marginHorizontal: 30,
    },
    tagsContentContainer: {
      backgroundColor: colors.boxBackground,
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
      backgroundColor: colors.boxBackground,
      paddingVertical: 10,
      paddingHorizontal: 40,
      borderRadius: 15,
    },
  });
  

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
              <Text style={{ fontSize: 20, color: colors.text }}>{userData.userName}</Text>
              <View style={{ flexDirection: "row", gap: 20 }}>
                {/* Followers */}
                <Pressable
                  style={{ flexDirection: "column", alignItems: "center" }}
                  onPress={() => router.push("/followers")}
                >
                  <View style={styles.countCircles}>
                    <Text style={{ fontSize: 24, color: colors.decorativeText }}>
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
                    <Text style={{ fontSize: 24, color: colors.decorativeText }}>
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
            <Text style={{ fontSize: 14, color: colors.text }}> Bio </Text>
            <View style={styles.bioContentContainer}>
              <Text style={{ fontSize: 14, color: colors.text }}>{userData.userBio}</Text>
            </View>
          </View>

          {/* craft tags */}
          <View style={styles.tagsContainer}>
            <Text style={{ color: colors.text }}> Crafts </Text>
            <View style={styles.tagsContentContainer}>
              {userData.tags.map((item, index) => (
                <View
                  key={index}
                  style={{ flexDirection: "column", alignItems: "center" }}
                >
                  <Text style={{ color: colors.text }}>{item.craft}</Text>
                  <Image source={craftIcons[item.craft]} />
                  <Text style={{ color: colors.text }}>{item.skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* follow and message buttons */}
          <View style={styles.contactContainer}>
            <Pressable style={styles.followContainer}>
              <Text style={{ fontSize: 14, color: colors.text }}> Follow </Text>
            </Pressable>
            <View style={styles.followContainer}>
              <Text style={{ fontSize: 14, color: colors.text }}> Message </Text>
            </View>
          </View>
        </View>
      </View>

      {/* user’s posts section */}
      <View style={styles.postTabs}>
        <View style={styles.postTabText}>
          <Text style={{ color: colors.decorativeText }}>{userData.userName}'s Posts</Text>
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
          backgroundColor: colors.background,
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

