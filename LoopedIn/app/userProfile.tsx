import React, { useEffect, useMemo, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  BackHandler,
  ActivityIndicator,
  Keyboard,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
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
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Feather } from "@expo/vector-icons";

/* ----------------------------- Types ----------------------------- */
type User = {
  userName: string;
  userBio: string | null;
  avatarUrl?: string | null;
  posts?: any[];
  savedPosts?: any[];
};

type UploadAvatarResponse = {
  avatarUrl: string;
};

/* --------------------------- Constants --------------------------- */
const PROFILE_URL = `${API_URL}/api/profile`;
const UPLOAD_AVATAR_URL = `${API_URL}/api/profile/avatar`;

/* -------- helper: get first picture / thumbnail from item -------- */
function getThumbnailSource(item: any): any | null {
  if (!item) return null;

  // handle post objects from /api/profile
  if (item.previewUrl) {
    return { uri: item.previewUrl };
  }
  if (item.preview_url) {
    return { uri: item.preview_url };
  }

  if (typeof item === "string") return { uri: item };
  if (item.uri || item.url || item.imageUrl) {
    return { uri: item.uri || item.url || item.imageUrl };
  }

  if (Array.isArray(item) && item.length > 0) {
    const first = item[0];
    if (typeof first === "string") return { uri: first };
    if (first?.uri || first?.url || first?.imageUrl) {
      return { uri: first.uri || first.url || first.imageUrl };
    }
    return first;
  }

  const photosArray =
    item.photos || item.images || item.pics || item.postPics || null;

  if (Array.isArray(photosArray) && photosArray.length > 0) {
    const first = photosArray[0];
    if (typeof first === "string") return { uri: first };
    if (first?.uri || first?.url || first?.imageUrl) {
      return { uri: first.uri || first.url || first.imageUrl };
    }
    return first;
  }

  return item;
}

