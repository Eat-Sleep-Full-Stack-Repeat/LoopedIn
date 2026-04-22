import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import { Feather, Entypo } from "@expo/vector-icons";
import API_URL from "@/utils/config";
import { Storage } from "../utils/storage";
import {
  GestureHandlerRootView,
  RefreshControl,
} from "react-native-gesture-handler";
import { useAppSize } from "@/Hooks/useSize";
import BottomFab from "@/components/bottomFab";

type Tag = {
  tagID: string;
  tagColor: string;
  tagName: string;
};

type ForumPost = {
  id: string;
  username: string;
  userID: string;
  profilePic: string | null;
  header: string;
  body: string;
  datePosted: string;
  tag_data: Tag[];
};

type BackendTags = {
  tagID: string;
  tagName: string;
  tagColor: string;
};

type BackendPost = {
  fld_post_pk: string;
  fld_header: string;
  fld_body: string;
  fld_profile_pic: string | null;
  fld_username: string;
  fld_timestamp: string;
  fld_user_pk: string;
  tag_data: BackendTags[] | [];
};

export default function MyPosts() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  //limit -> change if we want
  const limit = 10;
  const lastTimeStamp = useRef<string | null>(null);
  const lastPostID = useRef<number | null>(null);
  const hasMore = useRef(true);

  //for loading up forum posts
  const [forumData, setForumData] = useState<ForumPost[]>([]);
  const loadingMore = useRef<true | false>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [noPosts, setNoPosts] = useState(false);

  const posts: ForumPost[] = useMemo(() => forumData, [forumData]);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const size = useAppSize();

  const handleCreatePost = () => {
    router.push("/newforumpost");
  };

  const openMenu = (postId: number) => {
    setSelectedPostId(postId);
    setMenuVisible(true);
  };

  const handleEdit = () => {
    if (selectedPostId === null) return;
    setMenuVisible(false);
    router.push({
      pathname: "/editforum/[id]",
      params: { id: selectedPostId },
    });
  };

  const handleDelete = async () => {
    if (selectedPostId !== null) {
      setMenuVisible(false);
      console.log(`Deleting post ID: ${selectedPostId}`);
      // future delete logic here

      //check token
      const token = await Storage.getItem("token");

      //login check to reduce unnecessary fetches
      if (!token) {
        alert("Hold on there... you need to login first!");
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/forum/forum_post/${selectedPostId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (response.status === 403) {
          alert("Forbidden: You do not have permission to edit this post.");
          return;
        } else if (response.status === 404) {
          alert("Cannot delete: forum post does not exist");
        } else if (!response.ok) {
          alert("Server error occured. Please try again later.");
          router.back();
          return;
        }

        setShowDeleteSuccess(true);
      } catch (error) {
        alert("Server error. Please try again later.");
        console.log("Error editing post:", error);
      }
    }
  };

  const fetchData = async () => {
    const token = await Storage.getItem("token");

    //login check to reduce unnecessary fetches
    if (!token) {
      alert("Hold on there... you need to login first!");
      router.replace("/login");
      return;
    }

    if (loadingMore.current || !hasMore.current) {
      //if already loading more data or there is no more data in database then return
      return;
    }

    loadingMore.current = true;

    try {
      //load timestamp if exists
      const includeBefore = lastTimeStamp.current
        ? `&before=${lastTimeStamp.current}`
        : "";

      const includePostID = lastPostID.current
        ? `&postID=${lastPostID.current}`
        : "";

      const response = await fetch(
        `${API_URL}/api/forum/my-forum-posts?limit=${limit}${includeBefore}${includePostID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      //if user hasn't posted yet
      if (response.status == 404) {
        setNoPosts(true);
        return;
      }

      //expired token not taken away from storage or overall not allowed to access resource
      else if (response.status == 403) {
        alert("Hold on there... you need to login first!");
        router.replace("/login");
        return;
      } else if (!response.ok) {
        alert("Server error occured. Please try again later.");
        router.replace("/");
        return;
      }

      const responseData = await response.json();

      let tempPostData: ForumPost[] = responseData.newFeed.map(
        (post: BackendPost) => ({
          id: post.fld_post_pk,
          header: post.fld_header,
          body: post.fld_body,
          profilePic: post.fld_profile_pic,
          username: post.fld_username,
          datePosted: post.fld_timestamp,
          userID: post.fld_user_pk,
          tag_data: post.tag_data.map((tag: BackendTags) => ({
            tagID: tag.tagID,
            tagName: tag.tagName,
            tagColor: tag.tagColor,
          })),
        })
      );

      setForumData((prev) => [...prev, ...tempPostData]);
      hasMore.current = responseData.hasMore;
      lastTimeStamp.current = tempPostData[tempPostData.length - 1].datePosted;
      lastPostID.current = Number(tempPostData[tempPostData.length - 1].id);
    } catch (error) {
      console.log("Error fetching posts: ", error);
    } finally {
      // even if fetching data fails, we will update loading more
      loadingMore.current = false;
    }
  };

  const renderPost = useCallback(
    ({ item }: { item: ForumPost }) => (
      <View
        key={item.id}
        style={[
          styles.postContainer,
          {
            backgroundColor: colors.topBackground,
            borderColor: colors.topBackground,
          },
        ]}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/userProfile/[id]",
                params: { id: item.userID },
              })
            }
          >
            <View style={styles.profileRow}>
              <Image
                source={
                  item.profilePic
                    ? { uri: item.profilePic }
                    : require("@/assets/images/icons8-cat-profile-50.png")
                }
                style={styles.profilePic}
              />
              <View>
                <Text style={[styles.username, { color: colors.text }]}>
                  {item.username}
                </Text>
                <Text style={[styles.date, { color: colors.text }]}>
                  {new Date(item.datePosted).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </Pressable>

          <TouchableOpacity
            onPress={() => openMenu(parseInt(item.id))}
            accessible={true}
            accessibilityLabel={"Forum Post Menu"}
            accessibilityHint={"Double tap to edit or delete this forum post"}
            accessibilityRole={"button"}
            style={{
              backgroundColor: colors.secondaryButton,
              padding: 10,
              borderRadius: 50,
              borderWidth: 1,
              borderColor: colors.decorativeBackground,
            }}
          >
            <Entypo
              name="dots-three-vertical"
              size={size.iconSize + 2}
              color={colors.decorativeBackground}
            />
          </TouchableOpacity>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/singleForum/[id]",
              params: { id: item.id },
            })
          }
          accessibilityLabel={"Forum title: " + item.header}
          accessibilityHint={"Double tap to read more about this forum post."}
          accessibilityRole={"button"}
        >
          <Text style={[styles.postTitle, { color: colors.text }]}>
            {item.header}
          </Text>
          <Text
            style={[styles.content, { color: colors.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.body}
          </Text>
        </Pressable>

        {!!item.tag_data.length && (
          <View style={styles.tagRow}>
            {item.tag_data.map((tag) => (
              <View
                key={`${item.id}-${tag.tagID}`}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: colors.topBackground,
                    borderColor: tag.tagColor,
                  },
                ]}
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
      </View>
    ),
    [colors.text, router]
  );

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    } else {
      setRefreshing(true);
      setForumData([]);
      lastPostID.current = null;
      lastTimeStamp.current = null;
      hasMore.current = true;
    }
  };

  // need to use useEffect to ensure previous data is flushed before fetching new data
  useEffect(() => {
    if (refreshing) {
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
    }
  }, [refreshing]);

  const handleDeleteSuccessNo = () => {
    setShowDeleteSuccess(false);
    router.replace("/myposts");
  };

  const handleDeleteSuccessYes = () => {
    setShowDeleteSuccess(false);
    router.push("/newforumpost");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
    },
    scrollContent: {
      paddingHorizontal: 20,
      flex: 1,
    },
    pageTitle: {
      fontSize: size.font.largeTitleText,
      fontWeight: size.weight.title,
    },
    backButton: {
      position: "absolute",
      left: 0,
    },
    backArrow: {
      fontSize: size.font.largeTitleText,
      color: colors.text,
    },
    postContainer: {
      borderRadius: 14,
      padding: 18,
      marginBottom: 25,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    header: {
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      position: "relative",
      marginTop: 10,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    profilePic: {
      width: size.iconSize + 24,
      height: size.iconSize + 24,
      borderRadius: 50,
      marginRight: 10,
    },
    username: {
      fontSize: size.font.headline,
      fontWeight: size.weight.headline,
    },
    content: {
      fontSize: size.font.bodyText,
      lineHeight: 20,
    },
    date: {
      fontSize: size.font.detailText,
      opacity: 0.7,
    },
    postTitle: {
      fontSize: size.font.headline,
      fontWeight: size.weight.title,
      marginBottom: 8,
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 10,
    },
    tagChip: {
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
    },
    tagText: {
      fontSize: size.font.detailText,
      fontWeight: size.weight.title,
    },
    floatingButton: {
      position: "absolute",
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 5,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    menuContainer: {
      width: 180,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    menuOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
    },
    menuText: {
      fontSize: size.font.button,
    },
    cancelBtn: {
      marginTop: 10,
      padding: 8,
      borderColor: colors.cancel,
      borderWidth: 1,
      borderRadius: 12,
      width: "100%",
      alignItems: "center",
    },
    successBackdrop: {
      alignItems: "center",
      bottom: 0,
      justifyContent: "center",
      left: 0,
      padding: 24,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 999,
    },
    successCard: {
      borderRadius: 24,
      borderWidth: 1,
      maxWidth: 420,
      paddingHorizontal: 24,
      paddingVertical: 28,
      width: "100%",
    },
    successTitle: {
      fontSize: size.font.titleText,
      fontWeight: size.weight.largeTitle,
      marginBottom: 12,
      textAlign: "center",
    },
    successDescription: {
      fontSize: size.font.button,
      lineHeight: 24,
      marginBottom: 20,
      textAlign: "center",
    },
    successButtonRow: {
      flexDirection: "row",
      gap: 12,
    },
    successButton: {
      alignItems: "center",
      borderRadius: 999,
      flex: 1,
      paddingHorizontal: 18,
      paddingVertical: 14,
    },
    successButtonText: {
      fontSize: size.font.button,
      fontWeight: size.weight.largeTitle,
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false, animation: "none" }} />

      <GestureHandlerRootView style={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable
            onPress={router.back}
            hitSlop={10}
            accessible={true}
            accessibilityLabel={"Go Back"}
            accessibilityHint={"Navigates back to the previous page."}
            accessibilityRole={"button"}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text
            style={[styles.pageTitle, { color: colors.text }]}
            accessible={true}
            accessibilityRole={"header"}
          >
            My Posts
          </Text>
          <View style={{ height: 10 }} />
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          onEndReached={fetchData}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={() => {
            if (loadingMore.current) {
              return <ActivityIndicator size="small" color={colors.text} />;
            } else if (noPosts) {
              return (
                <View style={{ paddingVertical: 10 }}>
                  <Text
                    style={{
                      color: colors.settingsText,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {" "}
                    No posts to see here... create a forum post now!{" "}
                  </Text>
                </View>
              );
            } else {
              return (
                <View style={{ paddingVertical: 10 }}>
                  <Text
                    style={{
                      color: colors.settingsText,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {" "}
                    Loading...{" "}
                  </Text>
                </View>
              );
            }
          }}
          ListFooterComponent={() => {
            if (posts.length > 0) {
              if (!hasMore.current) {
                return (
                  <View style={{ paddingBottom: 150 }}>
                    <Text style={{ color: colors.settingsText }}>
                      {" "}
                      No More Posts{" "}
                    </Text>
                  </View>
                );
              } else {
                return (
                  <View style={{ paddingBottom: 150 }}>
                    <ActivityIndicator size="small" color={colors.text} />
                  </View>
                );
              }
            }
          }}
          ListFooterComponentStyle={{ alignItems: "center", marginTop: 15 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      </GestureHandlerRootView>

      {/* Edit/Delete popup */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
          accessible={false}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: colors.exploreCardBackground },
            ]}
          >
            <TouchableOpacity
              onPress={handleEdit}
              style={styles.menuOption}
              accessible={true}
              accessibilityLabel={"Edit"}
              accessibilityHint={
                "Navigates to the edit forum post screen. Double tap to edit this forum post."
              }
            >
              <Feather
                name="edit"
                size={size.iconSize - 2}
                color={colors.text}
              />
              <Text style={[styles.menuText, { color: colors.text }]}>
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={styles.menuOption}
              accessible={true}
              accessibilityLabel={"Delete"}
              accessibilityHint={"Double tap to delete this forum post."}
            >
              <Feather
                name="trash-2"
                size={size.iconSize - 2}
                color={colors.warning}
              />
              <Text style={[styles.menuText, { color: colors.warning }]}>
                Delete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMenuVisible(false)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              accessibilityHint="Double tap to exit forum post menu"
              style={styles.cancelBtn}
            >
              <Text style={[styles.menuText, { color: colors.cancel }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating + button */}
      <Pressable
        style={{ bottom: 20 }}
        onPress={handleCreatePost}
        accessible={true}
        accessibilityLabel={"Create Forum Post"}
        accessibilityHint={
          "Navigates to the create forum post screen. Click to create a forum post."
        }
        accessibilityRole={"button"}
      >
        <BottomFab />
      </Pressable>

      {showDeleteSuccess ? (
        <View
          style={[
            styles.successBackdrop,
            {
              backgroundColor: `${colors.background}E6`,
            },
          ]}
        >
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: colors.boxBackground,
                borderColor: colors.blockedBackground,
              },
            ]}
          >
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Successfully Deleted!
            </Text>
            <Text
              style={[
                styles.successDescription,
                { color: colors.settingsText },
              ]}
            >
              Ready to start a new forum?
            </Text>
            <View style={styles.successButtonRow}>
              <Pressable
                onPress={handleDeleteSuccessYes}
                style={[
                  styles.successButton,
                  { backgroundColor: colors.activeContainer },
                ]}
              >
                <Text
                  style={[
                    styles.successButtonText,
                    { color: colors.background },
                  ]}
                >
                  Yes
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteSuccessNo}
                style={[
                  styles.successButton,
                  { backgroundColor: colors.disabledButton },
                ]}
              >
                <Text
                  style={[
                    styles.successButtonText,
                    { color: colors.disabledButtonText },
                  ]}
                >
                  No
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
