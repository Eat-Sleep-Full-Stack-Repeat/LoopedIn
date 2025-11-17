import React, {
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useNavigation, useLocalSearchParams } from "expo-router";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import API_URL from "@/utils/config";
import { Storage } from "../../utils/storage";
import { TextInput } from "react-native-gesture-handler";
import ForumReplyModal from "@/components/forumReply";

type Comment = {
  id: string;
  username: string;
  date: string;
  text: string;
  profileuri: string | null;
  depth: number | null;
  children?: Comment[];
};

type Post = {
  id: string;
  title: string;
  username: string;
  dateposted: string;
  content: string;
  profileuri: string | null;
  //hasImagePlaceholder?: boolean;
  imageuri?: string | null;
};

type ForumPost = {
  id: string;
  title: string;
  profilePic: string | null;
  username: string;
  content: string;
  datePosted: string;
};

// hide the reply action on comments at or beyond this depth
const MAX_REPLY_DEPTH = 4;

// depth at which we start hiding replies behind "See more"
const HIDE_AFTER_DEPTH = 2;

// cap image width to a fraction of the screen width
const IMAGE_MAX_FRACTION = 0.7; // 90% of screen width

// fallback aspect ratio for placeholder / unknown image size
const FALLBACK_ASPECT_RATIO = 0.65;

