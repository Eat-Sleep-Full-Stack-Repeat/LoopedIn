import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import API_URL from "@/utils/config";
import { Storage } from "@/utils/storage";
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  GestureHandlerRootView,
  RefreshControl,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ExploreCommentsProps = {
  isVisible: boolean;
  onClose: () => void;
  currentPost: number | null; // FIXME: update the following 3 values once explore page implementation is merged
  postCreator: number | null;
};

type Comment = {
  id: string;
  commenterid: string;
  profilepic: string | null;
  username: string;
  dateposted: string;
  body: string;
};

type userInfo = {
  username: string;
  profilepic: string | null;
};

// FIXME: right now the current post is hard coded to = 3 (update once explore posts are implemented)
const ExploreCommentsModal = ({
  isVisible,
  onClose,
  currentPost,
  postCreator,
}: ExploreCommentsProps) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const [displayCheckDelete, setDisplayCheckDelete] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const lastTimeStamp = useRef<string | null>(null);
  const lastPostID = useRef<number | null>(null);
  const [Comments, setComments] = useState<Comment[]>([]);
  const hasMore = useRef<true | false>(true);
  const loadingMore = useRef<true | false>(false);
  const currentUser = useRef<string | null>(null);
  const currentUserInfo = useRef<userInfo | null>(null);
  const commentIDToDelete = useRef<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  let avatarSize: number;

  if (Dimensions.get("window").width >= 768) {
    avatarSize = 120;
  } else {
    avatarSize = 100;
  }

  useEffect(() => {
    if (!isVisible){
      return;
    }

    if (currentPost !== null && postCreator !== null) {
      fetchComments();
    } 
  }, [isVisible]);

  useEffect(() => {
    if (currentUser.current === null && currentUserInfo.current === null) {
      fetchUserInfo();
    }
  }, []);

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    } else {
      lastPostID.current = null;
      lastTimeStamp.current = null;
      hasMore.current = true;
      setComments([]);
      setRefreshing(true);
    }
  };

  // need to use useEffect to ensure previous data is flushed before fetching new data
  useEffect(() => {
    if (refreshing) {
      try {
        fetchComments();
      } catch (e) {
        console.log("error when refreshing data", e);
      } finally {
        setRefreshing(false);
      }
    }
  }, [refreshing]);

  const fetchUserInfo = async () => {
    const token = await Storage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/get-user-info`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        alert("Error when fetching user information");
        return;
      }

      const responseData = await res.json();

      currentUserInfo.current = responseData.currentUserInfo[0];
      currentUser.current = responseData.currentUserID;
    } catch (e) {
      console.log("Error when getting the current user");
    }
  };

  const fetchComments = async () => {
    const token = await Storage.getItem("token");

    if (currentPost === null || postCreator === null){
      console.log("Post or creator is null - can't fetch info")
      return;
    }

    if (loadingMore.current || !hasMore.current) {
      return;
    }

    loadingMore.current = true;

    try {
      const includeLastTimeStamp = lastTimeStamp.current
        ? `&lastTimestamp=${lastTimeStamp.current}`
        : "";
      const includeLastPostID = lastPostID.current
        ? `&lastPostID=${lastPostID.current}`
        : "";

      const res = await fetch(
        `${API_URL}/api/get-post-comments?postID=${currentPost}${includeLastPostID}${includeLastTimeStamp}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        alert("Error when fetching post comments");
        return;
      }

      const responseData = await res.json();
      const tempArray: Comment[] = responseData.newComments;

      //check for stale data:
      if (!currentPost){
        onClose();
        return;
      }
      if (Number(responseData.postID) !== currentPost){
        console.log("Got old / unusable data -> closing modal");
        onClose();
        return;
      }

      if (tempArray.length < 1) {
        hasMore.current = responseData.hasMore;
        return;
      }

      setComments((prev) => [...prev, ...tempArray]);
      hasMore.current = responseData.hasMore;
      lastTimeStamp.current = tempArray[tempArray.length - 1].dateposted;
      lastPostID.current = Number(tempArray[tempArray.length - 1].id);
    } catch (e) {
      console.log("Error when fetching comments", e);
      alert("Could not fetch comments");
    } finally {
      loadingMore.current = false;
    }
  };

  const handleCloseComments = () => {
    setComments([]);
    lastPostID.current = null;
    lastTimeStamp.current = null;
    hasMore.current = true;
    commentIDToDelete.current = null;
    onClose();
  };

  const checkDeleteComment = (commentToDelete: string) => {
    commentIDToDelete.current = Number(commentToDelete);
    if (displayCheckDelete === false) {
      setDisplayCheckDelete(true);
    }
  };

  const handleDeleteComment = async () => {
    const token = await Storage.getItem("token");
    try {
      //FIXME: Delete comment from backend
      const response = await fetch(`${API_URL}/api/delete-post-comment`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ CommentID: commentIDToDelete.current }),
      });

      if (!response.ok) {
        alert("Error while deleting the forum comment. Try again later.");
        return;
      }

      const removeComment: Comment[] = Comments.filter(
        (comment) => Number(comment.id) !== commentIDToDelete.current
      );
      setComments(removeComment);
    } catch (e) {
      console.log("Error when deleting explore comment ", e);
    } finally {
      setDisplayCheckDelete(false);
      commentIDToDelete.current = null;
    }
  };

  const postComment = async (commentToPost: string) => {
    const token = await Storage.getItem("token");

    if (commentToPost.trim().length === 0) {
      alert("Cannot add that comment due to no text entered");
      return;
    }

    const tempDate = new Date();

    if (!currentUser.current || !currentUserInfo.current) {
      console.log("Could not find current user id to add comment");
      return;
    }

    Keyboard.dismiss();

    try {
      const commentData = {
        postID: currentPost,
        content: commentToPost,
      };

      const response = await fetch(`${API_URL}/api/add-post-comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        alert("Could not create that post comment :( ");
        return;
      }

      const responseData = await response.json();

      const tempAddComment: Comment = {
        id: responseData.message[0].fld_comment_pk,
        commenterid: currentUser.current,
        profilepic: currentUserInfo.current.profilepic,
        username: currentUserInfo.current.username,
        dateposted: String(tempDate),
        body: commentToPost,
      };

      setComments((prev) => [tempAddComment, ...prev]);
      setCommentValue("");

      console.log("Created the comment yayayayayaya!!!");
    } catch (e) {
      console.log("Error when trying to post the comment", e);
    }
  };

  const profilePress = (passedItem: Comment) => {
    handleCloseComments();
    //fixed -> added clickable post user image
    if (passedItem) {
      router.push({
        pathname: "/userProfile/[id]",
        params: { id: passedItem.commenterid },
      });
    } else {
      console.log("tried to pass an empty post :(");
    }
  };
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    commentsHeading: {
      color: colors.text,
      paddingTop: 0,
      fontSize: 24,
      fontWeight: "600",
      marginBottom: 20,
    },
    commentsContainer: {
      height: "85%",
      backgroundColor: colors.background,
      width: "85%",
      marginTop: insets.top,
      borderRadius: 20,
      alignItems: "center",
      flexDirection: "column",
    },
    replyContainer: {
      backgroundColor: colors.exploreCardBackground,
      marginBottom: 20,
      alignSelf: "center",
      padding: 15,
      borderRadius: 20,
      borderColor: colors.exploreBorder,
      borderWidth: 1,
      flexGrow: 1,
      marginLeft: 10,
      flexShrink: 1,
      // FIXME: Add max height
    },
    individualCommentContainer: {
      flexDirection: "column",
      alignSelf: "center",
      width: "90%",
      justifyContent: "space-between",
      padding: 5,
      marginVertical: 5,
    },
    profilePicture: {
      backgroundColor: "white",
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    userInfo: {
      flexDirection: "column",
      marginLeft: 5,
    },
    userInfoHeader: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    topComments: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    commentContent: {
      marginLeft: 20,
      marginTop: 5,
    },
  });

  const renderCommentHeader = (item: Comment) => (
    <View style={styles.individualCommentContainer}>
      <View style={styles.topComments}>
        <View style={styles.userInfoHeader}>
          <Pressable onPress={() => profilePress(item)}>
            {item.profilepic ? (
              <Image
                source={{ uri: item.profilepic }}
                style={{
                  width: avatarSize / 2,
                  height: avatarSize / 2,
                  borderRadius: avatarSize / 2,
                  backgroundColor: colors.boxBackground,
                }}
              />
            ) : (
              <View>
                <Image
                  source={require("@/assets/images/icons8-cat-profile-50.png")}
                  style={{
                    width: avatarSize / 2,
                    height: avatarSize / 2,
                    borderRadius: avatarSize / 2,
                  }}
                />
              </View>
            )}
          </Pressable>
          <View style={styles.userInfo}>
            <Pressable onPress={() => profilePress(item)}>
              <Text style={{ color: colors.text }}>{item.username}</Text>
            </Pressable>
            <Text style={{ color: colors.text, marginLeft: 5 }}>
              {new Date(item.dateposted).toDateString()}
            </Text>
          </View>
        </View>
        {currentUser.current === item.commenterid ? (
          <Pressable onPress={() => checkDeleteComment(item.id)}>
            <Ionicons name="trash-outline" size={24} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.commentContent}>
        <Text>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      transparent={true}
      animationType="none"
    >
      <GestureHandlerRootView>
        {/* <View style={styles.container}> */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.commentsContainer}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <Pressable onPress={handleCloseComments}>
                <AntDesign
                  name="close"
                  size={24}
                  color={colors.text}
                  style={{ marginRight: 25, marginTop: 15, fontSize: 22 }}
                />
              </Pressable>
            </View>
            <Text style={styles.commentsHeading}>Comments</Text>
            <View style={{ flex: 1, width: "100%" }}>
              <FlatList
                data={Comments}
                renderItem={({ item }) => renderCommentHeader(item)}
                keyExtractor={(item) => item.id}
                onEndReached={fetchComments}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => {
                  if (loadingMore.current) {
                    return (
                      <ActivityIndicator size="small" color={colors.text} />
                    );
                  } else {
                    return (
                      <View style={{ alignItems: "center" }}>
                        <Text
                          style={{
                            color: colors.settingsText,
                            fontWeight: "bold",
                          }}
                        >
                          There Are No Comments To Display{" "}
                        </Text>
                      </View>
                    );
                  }
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                }
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                // width: 290,
                alignItems: "flex-end",
              }}
            >
              <View style={styles.replyContainer}>
                <TextInput
                  placeholder="Reply here"
                  placeholderTextColor={colors.text}
                  style={{ color: colors.text }}
                  value={commentValue}
                  onChangeText={setCommentValue}
                  multiline={true}
                />
              </View>
              <Pressable
                onPress={() => postComment(commentValue)}
                style={{ marginBottom: 20, marginLeft: 5, marginRight: 5 }}
              >
                <MaterialCommunityIcons
                  name="send-circle-outline"
                  size={40}
                  color={colors.decorativeBackground}
                />
              </Pressable>
            </View>
          </View>

          <Modal
            visible={displayCheckDelete}
            onRequestClose={() => setDisplayCheckDelete(false)}
            transparent={true}
            animationType="none"
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.background,
                  padding: 20,
                  borderRadius: 20,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    paddingBottom: 15,
                  }}
                >
                  {" "}
                  Are you sure you want to delete?{" "}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 25,
                    alignItems: "center",
                  }}
                >
                  <Pressable
                    onPress={handleDeleteComment}
                    style={{
                      backgroundColor: colors.exploreCardBackground,
                      padding: 10,
                      borderRadius: 20,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.decorativeBackground,
                    }}
                  >
                    <Text
                      style={{ color: colors.text, fontSize: 16, padding: 5 }}
                    >
                      {" "}
                      Yes{" "}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setDisplayCheckDelete(false);
                      commentIDToDelete.current = null;
                    }}
                    style={{
                      backgroundColor: colors.exploreCardBackground,
                      padding: 10,
                      borderRadius: 20,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.decorativeBackground,
                    }}
                  >
                    <Text
                      style={{ color: colors.text, fontSize: 16, padding: 5 }}
                    >
                      {" "}
                      Cancel{" "}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
        {/* </View> */}
      </GestureHandlerRootView>
    </Modal>
  );
};

export default ExploreCommentsModal;
