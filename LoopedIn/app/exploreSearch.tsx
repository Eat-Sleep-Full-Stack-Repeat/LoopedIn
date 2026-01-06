import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import API_URL from "@/utils/config";
import { Storage } from "../utils/storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SearchType = "user" | "tag";

type UserResult = {
  userID: string;
  username: string;
  profilePic: string | null;
};

type BackendPostRow = {
  fld_user_pk: string;
  fld_post_pk: string;
  fld_username: string;
  fld_profile_pic: string | null;
  fld_caption: string;
  fld_timestamp: string;
  fld_pic_id: string;
  fld_post_pic: string;
};

type TagObj = { name: string; color: string };

type Post = {
  id: string;
  username: string;
  userID: string;
  profilePic: string | null;
  postImage: string;
  postImageID: string;
  caption: string;
  datePosted: string;
};

export default function ExploreSearch() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [searchType, setSearchType] = useState<SearchType>("user");
  const [query, setQuery] = useState("");

  const [users, setUsers] = useState<UserResult[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tagsByPost, setTagsByPost] = useState<Record<string, TagObj[]>>({});

  const [loading, setLoading] = useState(false);

  const limit = 10;

  // user paging
  const lastUserName = useRef<string | null>(null);
  const lastUserID = useRef<string | null>(null);
  const hasMoreUsers = useRef(true);

  // post paging
  const lastPostTime = useRef<string | null>(null);
  const lastPostID = useRef<number | null>(null);
  const hasMorePosts = useRef(true);

  const loadingMore = useRef(false);

  const resetPaging = () => {
    lastUserName.current = null;
    lastUserID.current = null;
    hasMoreUsers.current = true;

    lastPostTime.current = null;
    lastPostID.current = null;
    hasMorePosts.current = true;

    loadingMore.current = false;
  };

  useEffect(() => {
    resetPaging();
    setUsers([]);
    setPosts([]);
    setTagsByPost({});
    if (query.trim()) runSearch(true);
  }, [searchType]);

  useEffect(() => {
    if (!query.trim()) {
      resetPaging();
      setUsers([]);
      setPosts([]);
      setTagsByPost({});
    }
  }, [query]);

  const runSearch = useCallback(
    async (fresh = false) => {
      const q = query.trim().toLowerCase();
      if (!q) return;

      if (fresh) {
        resetPaging();
        setUsers([]);
        setPosts([]);
        setTagsByPost({});
      }

      if (loadingMore.current) return;

      if (searchType === "user" && !hasMoreUsers.current) return;
      if (searchType === "tag" && !hasMorePosts.current) return;

      loadingMore.current = true;
      setLoading(true);

      try {
        const token = await Storage.getItem("token");

        let qs = `limit=${limit}`;

        if (searchType === "user") {
          if (lastUserName.current) qs += `&u_before_name=${encodeURIComponent(lastUserName.current)}`;
          if (lastUserID.current) qs += `&u_before_id=${encodeURIComponent(lastUserID.current)}`;
        } else {
          if (lastPostTime.current) qs += `&before=${encodeURIComponent(lastPostTime.current)}`;
          if (lastPostID.current) qs += `&postID=${lastPostID.current}`;
        }

        const res = await fetch(`${API_URL}/api/search?${qs}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: q, type: searchType }),
        });

        if (!res.ok) throw new Error(`Explore search failed: ${res.status}`);
        const data = await res.json();

        if (searchType === "user") {
          const newUsers: UserResult[] = Array.isArray(data.users) ? data.users : [];

          setPosts([]);
          setTagsByPost({});

          setUsers((prev) => {
            const combined = fresh ? newUsers : [...prev, ...newUsers];
            return Array.from(new Map(combined.map((u) => [u.userID, u])).values());
          });

          hasMoreUsers.current = !!data.hasMore;

          if (newUsers.length > 0) {
            const last = newUsers[newUsers.length - 1];
            lastUserName.current = (last.username || "").toLowerCase();
            lastUserID.current = last.userID;
          }
          return;
        }

        // tag search
        setUsers([]);

        const newPosts: Post[] = (data.newFeed || []).map((row: BackendPostRow) => ({
          id: String(row.fld_post_pk),
          userID: String(row.fld_user_pk),
          username: row.fld_username,
          profilePic: row.fld_profile_pic,
          postImage: row.fld_post_pic,
          postImageID: String(row.fld_pic_id),
          caption: row.fld_caption,
          datePosted: row.fld_timestamp,
        }));

        setPosts((prev) => {
          const combined = fresh ? newPosts : [...prev, ...newPosts];
          return Array.from(new Map(combined.map((p) => [p.id, p])).values());
        });

        if (data.tagsByPost) {
          setTagsByPost((prev) => (fresh ? data.tagsByPost : { ...prev, ...data.tagsByPost }));
        }

        hasMorePosts.current = !!data.hasMore;

        if (newPosts.length > 0) {
          lastPostTime.current = newPosts[newPosts.length - 1].datePosted;
          lastPostID.current = Number(newPosts[newPosts.length - 1].id);
        }
      } catch (e) {
        console.log("Explore search error:", e);
      } finally {
        setLoading(false);
        loadingMore.current = false;
      }
    },
    [query, searchType]
  );

  const goBack = () => {
    try {
      // @ts-ignore
      if (navigation?.canGoBack?.()) {
        // @ts-ignore
        navigation.goBack();
      } else {
        router.replace("/explore");
      }
    } catch {
      router.replace("/explore");
    }
  };

  const renderUser = ({ item }: { item: UserResult }) => (
    <Pressable
      style={styles(colors, isTablet).userRow}
      onPress={() =>
        router.push({
          pathname: "/userProfile/[id]",
          params: { id: item.userID },
        })
      }
    >
      <Image
        style={styles(colors, isTablet).userAvatar}
        source={
          item.profilePic ? { uri: item.profilePic } : require("@/assets/images/icons8-cat-profile-100.png")
        }
      />
      <Text style={styles(colors, isTablet).userName}>{item.username}</Text>
    </Pressable>
  );

  const renderPost = ({ item }: { item: Post }) => {
    const tags = tagsByPost?.[item.id] ?? [];
    return (
      <View style={styles(colors, isTablet).postCard}>
        <Pressable
          style={styles(colors, isTablet).profileRow}
          onPress={() =>
            router.push({
              pathname: "/userProfile/[id]",
              params: { id: item.userID },
            })
          }
        >
          <Image
            style={styles(colors, isTablet).profilePic}
            source={
              item.profilePic ? { uri: item.profilePic } : require("@/assets/images/icons8-cat-profile-100.png")
            }
          />
          <Text style={styles(colors, isTablet).username}>{item.username}</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/singlePost/[id]",
              params: { id: item.id },
            })
          }
        >
          <Image style={styles(colors, isTablet).postImage} source={{ uri: item.postImage }} />
          <Text style={styles(colors, isTablet).caption} numberOfLines={4}>
            {item.caption}
          </Text>

          {!!tags.length && (
            <View style={styles(colors, isTablet).tagRow}>
              {tags.slice(0, 18).map((t) => (
                <View key={`${item.id}-${t.name}`} style={[styles(colors, isTablet).tagChip, { borderColor: t.color }]}>
                  <Text style={styles(colors, isTablet).tagText}>#{t.name}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  const isUserMode = searchType === "user";
  const listData = isUserMode ? (users as any[]) : (posts as any[]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: colors.topBackground },
        }}
      />

      <View style={{ flex: 1, backgroundColor: colors.exploreBackground }}>
        <KeyboardAvoidingView
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.topBackground }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles(colors, isTablet).container, { paddingTop: insets.top + 18 }]}>
            <View style={styles(colors, isTablet).header}>
              <Pressable onPress={goBack} style={styles(colors, isTablet).backBtn} hitSlop={10}>
                <Feather name="arrow-left" size={26} color={colors.text} />
              </Pressable>
              <Text style={styles(colors, isTablet).headerText}>Search</Text>
            </View>

            <View style={styles(colors, isTablet).searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={isUserMode ? "Search username..." : "Search tag..."}
                placeholderTextColor={colors.text + "99"}
                style={styles(colors, isTablet).searchInput}
                returnKeyType="search"
                onSubmitEditing={() => runSearch(true)}
                autoFocus
              />
              <Pressable onPress={() => runSearch(true)} style={styles(colors, isTablet).iconBtn} hitSlop={10}>
                <Feather name="search" size={22} color={colors.decorativeText} />
              </Pressable>
            </View>

            <View style={styles(colors, isTablet).filters}>
              {(["user", "tag"] as const).map((t) => {
                const active = searchType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setSearchType(t)}
                    style={[
                      styles(colors, isTablet).filterBtn,
                      { backgroundColor: active ? colors.decorativeBackground : colors.boxBackground },
                    ]}
                  >
                    <Text style={{ color: active ? colors.decorativeText : colors.text, fontWeight: "700" }}>
                      {t === "user" ? "User Name" : "Tag"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!query.trim() ? (
              <Text style={{ color: colors.text, textAlign: "center", marginTop: 18 }}>
                Enter a search term and select a filter.
              </Text>
            ) : (
              <FlatList
                data={listData}
                keyExtractor={(item: any, idx) => (isUserMode ? `${item.userID}-${idx}` : `${item.id}-${idx}`)}
                renderItem={({ item }: any) => (isUserMode ? renderUser({ item }) : renderPost({ item }))}
                onEndReached={() => {
                  if (query.trim() && !loadingMore.current) runSearch(false);
                }}
                onEndReachedThreshold={0.6}
                ListEmptyComponent={() => (
                  <Text style={{ color: colors.text, textAlign: "center", marginTop: 18 }}>
                    No results found.
                  </Text>
                )}
                ListFooterComponent={() => {
                  if (!query.trim()) return null;

                  if (loading) return <ActivityIndicator size="small" color={colors.text} />;

                  if (isUserMode && !hasMoreUsers.current && users.length > 0) {
                    return (
                      <Text style={{ color: colors.text, textAlign: "center", paddingBottom: 40 }}>
                        No more users.
                      </Text>
                    );
                  }

                  if (!isUserMode && !hasMorePosts.current && posts.length > 0) {
                    return (
                      <Text style={{ color: colors.text, textAlign: "center", paddingBottom: 40 }}>
                        No more posts.
                      </Text>
                    );
                  }

                  return <View style={{ height: 40 }} />;
                }}
                contentContainerStyle={{ paddingBottom: 80 }}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = (colors: any, isTablet: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: isTablet ? 20 : 12,
      backgroundColor: colors.topBackground,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    backBtn: {
      padding: 8,
      borderRadius: 12,
    },
    headerText: {
      fontSize: 22,
      fontWeight: "900",
      color: colors.text,
    },

    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
      backgroundColor: colors.background,
      color: colors.text,
      paddingHorizontal: 12,
    },
    iconBtn: {
      padding: 10,
      marginLeft: 10,
      borderRadius: 10,
    },

    filters: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    filterBtn: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
    },

    // USERS
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.exploreBorder,
    },
    userAvatar: {
      width: 42,
      height: 42,
      borderRadius: 100,
    },
    userName: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 16,
    },

    // POSTS
    postCard: {
      backgroundColor: colors.exploreCardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.exploreBorder,
      padding: 12,
      marginTop: 10,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      gap: 10,
    },
    profilePic: {
      width: 36,
      height: 36,
      borderRadius: 100,
    },
    username: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 16,
    },
    postImage: {
      width: "100%",
      height: isTablet ? 520 : 320,
      borderRadius: 10,
      backgroundColor: "#EAEAEA",
    },
    caption: {
      marginTop: 10,
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 10,
    },
    tagChip: {
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      marginRight: 8,
      marginBottom: 8,
    },
    tagText: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 12,
    },
  });