export default function ForumPostDetail() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { width: SCREEN_W } = useWindowDimensions();
  const {id} = useLocalSearchParams();
  console.log("RAW PARAMS: ", id)
  const postID = id as string;
  const [passedComments, setPassedComments] = useState<Comment[]>([]);
  const comments: Comment[] = useMemo(() => passedComments, [passedComments]);
  const [post, setPostInfo] = useState<Post | null>(null);

  //infinite scroll variables
  const loadingMore = useRef<true | false>(false);
  const hasMore = useRef(true);
  const [refreshing, setRefreshing] = useState(false);
  const lastTimeStamp = useRef<string | null>(null);
  const lastCommentID = useRef<number | null>(null);

  //reply variables
  const [isReplyVisible, setIsReplyVisible] = useState(false);
  const [replyInformation, setReplyInformation] = useState<Post | Comment | null>(null);


  useLayoutEffect(() => {
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  

  useEffect(() => {
    console.log("The postID is: ", postID)
    fetchPostInfo();
  }, [postID])

  useEffect(() => {
    if (post) {
      console.log("The postID in the if statement is:", postID)
      fetchComments()
    }
  }, [post])

  const handleRefresh = async() => {
    if (refreshing) {
      return 
    } else {
      lastCommentID.current = null;
      lastTimeStamp.current = null;
      hasMore.current = true;
      setPassedComments([]);
      setPostInfo(null);
      setRefreshing(true);
    }
  }

  useEffect(() => {
    if (refreshing) {
      try {
        fetchPostInfo();
        fetchComments();
      } catch (e) {
        console.log("error when refreshing data", e);
      } finally {
        setRefreshing(false);
    }
    }
  }, [refreshing])

  const fetchPostInfo = async () => {
    const token = await Storage.getItem("token");
    try {
      const res = await fetch(
        `${API_URL}/api/forum/get-single-post?id=${postID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (res.status == 404) {
        alert("Could not find that post");
        router.back();
      }

      const responseData = await res.json();
      setPostInfo(responseData.postInfo);

    } catch (e) {
      console.log("Error when fetching post data", e)
    }
  }


  const fetchComments = async () => {
    console.log("Inside the fetch comments thing");
    console.log("The post id being passed back to the fetch comments is", postID)
    const token = await Storage.getItem("token");
    if (loadingMore.current || !hasMore.current){
      return;
    }
    loadingMore.current = true;
    try {

      const includeBefore = lastTimeStamp.current
        ? `&before=${lastTimeStamp.current}`
        : "";

      const includeCommentID = lastCommentID.current
        ? `&commentID=${lastCommentID.current}`
        : "";

      const res = await fetch(
        `${API_URL}/api/forum/get-post-comments?id=${postID}${includeBefore}${includeCommentID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      const responseData = await res.json();
      console.log("The returned response data is: ", responseData.commentTree)
      setPassedComments(prevItems => [ ...prevItems, ...responseData.commentTree]);
      hasMore.current = (responseData.hasMore);
      console.log("HasMore is: ", hasMore.current);
      lastTimeStamp.current = responseData.commentTree[responseData.commentTree.length - 1].date
      console.log("The last time stamp is: ", lastTimeStamp.current)
      lastCommentID.current = responseData.commentTree[responseData.commentTree.length - 1].id
      console.log("The last comment ID is: ", lastCommentID.current);
      
    } catch (e) {
      console.log("Error when getting the comments", e);
    } finally {
      loadingMore.current = false;
    }
  }

  // will display the modal where the user can enter a reply
  const handleReplyPress = (replyCommentID: string, replyInfo: Post | Comment) => {
    console.log("The reply button was pressed on comment #", replyCommentID);
    setIsReplyVisible(true);
    setReplyInformation(replyInfo);
  }

  //will actually post the reply in the databases
  const handlePostReply = async (replyText: string) => {
    console.log("Now I will need to figure out how to post the reply to the backend! Also don't forget to then refresh the page so the user can see their comment")
    console.log("This is what the user entered: ", replyText);

    const isPost = (item: Comment | Post): item is Post => {
      return "content" in item;
    }

    if (!replyInformation){
      console.log("Could not find that post");
      return;
    }

    let parentID;
    let depth;
    if (isPost(replyInformation)){
      parentID = null;
      depth = 0;
    } else {
      parentID = replyInformation.id;
      depth = replyInformation.depth;
    }

    const newComment = {
      postID: post?.id,
      parentID,
      depth,
      body: replyText,
      timestamp: new Date(),
    }

    console.log("This is what is being passed to the backend btw: ", newComment)

    const token = await Storage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/forum/forum-comment-post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newComment)
    });

      if (!response.ok) {
        alert("Could not create that comment :( ");
        return;
      } else {
        handleRefresh();
      }

      console.log("Created the comment yayayayayaya!!!")

    } catch (e) {
      console.log("Error when adding forum comment", e);
      alert("Could not create comments for this forum post. Please try again later");
    }

  }

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },

    backFab: {
      position: "absolute",
      top: insets.top + 8,
      left: 10,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.boxBackground,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },

    postCard: {
      backgroundColor: colors.topBackground,
      marginHorizontal: 8,
      marginTop: insets.top + 60,
      borderRadius: 16,
      padding: 16,
    },
    postHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    avatarCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.boxBackground,
      marginRight: 12,
    },
    postTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
    postUserRow: { flexDirection: "row", alignItems: "center" },
    postUser: { color: colors.text, marginRight: 8, fontWeight: "600" },
    postDate: { color: colors.text, fontSize: 12 },
    postBody: { color: colors.text, marginTop: 8, lineHeight: 20 },

    imagePlaceholder: {
      borderRadius: 12,
      backgroundColor: colors.boxBackground,
      marginTop: 14,
      alignSelf: "center",
    },

    actionRow: { flexDirection: "row", gap: 14, marginTop: 14, alignItems: "center" },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.boxBackground,
      borderRadius: 10,
    },
    actionText: { color: colors.text, fontWeight: "600" },

    sectionHeader: { marginHorizontal: 10, marginTop: 20, marginBottom: 8 },
    sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 18 },

    commentWrap: {
      marginTop: 10,
      position: "relative",
    },

    commentBubble: {
      backgroundColor: colors.topBackground,
      borderRadius: 12,
      padding: 10,
      alignSelf: "stretch",
      marginRight: 8,
    },

    commentHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    commentAvatarInline: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.boxBackground,
    },
    commentHeaderText: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
      minWidth: 0,
    },
    commentUser: { color: colors.text, fontWeight: "700" },
    commentDate: { color: colors.text, fontSize: 12 },
    commentText: { color: colors.text, marginTop: 6, lineHeight: 18 },

    commentActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
      alignItems: "center",
    },
    smallAction: { flexDirection: "row", alignItems: "center", gap: 4 },
    smallIconText: { color: colors.text, fontWeight: "600", fontSize: 12 },

    seeMoreChip: {
      alignSelf: "flex-start",
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.boxBackground,
      borderRadius: 8,
      marginTop: 6,
    },

    divider: { height: 10 },
  });

  const PostCard = () => {
    const marginX = 8 + 16; 
    const naturalWidth = SCREEN_W - marginX * 2;
    const maxWidth = SCREEN_W * IMAGE_MAX_FRACTION;
    const imageWidth = Math.min(naturalWidth, maxWidth);

    // State to hold the original image size 
    const [intrinsicSize, setIntrinsicSize] = useState<{
      width: number;
      height: number;
    } | null>(null);

    // useEffect(() => {
    //   if (post.imageuri) {
    //     Image.getSize(
    //       post.imageuri,
    //       (w, h) => {
    //         setIntrinsicSize({ width: w, height: h });
    //       },
    //       () => {
    //         // if we fail to get size, just fall back
    //         setIntrinsicSize(null);
    //       }
    //     );
    //   } else {
    //     setIntrinsicSize(null);
    //   }
    // }, [post.imageuri]);

    let imageHeight: number;
    if (intrinsicSize && intrinsicSize.width > 0) {
      // keep the aspect ratio (so vertical images are tall, not squashed)
      const ratio = intrinsicSize.height / intrinsicSize.width;
      imageHeight = imageWidth * ratio;
    } else {
      // if fails to load, use fallback ratio
      imageHeight = imageWidth * FALLBACK_ASPECT_RATIO;
    }

    // adding this to get rid of typeErrors and in case the post information can not be fetched
    if (!post){
      return;
    }

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeaderRow}>
          {post.profileuri ? (
                <Image source={{ uri: post.profileuri}} style={styles.avatarCircle}/>
              ):(
              <View>
                <Image
                source={require("@/assets/images/icons8-cat-profile-50.png")}
                style={styles.avatarCircle}
              />
              </View>
              )}
          <View style={{ flex: 1 }}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <View style={styles.postUserRow}>
              <Text style={styles.postUser}>{post.username}</Text>
              {post.dateposted ? (
                <Text style={styles.postDate}>{new Date(post.dateposted).toDateString()}</Text>
              ) : (
                <Text style={styles.postDate}> Unknown Date</Text>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.postBody}>{post.content}</Text>

        {post.imageuri ? (
          <Image
            source={{ uri: post.imageuri }}
            style={[
              styles.imagePlaceholder,
              { width: imageWidth, height: imageHeight },
            ]}
            resizeMode="cover"
          />
        ) 
        // : post.hasImagePlaceholder ? (
        //   <View
        //     style={[
        //       styles.imagePlaceholder,
        //       { width: imageWidth, height: imageHeight },
        //     ]}
        //   />
        // ) 
        : null}

        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn}>
            <Feather name="bookmark" size={18} color={colors.text} />
            <Text style={styles.actionText}>Save</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => handleReplyPress(post.id, post)}>
            <Feather name="message-circle" size={18} color={colors.text} />
            <Text style={styles.actionText}>Reply</Text>
          </Pressable>
        </View>
      </View>


    );
  };

  const bubbleLeftForDepth = (depth: number) => 10 + depth * 12;

  const renderCommentBranch = (
    node: Comment,
    depth: number,
    ancestorExpanded: boolean = false
  ): React.ReactNode => {
    const children = node.children || [];

    const isGateDepth = depth >= HIDE_AFTER_DEPTH;
    const thisNodeExpanded = !!expanded[node.id];

    // Determine visibility of this node's children
    const showChildren =
      !isGateDepth /* above gate => always show */ ||
      ancestorExpanded /* ancestor gate already opened => show */ ||
      thisNodeExpanded; /* user opened gate here => show */

    // Show a single "See more replies" at the first gated node in a branch
    const shouldShowSeeMore =
      isGateDepth &&
      children.length > 0 &&
      !ancestorExpanded &&
      !thisNodeExpanded;

    return (
      <View key={node.id} style={styles.commentWrap}>
        <View style={[styles.commentBubble, { marginLeft: bubbleLeftForDepth(depth) }]}>
          <View style={styles.commentHeaderRow}>
            {node.profileuri ? (
                <Image source={{ uri: node.profileuri}} style={styles.commentAvatarInline}/>
              ):(
              <View>
                <Image
                source={require("@/assets/images/icons8-cat-profile-50.png")}
                style={styles.commentAvatarInline}
              />
              </View>
              )}
            <View style={styles.commentHeaderText}>
              <Text style={styles.commentUser} numberOfLines={1}>
                {node.username}
              </Text>
              <Text style={styles.commentDate}>{new Date(node.date).toDateString()}</Text>
            </View>
          </View>

          <Text style={styles.commentText}>{node.text}</Text>

          <View style={styles.commentActions}>
            {depth < MAX_REPLY_DEPTH && (
              <Pressable style={styles.smallAction} onPress={() => handleReplyPress(node.id, node)}>
                <Feather name="message-circle" size={14} color={colors.text} />
                <Text style={styles.smallIconText}>Reply</Text>
              </Pressable>
            )}
          </View>
        </View>

        {showChildren &&
          children.map((child) =>
            renderCommentBranch(
              child,
              depth + 1,
              // Once expanded at this node (or an ancestor), descendants should not show their own gates
              ancestorExpanded || (isGateDepth && thisNodeExpanded)
            )
          )}

        {shouldShowSeeMore && (
          <Pressable
            onPress={() => toggleExpanded(node.id)}
            style={[styles.seeMoreChip, { marginLeft: bubbleLeftForDepth(depth) }]}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              See more replies
            </Text>
          </Pressable>
        )}

        {isGateDepth && thisNodeExpanded && !ancestorExpanded && (
          <Pressable
            onPress={() => toggleExpanded(node.id)}
            style={[styles.seeMoreChip, { marginLeft: bubbleLeftForDepth(depth) }]}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              Hide replies
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Pressable style={styles.backFab} onPress={() => router.back()}>
        <Feather name="chevron-left" size={22} color={colors.text} />
      </Pressable>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            <PostCard />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Replies</Text>
            </View>
          </>
        }
        renderItem={({ item }) => <>{renderCommentBranch(item, 0)}</>}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        onEndReached={fetchComments}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={() => {
          if (loadingMore.current) {
            return <ActivityIndicator size="small" color={colors.text}/>
          } else {
            return (
              <View style={{paddingVertical: 40, marginLeft: 50}}>
                <Text style={{color: colors.settingsText, fontWeight: "bold"}}> No Recent Posts </Text>
              </View>
            )
          }
        }}
        ListFooterComponent={() => {
          if (comments.length > 0) {
            if (!hasMore.current) {
              return;
            } else {
              return (
                <ActivityIndicator size="small" color={colors.text} />
              );
            }
          }
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}/>
        }
      />
      <ForumReplyModal isVisible={isReplyVisible} onClose={() => setIsReplyVisible(false)} onPostReply={handlePostReply} replyPost={replyInformation}/>
    </View>
  );
}
