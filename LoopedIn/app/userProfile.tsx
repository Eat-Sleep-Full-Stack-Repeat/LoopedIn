import React, { useEffect, useMemo, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  Pressable,
  TextInput,
  Alert,
  BackHandler,
  ActivityIndicator,
  Keyboard,
  Platform,
  useWindowDimensions,
} from "react-native";
import BottomNavButton from "@/components/bottomNavBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Storage } from "../utils/storage";
import API_URL from "@/utils/config";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import SettingsOverlay from "@/components/settingsoverlay";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

type User = {
  userName: string;
  userBio: string | null;
  avatarUrl?: string | null; // signed URL from backend
  posts?: any[];
  savedPosts?: any[];
};

type UploadAvatarResponse = {
  avatarUrl: string; // signed url 
};

const PROFILE_URL = `${API_URL}/api/profile`; // GET / PATCH
const UPLOAD_AVATAR_URL = `${API_URL}/api/profile/avatar`; // POST multipart

//Textbox really didn't like being typed in, using memo to avoid re-renders
const ProfileHeader = React.memo(function ProfileHeader(props: {
  insetsTop: number;
  editing: boolean;
  draftBio: string;
  setDraftBio: (s: string) => void;
  startEditing: () => void;
  discardChanges: () => void;
  saveChanges: () => void;
  saving: boolean;
  originalUser: User | null;
  setSettingsOpen: (b: boolean) => void;
  handleSavedPress: () => void;
  handlePostPress: () => void;
  activeTab: "posts" | "saved";
  effectiveAvatarSource: any;
  chooseAvatar: () => void;
  router: any;
  avatarSize: number;
}) {
  const {
    insetsTop,
    editing,
    draftBio,
    setDraftBio,
    startEditing,
    discardChanges,
    saveChanges,
    saving,
    originalUser,
    setSettingsOpen,
    handleSavedPress,
    handlePostPress,
    activeTab,
    effectiveAvatarSource,
    chooseAvatar,
    router,
    avatarSize,
  } = props;

  return (
    <View style={[styles.headerOuter, { paddingTop: insetsTop + 8 }]}>
      <View style={styles.headerInner}>
        <View style={styles.topAccountManagement}>
          <Text> DMs </Text>
          <Pressable onPress={() => setSettingsOpen(true)}>
            <Text>Settings</Text>
          </Pressable>
        </View>

        {/* avatar + username */}
        <View style={styles.userInfoContainer}>
          <Pressable
            onPress={editing ? chooseAvatar : undefined}
            disabled={!editing}
            style={({ pressed }) => [{ opacity: editing && pressed ? 0.8 : 1 }]}
          >
            <Image
              source={effectiveAvatarSource}
              style={[
                styles.avatar,
                { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
              ]}
            />
          </Pressable>

          <View>
            <Text style={{ fontSize: 20 }}>{originalUser?.userName ?? "User"}</Text>

            <View style={{ flexDirection: "row", gap: 20 }}>
              {/* Followers (placeholder) */}
              <Pressable
                style={{ flexDirection: "column", alignItems: "center" }}
                onPress={() => router.push("/followers")}
              >
                <View style={styles.countCircles}>
                  <Text style={{ fontSize: 24, color: "#C1521E" }}>0</Text>
                </View>
                <Text style={{ fontSize: 14 }}> Followers </Text>
              </Pressable>

              {/* Following (placeholder) */}
              <Pressable
                style={{ flexDirection: "column", alignItems: "center" }}
                onPress={() => router.push("/following")}
              >
                <View style={styles.countCircles}>
                  <Text style={{ fontSize: 24, color: "#C1521E" }}>0</Text>
                </View>
                <Text style={{ fontSize: 14 }}> Following </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* bio */}
        <View style={styles.bioContainer}>
          <Text style={{ fontSize: 14 }}> Bio </Text>
          {editing ? (
            <TextInput
              value={draftBio}
              onChangeText={setDraftBio}
              style={styles.bioInput}
              placeholder="Tell people about yourself"
              multiline
              blurOnSubmit={false}
            />
          ) : (
            <View style={styles.bioContentContainer}>
              <Text style={{ fontSize: 14 }}>{originalUser?.userBio ?? ""}</Text>
            </View>
          )}
        </View>

        {/* Edit / Save / Discard */}
        {editing ? (
          <View style={styles.editRow}>
            <Pressable
              onPress={
                saving
                  ? undefined
                  : () => {
                      Keyboard.dismiss();
                      saveChanges();
                    }
              }
              style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 14, color: "#fff", fontWeight: "600" }}>
                  Save changes
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={saving ? undefined : discardChanges}
              style={[styles.secondaryBtn, saving && { opacity: 0.6 }]}
            >
              <Text style={{ fontSize: 14, fontWeight: "600" }}>Discard</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.editProfileButton} onPress={startEditing}>
            <Text style={{ fontSize: 14 }}> Edit Profile </Text>
          </Pressable>
        )}

        {/* Post tab navigation */}
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
    </View>
  );
});