/* --------------------- Header --------------------- */
const ProfileHeader = React.memo(function ProfileHeader(props: {
  insetsTop: number;
  colors: ReturnType<typeof getColors>;
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
  onLogout: () => void;
}) {
  const {
    insetsTop,
    colors,
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
    onLogout,
  } = props;

  const s = themedStyles(colors);

  const placeholderBio =
    !editing && (!originalUser?.userBio || originalUser?.userBio.trim() === "")
      ? "Click Edit to make your bio!"
      : originalUser?.userBio ?? "";

  return (
    <View style={[s.headerOuter, { paddingTop: insetsTop + 8 }]}>
      <View style={s.headerBg} />
      <View style={s.headerInner}>
        <View style={s.topAccountManagement}>
          <Pressable style={s.iconCol} onPress={() => router.push("/dms")}>
            <Feather name="message-circle" size={24} color={colors.text} />
            <Text style={[s.iconLabel, { color: colors.text }]}>DMs</Text>
          </Pressable>

          <Pressable style={s.iconCol} onPress={() => setSettingsOpen(true)}>
            <Feather name="settings" size={24} color={colors.text} />
            <Text style={[s.iconLabel, { color: colors.text }]}>Settings</Text>
          </Pressable>
        </View>

        {/* avatar + username */}
        <View style={s.userInfoContainer}>
          <View style={{ position: "relative" }}>
            <Pressable
              onPress={editing ? chooseAvatar : undefined}
              disabled={!editing}
              style={({ pressed }) => [{ opacity: editing && pressed ? 0.8 : 1 }]}
            >
              <Image
                source={effectiveAvatarSource}
                style={[
                  s.avatar,
                  { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
                ]}
              />
            </Pressable>
            {editing && (
              <Pressable style={s.pencilBadge} onPress={editing ? chooseAvatar : undefined}>
                <Feather name="edit-2" size={14} color={colors.badgeIcon} />
              </Pressable>
            )}
          </View>

          <View>
            <Text style={[s.userName, { color: colors.text }]}>
              {originalUser?.userName ?? "User"}
            </Text>

            <View style={{ flexDirection: "row", gap: 20 }}>
              <Pressable style={s.countCol} onPress={() => router.push("/followers")}>
                <View style={s.countCircles}>
                  <Text style={[s.countNum, { color: colors.decorativeText }]}>0</Text>
                </View>
                <Text style={[s.countLabel, { color: colors.text }]}>Followers</Text>
              </Pressable>

              <Pressable style={s.countCol} onPress={() => router.push("/following")}>
                <View style={s.countCircles}>
                  <Text style={[s.countNum, { color: colors.decorativeText }]}>0</Text>
                </View>
                <Text style={[s.countLabel, { color: colors.text }]}>Following</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* bio */}
        <View style={s.bioContainer}>
          <Text style={[s.bioTitle, { color: colors.text }]}>Bio</Text>
          {editing ? (
            <TextInput
              value={draftBio}
              onChangeText={setDraftBio}
              style={s.bioInput}
              multiline
              blurOnSubmit={false}
            />
          ) : (
            <View style={s.bioContentContainer}>
              <Text style={[s.bioText, { color: colors.text }]}>{placeholderBio}</Text>
            </View>
          )}
        </View>

        {/* Edit / Save / Discard */}
        {editing ? (
          <View style={s.editRow}>
            <Pressable
              onPress={
                saving
                  ? undefined
                  : () => {
                      Keyboard.dismiss();
                      saveChanges();
                    }
              }
              style={[s.primaryBtn, saving && { opacity: 0.6 }]}
            >
              {saving ? (
                <ActivityIndicator color={colors.buttonOnPrimary} />
              ) : (
                <Text style={s.primaryBtnText}>Save changes</Text>
              )}
            </Pressable>
            <Pressable
              onPress={saving ? undefined : discardChanges}
              style={[s.secondaryBtn, saving && { opacity: 0.6 }]}
            >
              <Text style={s.secondaryBtnText}>Discard</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.actionsColumn}>
            <Pressable style={s.editProfileButton} onPress={startEditing}>
              <Text style={s.editProfileButtonText}>Edit Profile</Text>
            </Pressable>

            <TouchableOpacity style={s.logoutButton} onPress={onLogout}>
              <Text style={s.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Post tab navigation */}
        {activeTab === "posts" ? (
          <View style={s.postTabs}>
            <View style={s.postTabText}>
              <Text style={{ color: colors.decorativeText }}>My Posts</Text>
            </View>
            <Pressable onPress={handleSavedPress} style={{ padding: 10 }}>
              <Text style={{ color: colors.text }}>Saved Posts</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.postTabs}>
            <Pressable onPress={handlePostPress} style={{ padding: 10 }}>
              <Text style={{ color: colors.text }}>My Posts</Text>
            </Pressable>
            <View style={s.postTabText}>
              <Text style={{ color: colors.decorativeText }}>Saved Posts</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
});

/* --------------------------- Screen --------------------------- */
export default function UserProfile() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // THEME
  const { currentTheme } = useTheme();
  const colors = getColors(currentTheme);
  const s = themedStyles(colors);

  // Responsive bits
  const isTablet = width >= 768;
  const CONTENT_MAX = isTablet ? 720 : width;
  const NUM_COLUMNS = width >= 1024 ? 6 : width >= 820 ? 5 : width >= 600 ? 4 : 3;
  const AVATAR = isTablet ? 120 : 100;

  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Token gate
  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  // Posts tab – data from API
  const [activeTab, setTab] = useState<"posts" | "saved">("posts");
  const [currentPosts, setPosts] = useState<any[]>([]);

  // Settings overlay
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [draftBio, setDraftBio] = useState("");
  const [draftAvatarUri, setDraftAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // token to trigger reload when screen regains focus
  const [reloadToken, setReloadToken] = useState(0);

  const effectiveAvatarSource = useMemo(() => {
    if (editing && draftAvatarUri) return { uri: draftAvatarUri };
    if (originalUser?.avatarUrl) return { uri: originalUser.avatarUrl };
    return require("@/assets/images/icons8-cat-profile-100.png");
  }, [editing, draftAvatarUri, originalUser?.avatarUrl]);

  const isDirty =
    editing &&
    !!originalUser &&
    (draftBio !== (originalUser.userBio ?? "") || draftAvatarUri !== null);

  /* ------------------ Gate: check token first ------------------ */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await Storage.getItem("token");
      if (!mounted) return;
      setHasToken(!!token);
      setTokenChecked(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------------- Load profile ----------------------- */
  useEffect(() => {
    if (!tokenChecked || !hasToken) return;

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

    return () => {
      abort.abort();
    };
  }, [tokenChecked, hasToken, reloadToken]); // <-- include reloadToken

  /* ---------- Refetch when screen regains focus (after newpost) ---------- */
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setReloadToken((t) => t + 1);
    });

    return unsubscribe;
  }, [navigation]);

  /* ------------- Guard leaving when there are changes ------------- */
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
              // @ts-ignore
              navigation.dispatch(e.data.action);
            },
          },
          { text: "Save", onPress: saveChanges },
        ]
      );
    };

    // @ts-ignore
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
  }, [isDirty, draftBio, draftAvatarUri, originalUser, navigation]);

  /* -------------------- Handlers -------------------- */
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
        let processedUri = draftAvatarUri;
        try {
          const canManipulate =
            Platform.OS !== "web" &&
            typeof ImageManipulator?.manipulateAsync === "function";
          if (canManipulate) {
            const manipulated = await ImageManipulator.manipulateAsync(
              draftAvatarUri,
              [{ resize: { width: 512 } }],
              { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );
            processedUri = manipulated.uri;
          }
        } catch {
          processedUri = draftAvatarUri;
        }

        const form = new FormData();

        if (Platform.OS === "web") {
          const resp = await fetch(processedUri);
          const blob = await resp.blob();
          const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          form.append("file", file);
        } else {
          form.append("file", {
            uri: processedUri,
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
        const json = (await uploadRes.json().catch(() => ({}))) as UploadAvatarResponse;
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

        const updated = await patchRes.json().catch(() => ({} as any));

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
      allowsEditing: true,
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

  const handleCreatePost = () => {
    router.push("/newpost");
  };

  const handleLogout = async () => {
    await Storage.removeItem("token");

    setTimeout(() => {
      router.push("/"); //index for dev purposes; later should be login
      setSettingsOpen(false);
    }, 0);

    console.log("Logged out!");
  };

  /* ----------------------- Login Gate Screens ----------------------- */
  if (!tokenChecked) {
    return (
      <View style={s.container}>
        <View style={s.centerFill}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: colors.text }}>Preparing…</Text>
        </View>
        <BottomNavButton />
      </View>
    );
  }

  if (tokenChecked && hasToken === false) {
    return (
      <View style={s.container}>
        <View style={[s.centerFill, { paddingHorizontal: 24 }]}>
          <Text style={{ color: colors.text, fontSize: 18, textAlign: "center", marginBottom: 12 }}>
            You need to log in to access this page.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={[s.primaryBtn, { paddingHorizontal: 20, minWidth: 160 }]}
          >
            <Text style={s.primaryBtnText}>Go to Log In</Text>
          </TouchableOpacity>
        </View>
        <BottomNavButton />
      </View>
    );
  }

  /* ----------------------- Loading / Error ----------------------- */
  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.centerFill}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: colors.text }}>Loading…</Text>
        </View>
        <BottomNavButton />
      </View>
    );
  }

  if (loadError || !originalUser) {
    return (
      <View style={s.container}>
        <View style={s.centerFill}>
          <Text style={{ color: colors.text }}>
            {loadError ? `Error: ${loadError}` : "No user loaded"}
          </Text>
          <Pressable onPress={() => router.replace("/")}>
            <Text style={{ color: colors.link, marginTop: 8 }}>Go Home</Text>
          </Pressable>
        </View>
        <BottomNavButton />
      </View>
    );
  }

  /* --------------------------- Render --------------------------- */
  const cardW = Math.min(CONTENT_MAX, width) / NUM_COLUMNS - 10;

  return (
    <View style={s.container}>
      <FlatList
        data={currentPosts}
        numColumns={NUM_COLUMNS}
        key={NUM_COLUMNS}
        ListHeaderComponent={
          <ProfileHeader
            insetsTop={insets.top}
            colors={colors}
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
            onLogout={handleLogout}
          />
        }
        renderItem={({ item }) => {
          const thumbSource = getThumbnailSource(item);
          if (!thumbSource) return null;

          return (
            <Pressable onPress={() => router.push("/")}>
              <Image
                source={thumbSource}
                resizeMode="cover"
                style={{
                  width: cardW,
                  height: cardW * (16 / 9),
                  borderRadius: 20,
                  marginBottom: 8,
                }}
              />
            </Pressable>
          );
        }}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          paddingHorizontal: 10,
          columnGap: 10,   
        }}

        contentContainerStyle={{
          alignSelf: "center",
          width: "100%",
          maxWidth: CONTENT_MAX,
          paddingBottom: insets.bottom + 100,
          paddingTop: 10,
          backgroundColor: colors.background,
        }}
        keyboardShouldPersistTaps="always"
        removeClippedSubviews={false}
      />

      <Pressable
        style={[s.floatingButton, { bottom: insets.bottom + 90 }]}
        onPress={handleCreatePost}
      >
        <Feather name="plus" size={28} color={colors.decorativeText} />
      </Pressable>

      <BottomNavButton />

      <SettingsOverlay
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={handleLogout}
      />
    </View>
  );
}

