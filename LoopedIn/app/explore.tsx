import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import BottomNavButton from "@/components/bottomNavBar";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ExploreCommentsModal from "@/components/exploreComments";
import API_URL from "@/utils/config";
import { Storage } from "../utils/storage";
import { GestureHandlerRootView, RefreshControl } from "react-native-gesture-handler";

type Post = {
  id: string;
  username: string;
  userID: string;
  profilePic: string | null;
  postImage: string; // only most recent image
  postImageID: string;
  caption: string;
  datePosted: string;
};

type BackendPost = {
  fld_post_pk: string;
  fld_caption: string;
  fld_profile_pic: string | null;
  fld_post_pic: string;
  fld_pic_id: string;
  fld_username: string;
  fld_timestamp: string;
  fld_user_pk: string;
};

export default function ExplorePage() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] = useState("All");
  const filters = ["All", "Crochet", "Knit", "Misc"];

  const staticTags = ["cozy", "crochet", "blanket", "money", "daily"];

  const [areCommentsVisible, setAreCommentsVisible] = useState(false);
  const currentPost = useRef<number | null>(null);
  const creatorID = useRef<number | null>(null);

  // responsive sizes
  const { width } = useWindowDimensions();
  let avatarSize: number;
  let usernameSize: number;
  let imageHeight: number;

  if (width >= 900) {
    usernameSize = 18;
    avatarSize = 50;
    imageHeight = 700;
  } else if (width >= 768) {
    usernameSize = 17;
    avatarSize = 45;
    imageHeight = 600;
  } else {
    usernameSize = 15;
    avatarSize = 35;
    imageHeight = 300;
  }

  const limit = 10;
  const lastTimeStamp = useRef<string | null>(null);
  const lastPostID = useRef<number | null>(null);
  const hasMore = useRef(true);
  const loadingMore = useRef(false);

  const [postData, setPostData] = useState<Post[]>([]);
  const posts: Post[] = useMemo(() => postData, [postData]);

  const [refreshing, setRefreshing] = useState(false);
  const [craftFilter, setCraftFilter] = useState<string[]>(["Crochet", "Knit", "Misc"]);

  const showComments = (item: Post) => {
    currentPost.current = Number(item.id);
    creatorID.current = Number(item.userID);
    setAreCommentsVisible(true);
  };

  const fetchData = async () => {
    const token = await Storage.getItem("token");

    if (loadingMore.current || !hasMore.current) return;
    loadingMore.current = true;

    try {
      const includeBefore = lastTimeStamp.current ? `&before=${lastTimeStamp.current}` : "";
      const includePostID = lastPostID.current ? `&postID=${lastPostID.current}` : "";

      let craftURL = ``;
      craftFilter.forEach((element) => {
        const tempElement = element.replace(/"/g, "");
        craftURL += `&craft[]=${tempElement}`;
      });

      const response = await fetch(
        `${API_URL}/api/post?limit=${limit}${includeBefore}${includePostID}${craftURL}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (response.status === 404) {
        alert("Woah! You hit a new category with no posts. Start posting now!");
        return;
      }

      if (!response.ok) {
        alert("Error during post fetch from backend. You're probably not logged in.");
        router.replace("/");
        return;
      }

      const responseData = await response.json();

      const tempPostData: Post[] = responseData.newFeed.map((post: BackendPost) => ({
        id: post.fld_post_pk,
        username: post.fld_username,
        userID: post.fld_user_pk,
        profilePic: post.fld_profile_pic,
        postImage: post.fld_post_pic,
        postImageID: post.fld_pic_id,
        caption: post.fld_caption,
        datePosted: post.fld_timestamp,
      }));

      setPostData((prev) => [...prev, ...tempPostData]);

      hasMore.current = responseData.hasMore;

      if (tempPostData.length > 0) {
        lastTimeStamp.current = tempPostData[tempPostData.length - 1].datePosted;
        lastPostID.current = Number(tempPostData[tempPostData.length - 1].id);
      }
    } catch (error) {
      console.log("Error fetching posts: ", error);
    } finally {
      loadingMore.current = false;
    }
  };

  // filter -> craft array for backend
  useEffect(() => {
    if (selectedFilter === "All") setCraftFilter(["Crochet", "Knit", "Misc"]);
    else setCraftFilter([selectedFilter]);
  }, [selectedFilter]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);

    // reset pagination + data
    setPostData([]);
    lastPostID.current = null;
    lastTimeStamp.current = null;
    hasMore.current = true;
  };

  // when craft filter changes, refresh and refetch
  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [craftFilter]);

  // fetch after refresh flips true
  useEffect(() => {
    if (!refreshing) return;

    const run = async () => {
      try {
        await fetchData();
      } catch (e) {
        console.log("error when refreshing data", e);
      } finally {
        setRefreshing(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <View style={styles.postContainer}>
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() =>
            router.push({
              pathname: "/userProfile/[id]",
              params: { id: item.userID },
            })
          }
        >
          <Image
            style={styles.profilePic}
            source={
              item?.profilePic
                ? { uri: item.profilePic }
                : require("@/assets/images/icons8-cat-profile-100.png")
            }
          />
          <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/singlePost/[id]",
              params: { id: item.id },
            })
          }
        >
          <Image style={[styles.postImage, { height: imageHeight }]} source={{ uri: item.postImage }} />

          <View style={{ marginVertical: 20, flexShrink: 1 }}>
            <Text style={styles.postCaption} numberOfLines={5} ellipsizeMode="tail">
              {item.caption}
            </Text>
          </View>

          {!!staticTags.length && (
            <View style={styles.tagRow}>
              {staticTags.map((tag) => (
                <View key={`${item.id}-${tag}`} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>

        <View style={styles.postActions}>
          <View style={styles.postAction}>
            <Image style={[styles.actionIcon, { tintColor: colors.text }]} source={require("../assets/images/heart.png")} />
            <Text style={styles.postActionText}>Like</Text>
          </View>

          <View style={styles.postAction}>
            <Pressable onPress={() => showComments(item)} style={{ alignItems: "center" }}>
              <Image style={[styles.actionIcon, { tintColor: colors.text }]} source={require("../assets/images/comment.png")} />
              <Text style={styles.postActionText}>Comment</Text>
            </Pressable>
          </View>

          <View style={styles.postAction}>
            <Image style={[styles.actionIcon, { tintColor: colors.text }]} source={require("../assets/images/tags.png")} />
            <Text style={styles.postActionText}>Tags</Text>
          </View>

          <View style={styles.postAction}>
            <Image style={[styles.actionIcon, { tintColor: colors.text }]} source={require("../assets/images/saved.png")} />
            <Text style={styles.postActionText}>Saved</Text>
          </View>
        </View>
      </View>
    ),
    [colors.text, imageHeight, router, staticTags]
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      backgroundColor: colors.exploreBackground,
      justifyContent: "center",
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: "700",
      textAlign: "center",
      marginVertical: 15,
      color: colors.text,
    },
    searchBar: {
      height: 40,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      borderColor: colors.exploreFilterSelected,
      backgroundColor: "#FFFFFF",
      color: "#000000",
    },
    filterContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 15,
      marginVertical: 15,
    },
    filterTag: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 15,
      backgroundColor: currentTheme === "light" ? "#FFFFFF" : "#2E2E2E",
      borderWidth: 1,
      borderColor: colors.exploreBorder,
    },
    filterTagSelected: {
      backgroundColor: colors.exploreFilterSelected,
      borderColor: colors.exploreFilterSelected,
    },
    filterText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    filterTextSelected: {
      color: currentTheme === "light" ? colors.text : "#FFFFFF",
    },
    postContainer: {
      backgroundColor: colors.exploreCardBackground,
      marginHorizontal: 20,
      marginBottom: 25,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.exploreBorder,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    profilePic: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: 100,
      marginRight: 10,
    },
    username: {
      fontWeight: "600",
      fontSize: usernameSize,
      color: colors.text,
    },
    postImage: {
      width: "100%",
      borderRadius: 8,
      backgroundColor: "#EAEAEA",
    },
    postCaption: {
      fontSize: 14,
      color: colors.text,
      flexShrink: 1,
    },
    postActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 10,
    },
    postAction: {
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    actionIcon: {
      width: 20,
      height: 20,
      resizeMode: "contain",
    },
    postActionText: {
      color: colors.text,
      fontSize: 12,
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
      borderColor: colors.decorativeBackground,
      backgroundColor: "transparent",
      marginRight: 8,
      marginBottom: 8,
    },
    tagText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
  });

  return (
    <>
      <View style={styles.container}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Explore</Text>

          <Pressable onPress={() => router.push("/exploreSearch")} style={{ marginHorizontal: 20 }}>
            <View pointerEvents="none">
              <TextInput
                style={styles.searchBar}
                placeholder="Search username or tags"
                placeholderTextColor="#666"
                editable={false}
              />
            </View>
          </Pressable>

          <View style={styles.filterContainer}>
            {filters.map((filterOption) => (
              <Pressable
                key={filterOption}
                onPress={() => setSelectedFilter(filterOption)}
                style={[styles.filterTag, selectedFilter === filterOption && styles.filterTagSelected]}
              >
                <Text style={[styles.filterText, selectedFilter === filterOption && styles.filterTextSelected]}>
                  {filterOption}
                </Text>
              </Pressable>
            ))}
          </View>

          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            onEndReached={fetchData}
            onEndReachedThreshold={0.2}
            ListEmptyComponent={() => {
              if (loadingMore.current) return <ActivityIndicator size="small" color={colors.text} />;
              return (
                <View style={{ paddingVertical: 40 }}>
                  <Text style={{ color: colors.settingsText, fontWeight: "bold", textAlign: "center" }}>
                    No Recent Posts
                  </Text>
                </View>
              );
            }}
            ListFooterComponent={() => {
              if (posts.length === 0) return <View style={{ height: 160 }} />;
              if (!hasMore.current) {
                return (
                  <View style={{ paddingBottom: 150, alignItems: "center", marginTop: 15 }}>
                    <Text style={{ color: colors.text }}>No More Data To Load</Text>
                  </View>
                );
              }
              return (
                <View style={{ paddingBottom: 150, alignItems: "center", marginTop: 15 }}>
                  <ActivityIndicator size="small" color={colors.text} />
                </View>
              );
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          />
        </GestureHandlerRootView>

        <ExploreCommentsModal
          isVisible={areCommentsVisible}
          onClose={() => {
            setAreCommentsVisible(false);
            currentPost.current = null;
            creatorID.current = null;
          }}
          currentPost={currentPost.current}
          postCreator={creatorID.current}
        />

        <BottomNavButton />
      </View>
    </>
  );
}
