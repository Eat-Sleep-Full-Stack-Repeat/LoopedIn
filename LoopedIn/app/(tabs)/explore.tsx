import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ExploreCommentsModal from "@/components/exploreComments";
import API_URL from "@/utils/config";
import { Storage } from "../../utils/storage";
import {
  GestureHandlerRootView,
  RefreshControl,
} from "react-native-gesture-handler";
import { useAppSize } from "@/Hooks/useSize";
import { Feather } from "@expo/vector-icons";

type Tag = {
  tagID: string;
  tagColor: string;
  tagName: string;
};

type Post = {
  id: string;
  username: string;
  userID: string;
  profilePic: string | null;
  postImage: string;
  postImageID: string;
  caption: string;
  datePosted: string;
  isLiked: boolean;
  isSaved: boolean;
  tag_data: Tag[];
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
  fld_is_liked: boolean;
  fld_is_saved: boolean;
  tag_data: BackendTags[] | [];
};

type BackendTags = {
  tagID: string;
  tagName: string;
  tagColor: string;
};

export default function ExplorePage() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const [selectedFilter, setSelectedFilter] = useState("All");
  const filters = ["All", "Crochet", "Knit", "Misc"];
  const insets = useSafeAreaInsets();
  const [areCommentsVisible, setAreCommentsVisible] = useState(false);
  const router = useRouter();
  const currentPost = useRef<number | null>(null);
  const creatorID = useRef<number | null>(null);
  const size = useAppSize();

  const { width } = useWindowDimensions();
  let avatarSize;
  // let usernameSize;
  let imageHeight: number;

  if (width >= 900) {
    // usernameSize = 18;
    avatarSize = 50;
    imageHeight = 700;
  } else if (width >= 768) {
    // usernameSize = 17;
    avatarSize = 45;
    imageHeight = 600;
  } else {
    // usernameSize = 15;
    avatarSize = 35;
    imageHeight = 300;
  }

  const limit = 10;
  const lastTimeStamp = useRef<string | null>(null);
  const lastPostID = useRef<number | null>(null);
  const hasMore = useRef(true);

  const [postData, setPostData] = useState<Post[]>([]);
  const posts: Post[] = useMemo(() => postData, [postData]);
  const loadingMore = useRef<true | false>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [craftFilter, setCraftFilter] = useState<string[]>([
    "Crochet",
    "Knit",
    "Misc",
  ]);
  const likingIds = useRef<Set<string>>(new Set());
  const savingIds = useRef<Set<string>>(new Set());

  const updateLikeInState = useCallback((postId: string, isLiked: boolean) => {
    setPostData((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, isLiked } : post))
    );
  }, []);

  const updateSaveInState = useCallback((postId: string, isSaved: boolean) => {
    setPostData((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, isSaved } : post))
    );
  }, []);

  const handleLikePress = useCallback(
    async (item: Post) => {
      if (likingIds.current.has(item.id)) return;

      likingIds.current.add(item.id);
      const original = item.isLiked;
      updateLikeInState(item.id, !original);

      try {
        const token = await Storage.getItem("token");
        const res = await fetch(`${API_URL}/api/toggle_like?id=${item.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!res.ok) {
          updateLikeInState(item.id, original);
          alert("Failed to update like. Please try again.");
          return;
        }

        const data = await res.json();
        if (typeof data?.liked === "boolean")
          updateLikeInState(item.id, data.liked);
      } catch (e) {
        console.log("Error updating like: ", e);
        updateLikeInState(item.id, original);
      } finally {
        likingIds.current.delete(item.id);
      }
    },
    [updateLikeInState]
  );

  const handleSavePress = useCallback(
    async (item: Post) => {
      if (savingIds.current.has(item.id)) return;

      savingIds.current.add(item.id);
      const original = item.isSaved;
      updateSaveInState(item.id, !original);

      try {
        const token = await Storage.getItem("token");
        const res = await fetch(`${API_URL}/api/toggle_save?id=${item.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!res.ok) {
          updateSaveInState(item.id, original);
          alert("Failed to update save. Please try again.");
          return;
        }

        const data = await res.json();
        if (typeof data?.saved === "boolean")
          updateSaveInState(item.id, data.saved);
      } catch (e) {
        console.log("Error updating save: ", e);
        updateSaveInState(item.id, original);
      } finally {
        savingIds.current.delete(item.id);
      }
    },
    [updateSaveInState]
  );

  useEffect(() => {
    if (selectedFilter === "All") setCraftFilter(["Crochet", "Knit", "Misc"]);
    else setCraftFilter([selectedFilter]);
  }, [selectedFilter]);

  useEffect(() => {
    if (!refreshing) handleRefresh();
  }, [craftFilter]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setPostData([]);
    lastPostID.current = null;
    lastTimeStamp.current = null;
    hasMore.current = true;
  };

  useEffect(() => {
    if (!refreshing) return;

    const refreshNewData = async () => {
      try {
        await fetchData();
      } catch (e) {
        console.log("error when refreshing data", e);
      } finally {
        setRefreshing(false);
      }
    };

    refreshNewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  const fetchData = async () => {
    const token = await Storage.getItem("token");
    if (loadingMore.current || !hasMore.current) return;

    loadingMore.current = true;

    try {
      const includeBefore = lastTimeStamp.current
        ? `&before=${encodeURIComponent(lastTimeStamp.current)}`
        : "";

      const includePostID = lastPostID.current
        ? `&postID=${lastPostID.current}`
        : "";

      let craftURL = ``;
      craftFilter.forEach((element) => {
        const tempElement = element.replace(/"/g, "");
        craftURL = craftURL + `&craft[]=${encodeURIComponent(tempElement)}`;
      });

      const url = `${API_URL}/api/post?limit=${limit}${includeBefore}${includePostID}${craftURL}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.status === 404) {
        alert("Woah! You hit a new category with no posts. Start posting now!");
        return;
      } else if (!response.ok) {
        const txt = await response.text().catch(() => "");
        console.log("Explore fetch failed:", response.status, txt);

        if (response.status === 401 || response.status === 403) {
          alert("You are not logged in.");
          router.replace("/login");
          return;
        }

        alert("Error loading posts.");
        return;
      }

      const responseData = await response.json();

      const tempPostData: Post[] = responseData.newFeed.map(
        (post: BackendPost) => ({
          id: post.fld_post_pk,
          username: post.fld_username,
          userID: post.fld_user_pk,
          profilePic: post.fld_profile_pic,
          postImage: post.fld_post_pic,
          postImageID: post.fld_pic_id,
          caption: post.fld_caption,
          datePosted: post.fld_timestamp,
          isLiked: !!post.fld_is_liked,
          isSaved: !!post.fld_is_saved,
          tag_data: post.tag_data.map((tag: BackendTags) => ({
            tagID: tag.tagID,
            tagName: tag.tagName,
            tagColor: tag.tagColor,
          })),
        })
      );

      setPostData((prev) => [...prev, ...tempPostData]);
      hasMore.current = responseData.hasMore;

      if (tempPostData.length > 0) {
        lastTimeStamp.current =
          tempPostData[tempPostData.length - 1].datePosted;
        lastPostID.current = Number(tempPostData[tempPostData.length - 1].id);
      }
    } catch (error) {
      console.log("Error fetching posts: ", error);
    } finally {
      loadingMore.current = false;
    }
  };

  const showComments = (item: Post) => {
    currentPost.current = Number(item.id);
    creatorID.current = Number(item.userID);
    setAreCommentsVisible(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      backgroundColor: colors.exploreBackground,
      justifyContent: "center",
    },
    pageTitle: {
      fontSize: size.font.largeTitleText,
      fontWeight: size.weight.title,
      textAlign: "center",
      marginTop: 10,
      marginBottom: 20,
      color: colors.text,
    },
    searchBar: {
      height: 45,
      borderWidth: 1,
      borderRadius: 25,
      paddingHorizontal: 10,
      marginHorizontal: 20,
      borderColor: colors.decorativeBackground,
      backgroundColor: colors.background,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      // color: "green",
    },
    filterContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 15,
      marginVertical: 15,
    },
    filterTag: {
      width: 85,
      alignItems: "center",
      paddingVertical: 6,
      borderRadius: 50,
      backgroundColor: colors.secondaryButton,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
    },
    filterTagSelected: {
      backgroundColor: colors.decorativeBackground,
      borderColor: colors.decorativeBackground,
    },
    filterText: {
      fontSize: size.font.caption,
      fontWeight: size.weight.headline,
      color: colors.secondaryText,
    },
    filterTextSelected: {
      color: colors.antiText,
    },
    postContainer: {
      backgroundColor: colors.exploreCardBackground,
      marginHorizontal: 20,
      marginBottom: 25,
      borderRadius: 20,
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
      fontWeight: size.weight.headline,
      fontSize: size.font.headline,
      color: colors.text,
    },
    postImage: {
      width: "100%",
      borderRadius: 20,
      backgroundColor: colors.background,
    },
    postCaption: {
      fontSize: size.font.caption,
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
      width: size.iconSize,
      height: size.iconSize,
      resizeMode: "contain",
    },
    postActionText: {
      color: colors.text,
      fontSize: size.font.detailText,
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
      backgroundColor: "transparent",
      marginRight: 8,
      marginBottom: 8,
    },
    tagText: {
      fontSize: size.font.detailText,
      fontWeight: size.weight.title,
      color: colors.text,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 20,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
    },
    actionText: {
      marginLeft: 6,
    },
  });

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
          accessible={true}
          accessibilityHint={"Double tap to view " + item.username + " profile"}
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
          accessible={true}
          accessibilityHint={"Double tap to read more about this explore post."}
        >
          <Image
            style={[styles.postImage, { height: imageHeight }]}
            source={{ uri: item.postImage }}
          />

          <View style={{ marginVertical: 20, flexShrink: 1 }}>
            <Text
              style={styles.postCaption}
              numberOfLines={5}
              ellipsizeMode="tail"
            >
              {item.caption}
            </Text>
          </View>

          {!!item.tag_data.length && (
            <View style={styles.tagRow}>
              {item.tag_data.map((tag) => (
                <View
                  key={`${item.id}-${tag.tagID}`}
                  style={[styles.tagChip, { borderColor: tag.tagColor }]}
                >
                  {tag.tagName === "Knit" ||
                  tag.tagName === "Crochet" ||
                  tag.tagName === "Misc" ? (
                    <Text style={[styles.tagText, { color: colors.text }]}>
                      🌟{tag.tagName}
                    </Text>
                  ) : (
                    <Text style={[styles.tagText, { color: colors.text }]}>
                      #{tag.tagName}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </Pressable>

        {/* <View style={styles.postActions}>
          <Pressable
            style={styles.postAction}
            onPress={() => handleLikePress(item)}
            accessible={true}
            accessibilityLabel={"Like"}
            accessibilityHint={
              item.isLiked
                ? "double tap to unlike the post"
                : "double tap to like this post"
            }
            accessibilityState={
              item.isLiked ? { checked: true } : { checked: false }
            }
            accessibilityRole={"button"}
          >
            <Image
              style={[
                styles.actionIcon,
                { tintColor: item.isLiked ? "#E57373" : colors.text },
              ]}
              source={require("../../assets/images/heart.png")}
            />
            <Text style={styles.postActionText}>
              {item.isLiked ? "Liked" : "Like"}
            </Text>
          </Pressable>

          <View style={styles.postAction}>
            <Pressable
              onPress={() => showComments(item)}
              style={{ alignItems: "center" }}
              accessible={true}
              accessibilityLabel={"Comment feed"}
              accessibilityHint={
                "Double tap to open comment section on this post"
              }
              accessibilityRole={"button"}
            >
              <Image
                style={[styles.actionIcon, { tintColor: colors.text }]}
                source={require("../../assets/images/comment.png")}
              />
              <Text style={styles.postActionText}>Comment</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.postAction}
            onPress={() => handleSavePress(item)}
            accessible={true}
            accessibilityLabel={"Save"}
            accessibilityHint={
              item.isSaved
                ? "double tap to unsave this post"
                : "double tap to save this post"
            }
            accessibilityState={
              item.isSaved ? { checked: true } : { checked: false }
            }
            accessibilityRole={"button"}
          >
            <Image
              style={[
                styles.actionIcon,
                {
                  tintColor: item.isSaved
                    ? colors.exploreFilterSelected
                    : colors.text,
                },
              ]}
              source={require("../../assets/images/saved.png")}
            />
            <Text style={styles.postActionText}>
              {item.isSaved ? "Saved" : "Save"}
            </Text>
          </Pressable>
        </View> */}

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleLikePress}
            accessible={true}
            accessibilityLabel={"Like"}
            accessibilityHint={
              item.isLiked
                ? "double tap to unlike this post"
                : "double tap to like this post"
            }
            accessibilityState={
              item.isLiked ? { checked: true } : { checked: false }
            }
            accessibilityRole={"button"}
          >
            <Feather
              name="heart"
              size={size.iconSize + 4}
              color={item.isLiked ? "#E57373" : colors.text}
            />
            <Text
              style={[
                styles.actionText,
                { color: colors.text, fontSize: size.font.caption },
              ]}
            >
              {item.isLiked ? "Liked" : "Like"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => showComments(item)}
            style={styles.actionButton}
            accessible={true}
            accessibilityLabel={"Comment feed"}
            accessibilityHint={
              "Double tap to open comment section on this post"
            }
            accessibilityRole={"button"}
          >
            <Feather
              name="message-circle"
              size={size.iconSize + 4}
              color={colors.text}
            />
            <Text
              style={[
                styles.actionText,
                { color: colors.text, fontSize: size.font.caption },
              ]}
            >
              Comment
            </Text>
          </Pressable>

          <View style={{ flex: 1 }} />

          <Pressable
            style={styles.actionButton}
            onPress={() => handleSavePress}
            accessible={true}
            accessibilityLabel={"Save"}
            accessibilityHint={
              item.isSaved
                ? "double tap to unsave this post"
                : "double tap to save this post"
            }
            accessibilityState={
              item.isSaved ? { checked: true } : { checked: false }
            }
            accessibilityRole={"button"}
          >
            <Feather
              name="bookmark"
              size={size.iconSize + 4}
              color={item.isSaved ? colors.exploreFilterSelected : colors.text}
            />
            <Text
              style={[
                styles.actionText,
                { color: colors.text, fontSize: size.font.caption },
              ]}
            >
              {item.isSaved ? "Saved" : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>
    ),
    [
      colors.exploreFilterSelected,
      colors.text,
      handleLikePress,
      handleSavePress,
      imageHeight,
      router,
      showComments,
      styles,
    ]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "none",
        }}
      />

      <View style={styles.container}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Text
            style={styles.pageTitle}
            accessible={true}
            accessibilityRole={"header"}
          >
            Explore
          </Text>

          <Pressable
            onPress={() => router.push("/exploreSearch")}
            style={{ marginHorizontal: 20 }}
            accessible={true}
            accessibilityHint={
              "Allows to search for specific content from the Explore page"
            }
            accessibilityRole={"search"}
          >
            <View pointerEvents="none" style={styles.searchBar}>
              <Feather
                name="search"
                size={size.iconSize - 4}
                color={colors.inputContainerPlaceholderText}
              />
              <TextInput
                placeholder="Search username or tags"
                placeholderTextColor={colors.inputContainerPlaceholderText}
                editable={false}
                style={{ fontSize: size.font.bodyText }}
              />
            </View>
          </Pressable>

          <View style={styles.filterContainer}>
            {filters.map((filterOption) => (
              <Pressable
                key={filterOption}
                onPress={() => setSelectedFilter(filterOption)}
                accessible={true}
                accessibilityHint={
                  filterOption == "All"
                    ? "Shows all posts"
                    : "Shows posts sorted by " + filterOption + " craft type"
                }
                accessibilityRole={"tab"}
                accessibilityState={
                  selectedFilter === filterOption
                    ? { selected: true }
                    : { selected: false }
                }
                style={[
                  styles.filterTag,
                  selectedFilter === filterOption && styles.filterTagSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filterOption &&
                      styles.filterTextSelected,
                  ]}
                >
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
              if (loadingMore.current)
                return <ActivityIndicator size="small" color={colors.text} />;
              return (
                <View style={{ paddingVertical: 40 }}>
                  <Text
                    style={{
                      color: colors.settingsText,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    No Recent Posts
                  </Text>
                </View>
              );
            }}
            ListFooterComponent={() => {
              if (posts.length > 0) {
                if (!hasMore.current) {
                  return (
                    <View style={{ paddingBottom: 150 }}>
                      <Text style={{ color: colors.settingsText }}>
                        No More Data To Load
                      </Text>
                    </View>
                  );
                }
                return (
                  <View style={{ paddingBottom: 150 }}>
                    <ActivityIndicator size="small" color={colors.text} />
                  </View>
                );
              }
              return <View style={{ height: 160 }} />;
            }}
            ListFooterComponentStyle={{ alignItems: "center", marginTop: 15 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          />
        </GestureHandlerRootView>

        {areCommentsVisible ? (
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
        ) : null}
      </View>
    </>
  );
}