/* ---------------------- Theme helpers ---------------------- */
function getColors(themeKey: string) {
  const base = Colors[themeKey];
  return {
    ...base,
    mutedText: base?.mutedText ?? "#8a8a8a",
    link: base?.link ?? "#2f6fed",
    badgeBg: base?.badgeBg ?? "#00000088",
    badgeIcon: base?.badgeIcon ?? "#ffffff",
    buttonOnPrimary: base?.buttonOnPrimary ?? (base?.decorativeText || "#000"),
  };
}

/* ---------------------------- Styles ---------------------------- */
const themedStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerFill: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    headerOuter: {
      position: "relative",
      backgroundColor: "transparent",
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      paddingBottom: 16,
      marginBottom: 12,
      overflow: "hidden",
    },
    headerBg: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.topBackground,
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
    iconCol: { alignItems: "center" },
    iconLabel: { fontSize: 12, marginTop: 4 },
    userInfoContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    userName: { fontSize: 20, fontWeight: "600" },
    avatar: { backgroundColor: colors.boxBackground },
    pencilBadge: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.badgeBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "#00000022",
    },
    countCol: { alignItems: "center" },
    countCircles: {
      backgroundColor: colors.decorativeBackground,
      width: 50,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 25,
      flexDirection: "row",
    },
    countNum: { fontSize: 24 },
    countLabel: { fontSize: 14, marginTop: 4 },
    bioContainer: {
      flexDirection: "column",
      marginHorizontal: 30,
      marginBottom: 16,
      marginTop: 10,
    },
    bioTitle: { fontSize: 14, marginBottom: 6 },
    bioContentContainer: {
      backgroundColor: colors.boxBackground,
      padding: 10,
      borderRadius: 15,
    },
    bioText: { fontSize: 14 },
    bioInput: {
      backgroundColor: colors.boxBackground,
      color: colors.text,
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
      backgroundColor: colors.decorativeBackground,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 15,
    },
    actionsColumn: {
      gap: 12,
      marginBottom: 8,
      paddingHorizontal: 30,
    },
    editProfileButton: {
      backgroundColor: colors.boxBackground,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 15,
    },
    editProfileButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    logoutButton: {
      backgroundColor: colors.boxBackground,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 15,
    },
    logoutButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    editRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginBottom: 20,
      marginHorizontal: 30,
    },
    primaryBtn: {
      backgroundColor: colors.decorativeBackground,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      minWidth: 130,
      alignItems: "center",
    },
    primaryBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.decorativeText,
    },
    secondaryBtn: {
      backgroundColor: colors.boxBackground,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      minWidth: 110,
      alignItems: "center",
    },
    secondaryBtnText: { fontSize: 14, fontWeight: "600", color: colors.text },
    floatingButton: {
      position: "absolute",
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.decorativeBackground,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 5,
    },
  });
