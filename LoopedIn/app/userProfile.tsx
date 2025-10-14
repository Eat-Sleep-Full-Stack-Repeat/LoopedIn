import {
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  Pressable,
  TouchableOpacity,
} from "react-native";
import BottomNavButton from "@/components/bottomNavBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";
import { Storage } from "../utils/storage";
import API_URL from "@/utils/config";
// FIXME: delete the following line when backend set up
import mockUser from "./mockData";
import { Fragment, useContext, useState } from "react";
import craftIcons from "@/components/craftIcons";
import { useRouter } from "expo-router";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Feather } from "@expo/vector-icons";
import SettingsOverlay from "@/components/settingsoverlay";

export default function UserProfile() {
  const { currentTheme, toggleTheme } = useTheme();
  const colors = Colors[currentTheme];
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  //must be logged in w/ jwt to see profile
  //FIXME: build this out more later
  useEffect(() => {
    //check token
    const getProfile = async () => {
      console.log("getting token");
      const token = await Storage.getItem("token");

      //get username
      console.log("getting username");
      try {
        const response = await fetch(`${API_URL}/api/profile/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          alert("Access denied: please log in and try again.");
          router.replace("/login");
          return;
        }
        const data = await response.json();
        setUsername(data.fld_username);
      } catch (error) {
        console.log("Error during deck fetch:", (error as Error).message);
        alert("Server error, please try again later.");
      }
    };

    getProfile();
  }, [router]);

  // FIXME: will need to call the userInfo from the backend when time
  const userData = mockUser;
  const insets = useSafeAreaInsets();
  const [activeTab, setTab] = useState("posts");
  const [currentPosts, setPosts] = useState(userData.posts);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handlePostPress = () => (setTab("posts"), setPosts(userData.posts));

  const handleSavedPress = () => (
    setTab("saved"), setPosts(userData.savedPosts)
  );

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
    topAccountManagement: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
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
      backgroundColor: colors.decorativeBackground,
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
    editProfileButton: {
      backgroundColor: colors.boxBackground,
      marginBottom: 30,
      marginHorizontal: 85,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 15,
    },
  });

  const renderHeader = () => (
    <View>
      <View style={[styles.renderHeaderStyle, { paddingTop: insets.top }]}>
        <View style={{ flexDirection: "column" }}>
          <View style={styles.topAccountManagement}>
            <View style={{ flexDirection: "column", alignItems: "center" }}>
              <Feather name="message-circle" size={28} color={colors.text} />
              <Text style={{ color: colors.text }}> DMs </Text>
            </View>

            <Pressable
              style={{ flexDirection: "column", alignItems: "center" }}
              onPress={() => setSettingsOpen(true)}
            >
              <Feather name="settings" size={28} color={colors.text} />
              <Text style={{ color: colors.text }}>Settings</Text>
            </Pressable>
          </View>

          {/* user info: pic, username, follower + following count */}
          <View style={styles.userInfoContainer}>
            <Image
              source={require("@/assets/images/icons8-cat-profile-100.png")}
            />
            <View>
              <Text style={{ fontSize: 20, color: colors.text }}>
                {username}
              </Text>
              <View style={{ flexDirection: "row", gap: 20 }}>
                {/* Followers - clickable */}
                <Pressable
                  style={{ flexDirection: "column", alignItems: "center" }}
                  onPress={() => router.push("/followers")}
                >
                  <View style={styles.countCircles}>
                    <Text
                      style={{ fontSize: 24, color: colors.decorativeText }}
                    >
                      {userData.numFollowers}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.text }}>
                    {" "}
                    Followers{" "}
                  </Text>
                </Pressable>

                {/* Following - clickable */}

                <Pressable
                  style={{ flexDirection: "column", alignItems: "center" }}
                  onPress={() => router.push("/following")}
                >
                  <View style={styles.countCircles}>
                    <Text
                      style={{ fontSize: 24, color: colors.decorativeText }}
                    >
                      {userData.numFriends}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.text }}>
                    {" "}
                    Following{" "}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* bio */}
        <View style={styles.bioContainer}>
          <Text style={{ fontSize: 14, color: colors.text }}> Bio </Text>
          <View style={styles.bioContentContainer}>
            <Text style={{ fontSize: 14, color: colors.text }}>
              {userData.userBio}
            </Text>
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

        {/* edit profile button */}
        <View style={styles.editProfileButton}>
          <Text style={{ fontSize: 14, color: colors.text }}>
            {" "}
            Edit Profile{" "}
          </Text>
        </View>

        {/* Floating Logout Button */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={handleLogout}
        >
          <Text style={{ fontSize: 14, color: colors.text }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Post tab navigation (my posts vs saved posts) */}
      {activeTab == "posts" ? (
        <View style={styles.postTabs}>
          <View style={styles.postTabText}>
            <Text style={{ color: colors.decorativeText }}> My Posts </Text>
          </View>
          <Pressable onPress={handleSavedPress} style={{ padding: 10 }}>
            <Text style={{ color: colors.text }}> Saved Posts </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.postTabs}>
          <Pressable onPress={handlePostPress} style={{ padding: 10 }}>
            <Text style={{ color: colors.text }}> My Posts </Text>
          </Pressable>
          <View style={styles.postTabText}>
            <Text style={{ color: colors.decorativeText }}> Saved Posts </Text>
          </View>
        </View>
      )}
    </View>
  );

  // Logout - can be updated later or moved to settings overlay
  const handleLogout = async () => {
    //later, delete necessary items from local or async storage

    //remove JWT
    await Storage.removeItem("token");

    setTimeout(() => {
      router.push("/"); //index for dev purposes; later should be login
    }, 0);

    console.log("Logged out!");
  };

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
      <SettingsOverlay
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        /* Can control routing for settings buttons fom here or within SettingsOverlay
          onAccessibility={() => router.push("/accessibility")}
          onAppearance={() => router.push("/appearance")}*/
        onLogout={() => console.log("Logged out")}
      />
    </View>
  );
}
