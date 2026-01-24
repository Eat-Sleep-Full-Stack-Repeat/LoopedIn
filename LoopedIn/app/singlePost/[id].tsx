// app/singlepost.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Modal,
  TouchableOpacity,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import BottomNavButton from "@/components/bottomNavBar";
import { Feather, Entypo } from "@expo/vector-icons";
import API_URL from "@/utils/config";
import { Storage } from "../../utils/storage";
import ExploreCommentsModal from "@/components/exploreComments";
import { useFocusEffect, useRoute } from '@react-navigation/native'; 

type PhotoCard = {
  pic: string;
  altText: string;
  id: string;
}

type SinglePost = {
  id: string;
  creatorID: number;
  username: string;
  //title?: string;
  content: string;
  imageUrls: PhotoCard[];
  profilePic: string;
  datePosted: string;
  tags?: string[] | string;
};

export default function SinglePost() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const likingRef = useRef(false);
  const savingRef = useRef(false);
  const [tags, setTags] = useState<string[]>([]);
  const { id, editVersion, updatedCaption } = useLocalSearchParams();
  const postID = id as string;
  const [currentUser, setCurrentUser] = useState<number | null>(null);
  const [post, setPostInfo] = useState<SinglePost | null>(null);
  const route = useRoute();

  //for image scrolling/viewing
  const [modalImageUri, setModalImageUri] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  //for triple-dot handling
  const [menuVisible, setMenuVisible] = useState(false);

  //comments
  const [areCommentsVisible, setAreCommentsVisible] = useState(false);
  const currentPost = useRef<number | null>(null);
  const creatorID = useRef<number | null>(null);

  //actually call the refresh
  useEffect(() => {
    const getPost = async() => {
      await fetchPostInfo();
    }
    getPost();
  }, []);

  //reload upon return from editing
  // useEffect(() => {
  //   if (!updatedCaption) return;

  //   setPostInfo(prev =>
  //     prev ? { ...prev, content: updatedCaption } : prev
  //   );
  // }, [updatedCaption, editVersion]);


