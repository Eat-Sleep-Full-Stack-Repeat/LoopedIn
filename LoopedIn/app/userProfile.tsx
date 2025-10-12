import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  Pressable,
  TouchableOpacity,
  TextInput,
  Alert,
  BackHandler,
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
import { useNavigation } from "@react-navigation/native";
import SettingsOverlay from "@/components/settingsoverlay"; // adjust path if needed

export default function UserProfile() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const userData = mockUser;
  const insets = useSafeAreaInsets();

  // Posts tab
  const [activeTab, setTab] = useState<"posts" | "saved">("posts");
  const [currentPosts, setPosts] = useState(userData.posts);

  // Settings overlay
  const [settingsOpen, setSettingsOpen] = useState(false);

  // --- Edit Bio mode ---
  const [originalUser, setOriginalUser] = useState(userData);
  const [editing, setEditing] = useState(false);
  const [draftBio, setDraftBio] = useState(originalUser.userBio ?? "");

  const isDirty = editing && draftBio !== originalUser.userBio;

  const startEditing = () => {
    setDraftBio(originalUser.userBio ?? "");
    setEditing(true);
  };

  const discardChanges = () => {
    setDraftBio(originalUser.userBio ?? "");
    setEditing(false);
  };

  const saveChanges = () => {
    // Just update local state (no backend)
    setOriginalUser((prev) => ({
      ...prev,
      userBio: draftBio,
    }));
    setEditing(false);
    Alert.alert("Profile updated");
  };

  // Guard leaving the screen if there are unsaved changes
  useEffect(() => {
    const beforeRemove = (e: any) => {
      if (!isDirty) return;
      e.preventDefault();

      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Save or discard before leaving.",
        [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              discardChanges();
              navigation.dispatch(e.data.action);
            },
          },
          { text: "Save", onPress: saveChanges },
        ]
      );
    };

    const sub = navigation.addListener("beforeRemove", beforeRemove);

    // Handle Android hardware back button too
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isDirty) return false;
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Save or discard before leaving.",
        [
          { text: "Keep editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: discardChanges },
          { text: "Save", onPress: saveChanges },
        ]
      );
      return true;
    });

    return () => {
      sub();
      backHandler.remove();
    };
  }, [isDirty, draftBio, originalUser.userBio, navigation]);

  const handlePostPress = () => {
    setTab("posts");
    setPosts(originalUser.posts);
  };

  const handleSavedPress = () => {
    setTab("saved");
    setPosts(originalUser.savedPosts);
  };

  const renderHeader = useCallback(
    () => (
      <View>
        <View style={[styles.renderHeaderStyle, { paddingTop: insets.top }]}>
          <View style={{ flexDirection: "column" }}>
            <View style={styles.topAccountManagement}>
              <Text> DMs </Text>
              <Pressable onPress={() => setSettingsOpen(true)}>
                <Text>Settings</Text>
              </Pressable>
            </View>

            {/* user info: pic, username, follower + following count */}
            <View style={styles.userInfoContainer}>
              <Image source={require("@/assets/images/icons8-cat-profile-100.png")} />
              <View>
                <Text style={{ fontSize: 20 }}>{originalUser.userName}</Text>
                <View style={{ flexDirection: "row", gap: 20 }}>
                  {/* Followers */}
                  <Pressable
                    style={{ flexDirection: "column", alignItems: "center" }}
                    onPress={() => router.push("/followers")}
                  >
                    <View style={styles.countCircles}>
                      <Text style={{ fontSize: 24, color: "#C1521E" }}>
                        {originalUser.numFollowers}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14 }}> Followers </Text>
                  </Pressable>

                  {/* Following */}
                  <Pressable
                    style={{ flexDirection: "column", alignItems: "center" }}
                    onPress={() => router.push("/following")}
                  >
                    <View style={styles.countCircles}>
                      <Text style={{ fontSize: 24, color: "#C1521E" }}>
                        {originalUser.numFriends}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14 }}> Following </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* bio (editable only in edit mode) */}
            <View style={styles.bioContainer}>
              <Text style={{ fontSize: 14 }}> Bio </Text>
              {editing ? (
                <TextInput
                  value={draftBio}
                  onChangeText={setDraftBio}
                  style={styles.bioInput}
                  placeholder="Tell people about yourself"
                  multiline
                />
              ) : (
                <View style={styles.bioContentContainer}>
                  <Text style={{ fontSize: 14 }}>{originalUser.userBio}</Text>
                </View>
              )}
            </View>

            {/* craft tags */}
            <View style={styles.tagsContainer}>
              <Text> Crafts </Text>
              <View style={styles.tagsContentContainer}>
                {originalUser.tags.map((item: any, index: number) => (
                  <View key={index} style={{ flexDirection: "column", alignItems: "center" }}>
                    <Text>{item.craft}</Text>
                    <Image source={craftIcons[item.craft]} />
                    <Text>{item.skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Edit / Save / Discard */}
            {editing ? (
              <View style={styles.editRow}>
                <Pressable onPress={saveChanges} style={styles.primaryBtn}>
                  <Text style={{ fontSize: 14, color: "#fff", fontWeight: "600" }}>
                    Save changes
                  </Text>
                </Pressable>
                <Pressable onPress={discardChanges} style={styles.secondaryBtn}>
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>Discard</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.editProfileButton} onPress={startEditing}>
                <Text style={{ fontSize: 14 }}> Edit Profile </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Post tab navigation (my posts vs saved posts) */}
        {activeTab === "posts" ? (
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
    ),
    [insets.top, settingsOpen, editing, draftBio, originalUser, activeTab]
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
        keyboardShouldPersistTaps="handled"
      />
      <BottomNavButton />

      {/* Settings overlay */}
      <SettingsOverlay
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={() => console.log("Logged out")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  bioInput: {
    backgroundColor: "#F8F2E5",
    padding: 10,
    borderRadius: 15,
    minHeight: 80,
    textAlignVertical: "top",
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
  editRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 30,
    marginHorizontal: 30,
  },
  primaryBtn: {
    backgroundColor: "#C1521E",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  secondaryBtn: {
    backgroundColor: "#F8F2E5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
});