//Sceen component
export default function UserProfile() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Responsive bits, isTablet is used to determine it it is normal phone proportions or not, could be useful in later frontends
  const isTablet = width >= 768;
  const CONTENT_MAX = isTablet ? 720 : width;
  const NUM_COLUMNS = width >= 1024 ? 6 : width >= 820 ? 5 : width >= 600 ? 4 : 3;
  const AVATAR = isTablet ? 120 : 100;

  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Posts tab
  const [activeTab, setTab] = useState<"posts" | "saved">("posts");
  const [currentPosts, setPosts] = useState<any[]>([]);

  // Settings overlay
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [draftBio, setDraftBio] = useState("");
  const [draftAvatarUri, setDraftAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveAvatarSource = useMemo(() => {
    if (editing && draftAvatarUri) return { uri: draftAvatarUri };
    if (originalUser?.avatarUrl) return { uri: originalUser.avatarUrl };
    return require("@/assets/images/icons8-cat-profile-100.png");
  }, [editing, draftAvatarUri, originalUser?.avatarUrl]);

  const isDirty =
    editing &&
    !!originalUser &&
    (draftBio !== (originalUser.userBio ?? "") || draftAvatarUri !== null);

  //Profile loading
  useEffect(() => {
    let abort = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const token = await Storage.getItem("token");
        const res = await fetch(PROFILE_URL, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: abort.signal,
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`GET /api/profile failed (${res.status}) ${t}`);
        }
        const u = (await res.json()) as Partial<User>;

        const merged: User = {
          userName: u.userName ?? "User",
          userBio: u.userBio ?? "",
          avatarUrl: u.avatarUrl ?? null,
          posts: u.posts ?? [],
          savedPosts: u.savedPosts ?? [],
        };

        setOriginalUser(merged);
        setDraftBio(merged.userBio ?? "");
        setPosts(merged.posts ?? []);
        setTab("posts");
      } catch (e: any) {
        if (e.name !== "AbortError") setLoadError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();

    return () => abort.abort();
  }, []);

  //Safety net preventing leaving with unsaved changes
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
  }, [isDirty, draftBio, draftAvatarUri, originalUser]);

  //Editing/Saving/Discard handlers
  const startEditing = () => {
    if (!originalUser) return;
    setDraftBio(originalUser.userBio ?? "");
    setDraftAvatarUri(null);
    setEditing(true);
  };

  const discardChanges = () => {
    if (!originalUser) return;
    setDraftBio(originalUser.userBio ?? "");
    setDraftAvatarUri(null);
    setEditing(false);
  };

  const saveChanges = async () => {
    if (!originalUser) return;

    let succeeded = false;

    try {
      setSaving(true);
      const token = await Storage.getItem("token");

      let newAvatarUrl: string | undefined;

      // Upload avatar if picked 
      if (draftAvatarUri) {
        const manipulated = await ImageManipulator.manipulateAsync(
          draftAvatarUri,
          [{ resize: { width: 512 } }],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );

        const form = new FormData();

        if (Platform.OS === "web") {
          const resp = await fetch(manipulated.uri);
          const blob = await resp.blob();
          const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          form.append("file", file);
        } else {
          form.append("file", {
            uri: manipulated.uri,
            name: "avatar.jpg",
            type: "image/jpeg",
          } as any);
        }

        const uploadRes = await fetch(UPLOAD_AVATAR_URL, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });

        if (!uploadRes.ok) {
          const t = await uploadRes.text().catch(() => "");
          throw new Error(`Upload avatar failed (${uploadRes.status}): ${t}`);
        }
        const json = (await uploadRes.json().catch(() => ({}))) as
          | UploadAvatarResponse
          | any;
        newAvatarUrl = json?.avatarUrl;
      }

      // Build patch body only with changes
      const patchBody: any = {};
      const bioChanged = draftBio.trim() !== (originalUser.userBio ?? "");
      if (bioChanged) patchBody.userBio = draftBio.trim();
      if (newAvatarUrl) patchBody.avatarUrl = newAvatarUrl;

      // Send PATCH if needed
      if (Object.keys(patchBody).length > 0) {
        const patchRes = await fetch(PROFILE_URL, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(patchBody),
        });

        if (!patchRes.ok) {
          const t = await patchRes.text().catch(() => "");
          throw new Error(`PATCH /api/profile failed (${patchRes.status}): ${t}`);
        }

        let updated: any = {};
        try {
          updated = await patchRes.json();
        } catch {}

        setOriginalUser((prev) =>
          prev
            ? {
                ...prev,
                userBio: updated.userBio ?? patchBody.userBio ?? prev.userBio,
                avatarUrl:
                  updated.avatarUrl ?? patchBody.avatarUrl ?? prev.avatarUrl,
              }
            : prev
        );
      }

      succeeded = true;
      setDraftAvatarUri(null);
      Alert.alert("Profile updated");
    } catch (e: any) {
      Alert.alert("Could not save changes", String(e?.message ?? e));
    } finally {
      setSaving(false);
      if (succeeded) setEditing(false);
    }
  };

  //Image picker, uses built in crop ui if on iOS/Android
  const chooseAvatar = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission needed", "Allow photo library access to choose an avatar.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,    // native crop UI on iOS/Android
    aspect: [1, 1],
    quality: 0.95,
    selectionLimit: 1,
  });

  if (result.canceled) return;
  const localUri = result.assets?.[0]?.uri;
  if (!localUri) return;

  setDraftAvatarUri(localUri);
  if (!editing) setEditing(true);
};


  const handlePostPress = () => {
    if (!originalUser) return;
    setTab("posts");
    setPosts(originalUser.posts ?? []);
  };

  const handleSavedPress = () => {
    if (!originalUser) return;
    setTab("saved");
    setPosts(originalUser.savedPosts ?? []);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

  if (loadError || !originalUser) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>{loadError ? `Error: ${loadError}` : "No user loaded"}</Text>
        <Pressable onPress={() => router.replace("/")}>
          <Text>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  const cardW = Math.min(CONTENT_MAX, width) / NUM_COLUMNS - 10;

  return (
    <View style={styles.container}>
      <FlatList
        data={currentPosts}
        numColumns={NUM_COLUMNS}
        key={NUM_COLUMNS} 
        ListHeaderComponent={
          <ProfileHeader
            insetsTop={insets.top}
            editing={editing}
            draftBio={draftBio}
            setDraftBio={setDraftBio}
            startEditing={startEditing}
            discardChanges={discardChanges}
            saveChanges={saveChanges}
            saving={saving}
            originalUser={originalUser}
            setSettingsOpen={setSettingsOpen}
            handleSavedPress={handleSavedPress}
            handlePostPress={handlePostPress}
            activeTab={activeTab}
            effectiveAvatarSource={effectiveAvatarSource}
            chooseAvatar={chooseAvatar}
            router={router}
            avatarSize={AVATAR}
          />
        }
        renderItem={({ item }) => (
          <Image
            source={item}
            resizeMode="cover"
            style={{
              width: cardW,
              height: cardW * (16 / 9),
              borderRadius: 20,
              marginBottom: 8,
            }}
          />
        )}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 10,
        }}
        contentContainerStyle={{
          alignSelf: "center",
          width: "100%",
          maxWidth: CONTENT_MAX,
          paddingBottom: insets.bottom + 100,
          paddingTop: 10,
        }}
        keyboardShouldPersistTaps="always"
        removeClippedSubviews={false}
      />

      <BottomNavButton />

      <SettingsOverlay
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F2E5", 
  },

  headerOuter: {
    backgroundColor: "#E0D5DD",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 16,
    marginBottom: 12,
  },
  headerInner: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 720,
    paddingHorizontal: 16,
  },

  topAccountManagement: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 20,
    marginBottom: 20,
    marginRight: 4,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  avatar: {
    backgroundColor: "#F8F2E5",
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
    marginBottom: 16,
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

  postTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    marginTop: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  postTabText: {
    backgroundColor: "#F7B557",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 15,
  },

  editProfileButton: {
    backgroundColor: "#F8F2E5",
    marginBottom: 20,
    marginHorizontal: 85,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 15,
  },
  editRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
    marginHorizontal: 30,
  },
  primaryBtn: {
    backgroundColor: "#C1521E",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 130,
    alignItems: "center",
  },
  secondaryBtn: {
    backgroundColor: "#F8F2E5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 110,
    alignItems: "center",
  },
});