useEffect(() => {
  if (updatedCaption && post) { setPostInfo({ ...post, content: updatedCaption });}
  fetchPostInfo();
}, [route.key, editVersion, updatedCaption]);


  //call refresh upon return from editing
  useFocusEffect(
  React.useCallback(() => {
    fetchPostInfo();
  }, [])
);

  //handle behavior on web and mobile appropriately
  const onImagePress = (uri: string) => {
    if (Platform.OS === "web") {
      window.open(uri, "_blank");
    } else {
      setModalImageUri(uri);
    }
  };

  const fetchPostInfo = async () => {
    const token = await Storage.getItem("token");
    console.log("token okay");

    try {
      const res = await fetch(
        `${API_URL}/api/single-post?id=${postID}`,
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
        router.replace({
          pathname: "/userProfile/[id]",
          params: { postID, tab: from },
        });
      }

      const responseData = await res.json();

      const mappedPost: SinglePost = {
        id: postID,
        creatorID: responseData.postInfo.fld_user_pk,
        username: responseData.postInfo.fld_username,
        profilePic: responseData.postInfo.fld_profile_pic,
        content: responseData.postInfo.fld_caption,
        datePosted: formatDate(responseData.postInfo.fld_timestamp),
        imageUrls: Array.isArray(responseData.postPics)
          ? responseData.postPics
              .map((pic: any) => {
                if (Array.isArray(pic)) {
                  const [url, alt, id] = pic;
                  if (!url) return null;
                  return { pic: url, altText: alt ?? "", id: id ?? ""};
                }

                //backup
                if (pic?.pic) {
                  return { pic: pic.pic, altText: pic.altText ?? "", id: pic.id ?? ""};
                }

                return null;
              })
              .filter(Boolean)
          : [],
      };

      //console.log(mappedPost)

      setPostInfo(mappedPost);
      setCurrentUser(responseData.currentUser);
      setTags(responseData.tags);
      setLiked(!!responseData.postInfo?.fld_is_liked);
      setSaved(!!responseData.postInfo?.fld_is_saved);
    } catch (e) {
      console.log("Error when fetching post data", e);
    }
  }

  //clean up weird timestamp format (consistent w forums)
  const formatDate = (isoString: string) => {
    return new Date(isoString).toDateString();
  };

  const showComments = (item: SinglePost) => {
    currentPost.current = Number(item.id);
    creatorID.current = Number(item.creatorID);
    setAreCommentsVisible(true);
  }

  const handleLikePress = async () => {
    if (likingRef.current) return;
    likingRef.current = true;
    const original = liked;
    setLiked(!original);
    const token = await Storage.getItem("token");

    try {
      const res = await fetch(
        `${API_URL}/api/toggle_like?id=${postID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        setLiked(original);
        alert("Failed to update like. Please try again.");
        return;
      }

      const data = await res.json();
      if (typeof data?.liked === "boolean") {
        setLiked(data.liked);
      }
    } catch (e) {
      console.log("Error updating like", e);
      setLiked(original);
    } finally {
      likingRef.current = false;
    }
  };

  const handleSavePress = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    const original = saved;
    setSaved(!original);

    try {
      const token = await Storage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/toggle_save?id=${postID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        setSaved(original);
        alert("Failed to update save. Please try again.");
        return;
      }

      const data = await res.json();
      if (typeof data?.saved === "boolean") {
        setSaved(data.saved);
      }
    } catch (e) {
      console.log("Error updating save", e);
      setSaved(original);
    } finally {
      savingRef.current = false;
    }
  };

  // adding this to get rid of typeErrors and in case the post information can not be fetched
  if (!post) {
    return(
    <SafeAreaView
      style={[
        styles.container,
        {
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.exploreBackground, // match Explore
        },
      ]}
    >
      {/* back arrow for testing */}
      {/* <View>
        <Pressable onPress={router.back} hitSlop={10}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
      </View> */}

      {/* Centered message */}
      <View>
          <Text style={[styles.content, { color: colors.text, fontStyle: "italic" }]}>
            Loading page content...
          </Text>
      </View>

      </SafeAreaView>
    )
  }


  //UI handlers for popups - moved below "no post" handling due to null issues
  const handleEdit = async () => {
    setMenuVisible(false);
    router.replace({
      pathname: "/editpost/[id]",
      params: { id: post.id },
    });
  };

  const handleDelete = async () => {
    console.log(`Deleting post ID: ${post.id}`);
    setMenuVisible(false);
    const token = await Storage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/api/delete-post`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ PostID: id }),
      });

      if (!response.ok) {
        alert("Error while deleting the post. Please try again later.");
        return;
      }

    } catch (e) {
      console.log("Error when deleting post", e);
    } finally {
      router.back();
    }
  };

  //begin the REAL UI
  const thisIsMyPost = currentUser === post.creatorID;
  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.exploreBackground, // match Explore
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={router.back} hitSlop={10}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>More About This Post</Text>
        {/* spacer so title stays centered */}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.exploreCardBackground,
              borderColor: colors.exploreBorder,
            },
          ]}
        >
          {/* Profile row */}
          <View style={styles.profileRow}>
            <Pressable style={{flexDirection: "row", justifyContent: "center"}} onPress={() => router.push({
                  pathname: "/userProfile/[id]",
                  params: { id: post.creatorID }})}>
            <View>
            <Image
              source={
                post.profilePic
                  ? { uri: post.profilePic }
                  : require("@/assets/images/icons8-cat-profile-50.png")
              }
              style={styles.profilePic}
            />
            </View>
            <View>
              <Text style={[styles.username, { color: colors.text, paddingTop:2, }]}>
                {post.username}
              </Text>
              <Text style={[styles.date, { color: colors.text }]}>
                {new Date(post.datePosted).toDateString()}
              </Text>
            </View>
            </Pressable>

            <View style={{ flex: 1 }} />

            <Pressable hitSlop={10} onPress={() => setMenuVisible(true)}>
              <Entypo
                name="dots-three-vertical"
                size={18}
                color={colors.text}
              />
            </Pressable>
          </View>

          {/* Images */}
          <View
            style={{ margin: 5, overflow: "hidden" }}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              if (width !== containerWidth) setContainerWidth(width);
            }}
          >
            {containerWidth > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={containerWidth}
            snapToAlignment="center"
            style={{ flexGrow: 0, borderRadius: 16 }}
            onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / containerWidth);
              setImageIndex(index);
            }}
          >
          {/* {post.imageUrls.map((uri, index) => (
            <Pressable key={index} onPress={() => onImagePress(uri)}>
              <Image
                source={{ uri }}
                style={{ width: containerWidth, height: containerWidth }}
                resizeMode="cover"
              />
            </Pressable> */}

          {/* ))} */}

          {post.imageUrls.map((photo, index) => {
            if (!photo?.pic) return null;

            return (
              <Pressable
                key={`${photo.pic}-${index}`}
                onPress={() => onImagePress(photo.pic)}
              >
                <Image
                  source={{ uri: photo.pic }}
                  accessibilityLabel={photo.altText || "Post image"}
                  accessible
                  style={{ width: containerWidth, height: containerWidth }}
                  resizeMode="cover"
                />
              </Pressable>
            );
          })}

          </ScrollView>
        )}

        </View>


          {/* image count numbers */}
          <View style={{paddingVertical:5}}>
            <Text style={[styles.imageCountText, { color: colors.text,}]}>
              {imageIndex+1} / {post.imageUrls.length}
            </Text>
          </View>


          {/* Caption / content */}
          <Text style={[styles.content, { color: colors.text }]}>
            {post.content}
          </Text>

          {/* tag work */}
          {!!tags?.length && (
            <View style={styles.tagRow}>
              {tags.slice(0, 5).map((tag) => (
                <View
                  key={`${post.id}-${tag}`}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: "transparent",
                      borderColor: colors.decorativeBackground,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: colors.text }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Action row (like / comment / save) */}
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.actionButton}
              onPress={handleLikePress}
            >
              <Feather
                name="heart"
                size={24}
                color={liked ? "#E57373" : colors.text}
              />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {liked ? "Liked" : "Like"}
              </Text>
            </Pressable>

            {/* <Pressable style={styles.actionButton}>\
              <Feather name="message-circle" size={24} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                Comment
              </Text>
            </Pressable> */}

            <Pressable onPress={() => showComments(post)} style={styles.actionButton}>
              <Feather name="message-circle" size={24} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Comment</Text>
            </Pressable>

            <View style={{ flex: 1 }} />

            <Pressable
              style={styles.actionButton}
              onPress={handleSavePress}
            >
              <Feather
                name="bookmark"
                size={24}
                color={
                  saved ? colors.exploreFilterSelected : colors.text
                }
              />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {saved ? "Saved" : "Save"}
              </Text>
            </Pressable>
          </View>

        </View>

      </ScrollView>

    {/* modal for clicking into images */}
    {modalImageUri && Platform.OS !== "web" && (
      <Modal
        visible
        transparent
        onRequestClose={() => setModalImageUri(null)}
      >
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            pinchGestureEnabled={Platform.OS === "ios"}
          >
            <Pressable
              onPress={() => setModalImageUri(null)}
              style={{ width: "100%", height: "100%" }}
            >
              <Image
                source={{ uri: modalImageUri }}
                style={{
                  width: Dimensions.get("window").width,
                  height: Dimensions.get("window").height,
                }}
                resizeMode="contain"
              />
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    )}

      {/* modal for triple-dot pop-up */}
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
          >
            <View
              style={[
                styles.menuContainer,
                { backgroundColor: colors.exploreCardBackground },
              ]}
            >
          {thisIsMyPost ? (
            <>
            {/* if this is my post, then display edit/delete options */}
              <TouchableOpacity onPress={handleEdit} style={styles.menuOption}>
                <Feather name="edit" size={18} color={colors.text} />
                <Text style={[styles.menuText, { color: colors.text }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDelete} style={styles.menuOption}>
                <Feather name="trash-2" size={18} color={colors.warning} />
                <Text style={[styles.menuText, { color: colors.warning }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </>
            // else, display report option
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  console.log("Report pressed (not implemented yet)");
                }}
                style={styles.menuOption}
              >
                <Feather name="flag" size={18} color={colors.warning} />
                <Text style={[styles.menuText, { color: colors.warning }]}>
                  Report
                </Text>
              </TouchableOpacity>
            )}
            </View>
          </TouchableOpacity>
        </Modal>
          <ExploreCommentsModal isVisible={areCommentsVisible} onClose={() => {setAreCommentsVisible(false); currentPost.current = null; creatorID.current = null}} currentPost={currentPost.current} postCreator={creatorID.current}></ExploreCommentsModal>
        <BottomNavButton />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1, // square image, insta-style
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: "100%",
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
    fontSize: 14,
    marginLeft: 6,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
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
    backgroundColor: "transparent",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 16,
  },
  imageCountText: {
    fontSize: 14,
  },
});
