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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import { Feather, Entypo } from "@expo/vector-icons";
import API_URL from "@/utils/config";
import { Storage } from "../../utils/storage";
import ExploreCommentsModal from "@/components/exploreComments";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { reasons } from "@/components/reportReasons";
import { useAppSize } from "@/Hooks/useSize";

type PhotoCard = {
  pic: string;
  altText: string;
  id: string;
};

type SinglePost = {
  id: string;
  creatorID: number;
  username: string;
  //title?: string;
  content: string;
  imageUrls: PhotoCard[];
  profilePic: string;
  datePosted: string;
};

type Tag = {
  tagID: string;
  tagColor: string;
  tagName: string;
};

type BackendTags = {
  tagid: string;
  tagname: string;
  tagcolor: string;
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
  const { id, editVersion, updatedCaption } = useLocalSearchParams();
  const postID = id as string;
  const [currentUser, setCurrentUser] = useState<number | null>(null);
  const [post, setPostInfo] = useState<SinglePost | null>(null);
  const [tagData, setTagData] = useState<Tag[]>([]);
  const route = useRoute();

  //for image scrolling/viewing
  const [modalImageUri, setModalImageUri] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  //for report menu handling
  const [reportMenuVisible, setReportMenuVisible] = useState(false);
  const [reportSending, setReportSending] = useState(false);

  //for triple-dot handling
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  //comments
  const [areCommentsVisible, setAreCommentsVisible] = useState(false);
  const currentPost = useRef<number | null>(null);
  const creatorID = useRef<number | null>(null);

  const size = useAppSize();

  //actually call the refresh
  useEffect(() => {
    const getPost = async () => {
      await fetchPostInfo();
    };
    getPost();
  }, []);

  useEffect(() => {
    if (updatedCaption && post) {
      setPostInfo({ ...post, content: updatedCaption });
    }
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
      const res = await fetch(`${API_URL}/api/single-post?id=${postID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (res.status == 404) {
        alert("Could not find that post");
        router.back();
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
                  return { pic: url, altText: alt ?? "", id: id ?? "" };
                }

                //backup
                if (pic?.pic) {
                  return {
                    pic: pic.pic,
                    altText: pic.altText ?? "",
                    id: pic.id ?? "",
                  };
                }

                return null;
              })
              .filter(Boolean)
          : [],
      };

      //console.log(mappedPost)

      setPostInfo(mappedPost);
      setCurrentUser(responseData.currentUser);

      //structure and set the tag data
      let tempTagData: Tag[] = responseData.tags.map((tag: BackendTags) => ({
        tagID: tag.tagid,
        tagName: tag.tagname,
        tagColor: tag.tagcolor,
      }));
      setTagData(tempTagData);
      setLiked(!!responseData.postInfo?.fld_is_liked);
      setSaved(!!responseData.postInfo?.fld_is_saved);
    } catch (e) {
      console.log("Error when fetching post data", e);
    }
  };

  //clean up weird timestamp format (consistent w forums)
  const formatDate = (isoString: string) => {
    return new Date(isoString).toDateString();
  };

  const showComments = (item: SinglePost) => {
    currentPost.current = Number(item.id);
    creatorID.current = Number(item.creatorID);
    setAreCommentsVisible(true);
  };

  const handleLikePress = async () => {
    if (likingRef.current) return;
    likingRef.current = true;
    const original = liked;
    setLiked(!original);
    const token = await Storage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/toggle_like?id=${postID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

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
      const res = await fetch(`${API_URL}/api/toggle_save?id=${postID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

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
    return (
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
        {/* Centered message */}
        <View>
          <Text
            style={[
              styles.content,
              {
                color: colors.text,
                fontStyle: "italic",
                fontSize: size.font.caption,
              },
            ]}
          >
            Loading page content...
          </Text>
        </View>
      </SafeAreaView>
    );
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

      setShowDeleteSuccess(true);
    } catch (e) {
      console.log("Error when deleting post", e);
    }
  };

  const handleDeleteSuccessYes = () => {
    setShowDeleteSuccess(false);
    router.replace("/newpost");
  };

  const handleDeleteSuccessNo = () => {
    setShowDeleteSuccess(false);
    router.replace("/userProfile");
  };

  //handle post reporting
  const handleReport = async (reason: string) => {
    console.log("reason chosen:", reason);

    setReportSending(true);

    setReportMenuVisible(false);
    const token = await Storage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/api/report/posts/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ reason: reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error: ${data.message}`);
        return;
      }

      alert("Post successfully reported!");
    } catch (error) {
      alert(`Error reporting post: ${error}`);
      return;
    } finally {
      setReportSending(false);
    }
  };

  //begin the REAL UI
  const thisIsMyPost = currentUser === post.creatorID;
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.exploreBackground, // match Explore
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Header */}
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
          <Text
            style={{
              color: colors.text,
              fontSize: size.font.largeTitleText,
            }}
          >
            ←
          </Text>
        </Pressable>
        <Text
          style={{
            color: colors.text,
            fontSize: size.font.largeTitleText,
            fontWeight: size.weight.title,
            marginHorizontal: size.iconSize + 20,
            textAlign: "center",
          }}
          accessible={true}
          accessibilityRole={"header"}
        >
          More About This Post
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 120,
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
            <Pressable
              style={{ flexDirection: "row", justifyContent: "center" }}
              onPress={() =>
                router.push({
                  pathname: "/userProfile/[id]",
                  params: { id: post.creatorID },
                })
              }
              accessible={true}
              accessibilityHint={
                "Double tap to view " + post.username + " profile"
              }
            >
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
                <Text
                  style={{
                    color: colors.text,
                    paddingTop: 2,
                    fontSize: size.font.headline,
                    fontWeight: size.weight.headline,
                    marginBottom: 3,
                  }}
                >
                  {post.username}
                </Text>
                <Text
                  style={[
                    styles.date,
                    { color: colors.text, fontSize: size.font.detailText },
                  ]}
                >
                  {new Date(post.datePosted).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </Pressable>

            <View style={{ flex: 1 }} />

            <Pressable
              hitSlop={10}
              onPress={() => setMenuVisible(true)}
              accessible={true}
              accessibilityLabel={"Explore Post Menu"}
              accessibilityHint={
                "Double tap to view the explore post menu options."
              }
              accessibilityRole={"button"}
              style={{
                backgroundColor: colors.secondaryButton,
                padding: 14,
                borderRadius: 99,
                width: size.iconSize + 30,
                height: size.iconSize + 30,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.decorativeBackground,
              }}
            >
              <Entypo
                name="dots-three-vertical"
                size={size.iconSize}
                color={colors.decorativeBackground}
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
                style={{ flexGrow: 0, borderRadius: 20 }}
                onMomentumScrollEnd={(
                  event: NativeSyntheticEvent<NativeScrollEvent>
                ) => {
                  const offsetX = event.nativeEvent.contentOffset.x;
                  const index = Math.round(offsetX / containerWidth);
                  setImageIndex(index);
                }}
              >
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
                        style={{
                          width: containerWidth,
                          height: containerWidth,
                        }}
                        resizeMode="cover"
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* image count numbers */}
          <View style={{ paddingVertical: 5 }}>
            <Text style={{ color: colors.text, fontSize: size.font.caption }}>
              {imageIndex + 1} / {post.imageUrls.length}
            </Text>
          </View>

          {/* Caption / content */}
          <Text
            style={[
              styles.content,
              { color: colors.text, fontSize: size.font.caption },
            ]}
          >
            {post.content}
          </Text>

          {/* tag work */}
          {!!tagData?.length && (
            <View style={styles.tagRow}>
              {tagData.map((tag) => (
                <View
                  key={`${post.id}-${tag.tagID}`}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: "transparent",
                      borderColor: tag.tagColor,
                    },
                  ]}
                >
                  {tag.tagName === "Knit" ||
                  tag.tagName === "Crochet" ||
                  tag.tagName === "Misc" ? (
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: size.font.detailText,
                        fontWeight: size.weight.title,
                      }}
                    >
                      🌟{tag.tagName}
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: size.font.detailText,
                        fontWeight: size.weight.title,
                      }}
                    >
                      #{tag.tagName}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Action row (like / comment / save) */}
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.actionButton}
              onPress={handleLikePress}
              accessible={true}
              accessibilityLabel={"Like"}
              accessibilityHint={
                liked
                  ? "double tap to unlike this post"
                  : "double tap to like this post"
              }
              accessibilityState={
                liked ? { checked: true } : { checked: false }
              }
              accessibilityRole={"button"}
            >
              <Feather
                name="heart"
                size={size.iconSize + 4}
                color={liked ? "#E57373" : colors.text}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: colors.text, fontSize: size.font.caption },
                ]}
              >
                {liked ? "Liked" : "Like"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => showComments(post)}
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
              onPress={handleSavePress}
              accessible={true}
              accessibilityLabel={"Save"}
              accessibilityHint={
                saved
                  ? "double tap to unsave this post"
                  : "double tap to save this post"
              }
              accessibilityState={
                saved ? { checked: true } : { checked: false }
              }
              accessibilityRole={"button"}
            >
              <Feather
                name="bookmark"
                size={size.iconSize + 4}
                color={saved ? colors.exploreFilterSelected : colors.text}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: colors.text, fontSize: size.font.caption },
                ]}
              >
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
          accessible={false}
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
                <TouchableOpacity
                  onPress={handleEdit}
                  style={styles.menuOption}
                  accessible={true}
                  accessibilityLabel={"Edit"}
                  accessibilityHint={
                    "Navigates to the edit explore post screen. Double tap to edit this post."
                  }
                >
                  <Feather
                    name="edit"
                    size={size.iconSize - 2}
                    color={colors.text}
                  />
                  <Text
                    style={{ color: colors.text, fontSize: size.font.button }}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.menuOption}
                  accessible={true}
                  accessibilityLabel={"Delete"}
                  accessibilityHint={"Double tap to delete this explore post."}
                >
                  <Feather
                    name="trash-2"
                    size={size.iconSize - 2}
                    color={colors.warning}
                  />
                  <Text
                    style={{
                      color: colors.warning,
                      fontSize: size.font.button,
                    }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // else, display report option
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  setReportMenuVisible(true);
                }}
                style={styles.menuOption}
                accessible={true}
                accessibilityLabel={"Report"}
                accessibilityHint={
                  "Double tap to report this explore post to LoopedIn moderators."
                }
              >
                <Feather
                  name="flag"
                  size={size.iconSize - 2}
                  color={colors.text}
                />
                <Text
                  style={{ color: colors.text, fontSize: size.font.button }}
                >
                  Report
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setMenuVisible(false)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              accessibilityHint="Double tap to exit explore post menu"
              style={{
                marginTop: 10,
                padding: 8,
                borderColor: colors.cancel,
                borderWidth: 1,
                borderRadius: 12,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.cancel, fontSize: size.font.button }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <ExploreCommentsModal
        isVisible={areCommentsVisible}
        onClose={() => {
          setAreCommentsVisible(false);
          currentPost.current = null;
          creatorID.current = null;
        }}
        currentPost={currentPost.current}
        postCreator={creatorID.current}
      ></ExploreCommentsModal>
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
            <Text
              style={[
                styles.successTitle,
                {
                  color: colors.text,
                  fontSize: size.font.titleText,
                  fontWeight: size.weight.largeTitle,
                },
              ]}
            >
              Successfully Deleted!
            </Text>
            <Text
              style={[
                styles.successDescription,
                { color: colors.settingsText, fontSize: size.font.button },
              ]}
            >
              Ready to start a new post?
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
                  style={{
                    color: colors.disabledButtonText,
                    fontSize: size.font.button,
                    fontWeight: size.weight.largeTitle,
                  }}
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
                  style={{
                    color: colors.disabledButtonText,
                    fontSize: size.font.button,
                    fontWeight: size.weight.largeTitle,
                  }}
                >
                  No
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {/*report modal */}
      <Modal
        transparent
        visible={reportMenuVisible}
        animationType="fade"
        onRequestClose={() => setReportMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          accessible={false}
        >
          <View
            style={[
              styles.reportMenuContainer,
              { backgroundColor: colors.exploreCardBackground },
            ]}
          >
            <View style={{ paddingBottom: 20 }}>
              <Text
                style={[
                  styles.reportHeaderText,
                  { color: colors.text, fontSize: size.font.button },
                ]}
              >
                Report Reason
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.blockedBackground,
                height: 1,
                width: "100%",
              }}
            />
            {reasons.map((reason) => (
              <View style={{ flexDirection: "column" }} key={reason}>
                <TouchableOpacity
                  onPress={() => handleReport(reason)}
                  style={styles.menuOption}
                  key={reason}
                  disabled={reportSending}
                  accessible={true}
                  accessibilityLabel={`Reason option: ${reason}`}
                  accessibilityHint={
                    "Double tap to report post for this reason."
                  }
                >
                  <Text
                    style={{ color: colors.text, fontSize: size.font.button }}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
                {/*line separator guy */}
                <View
                  style={{
                    backgroundColor: colors.blockedBackground,
                    height: 1,
                    width: "100%",
                  }}
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={() => setReportMenuVisible(false)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              accessibilityHint="Double tap to exit report menu"
              style={{
                marginTop: 20,
                padding: 10,
                borderColor: colors.cancel,
                borderWidth: 1,
                borderRadius: 12,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.cancel, fontSize: size.font.button }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 10,
  },
  card: {
    borderRadius: 20,
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
  date: {
    opacity: 0.7,
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
    marginLeft: 6,
  },
  content: {
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
  reportMenuContainer: {
    width: 320,
    borderRadius: 12,
    paddingTop: 30,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  reportHeaderText: {
    textAlign: "center",
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
    marginBottom: 12,
    textAlign: "center",
  },
  successDescription: {
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
});
