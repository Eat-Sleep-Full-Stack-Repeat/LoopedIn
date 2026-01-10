import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import BottomNavButton from "@/components/bottomNavBar";
import { Feather, Entypo } from "@expo/vector-icons";
import API_URL from "@/utils/config";
import { Storage } from "../utils/storage";
import { GestureHandlerRootView, RefreshControl } from "react-native-gesture-handler";

type Tag = {
  tagID: string;
  tagColor: string;
  tagName: string;
}

type ForumPost = {
  id: string;
  username: string;
  userID: string;
  profilePic: string | null;
  header: string;
  body: string;
  datePosted: string;
  tag_data: Tag[];
}

type BackendTags = {
  tagID: string;
  tagName: string;
  tagColor: string;
}

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
    router.push("/editforum");
  };

  const handleDelete = () => {
    if (selectedPostId !== null) {
      setMenuVisible(false);
      console.log(`Deleting post ID: ${selectedPostId}`);
      // future delete logic here
    }
  };




  const fetchData = async () => {
    const token = await Storage.getItem("token");

    //login check to reduce unnecessary fetches
    if (!token) {
      alert("Hold on there... you need to login first!")
      router.replace("/login")
      return
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


      const response = await fetch(`${API_URL}/api/forum/my-forum-posts?limit=${limit}${includeBefore}${includePostID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      )

      //if user hasn't posted yet
      if (response.status == 404) {
        setNoPosts(true)
        return;
      }

      //expired token not taken away from storage or overall not allowed to access resource
      else if (response.status == 403) {
        alert("Hold on there... you need to login first!")
        router.replace("/login")
        return
      }

      else if (!response.ok) {
        alert("Server error occured. Please try again later.")
        router.replace("/")
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
          tag_data: post.tag_data.map(
            (tag: BackendTags) => ({
                tagID: tag.tagID,
                tagName: tag.tagName,
                tagColor: tag.tagColor,
            })
          )
        })
      )
      
      
      setForumData((prev) => [...prev, ...tempPostData]);
      hasMore.current = (responseData.hasMore);
      lastTimeStamp.current = tempPostData[tempPostData.length - 1].datePosted;
      lastPostID.current = Number(tempPostData[tempPostData.length - 1].id);
    }
    catch(error) {
      console.log("Error fetching posts: ", error)
    }
    finally {
      // even if fetching data fails, we will update loading more
      loadingMore.current = false;
    }
  }


  
  const renderPost = useCallback(({ item }: { item: ForumPost }) => (
    <View
      key={item.id}
      style={[
        styles.postContainer,
        {
          backgroundColor:
            currentTheme === "light" ? "#E0D5DD" : "#9C7C93",
          borderColor: currentTheme === "light" ? "#C4B0C9" : "#6E5670",
        },
      ]}
    >

      {/* Header Row */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.push({
          pathname: "/userProfile/[id]",
          params: { id: item.userID }
        })}>
        <View style={styles.profileRow}>
          <Image
            source={item.profilePic ? { uri: item.profilePic } : require("@/assets/images/icons8-cat-profile-50.png")}
            style={styles.profilePic}
          />
          <View>
            <Text style={[styles.username, { color: colors.text }]}>
              {item.username}
            </Text>
            <Text style={[styles.date, { color: colors.text }]}>
              {new Date(item.datePosted).toDateString()}
            </Text>
          </View>
        </View>
        </Pressable>

        <TouchableOpacity onPress={() => openMenu(parseInt(item.id))}>
          <Entypo
            name="dots-three-vertical"
            size={18}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.postTitle, { color: colors.text }]}>
        {item.header}
      </Text>
      <Text style={[styles.content, { color: colors.text }]}>
        {item.body}
      </Text>
        {!!item.tag_data.length && (
        <View style={styles.tagRow}>
          {item.tag_data.slice(0, 5).map((tag) => (
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
              <Text style={[styles.tagText, { color: colors.text }]}>
                #{tag.tagName}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  ), [
    colors.text,
    router,
    styles,
  ]);

  const handleRefresh = async() => {
    if (refreshing) {
      return 
    } 
    else {
      setRefreshing(true);
      setForumData([]);
      lastPostID.current = null;
      lastTimeStamp.current = null;
      hasMore.current = true;
    }
  }

  // need to use useEffect to ensure previous data is flushed before fetching new data
  useEffect(() => {
    if (refreshing) {

      const refreshNewData = async () => {
        try {
          await fetchData();
        }
        catch (e) {
          console.log("error when refreshing data", e);
        } 
        finally {
          setRefreshing(false);
        }
      }

      refreshNewData();
      
    }
  }, [refreshing])

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "none" }} />

      <SafeAreaView
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
        <GestureHandlerRootView style={styles.scrollContent}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>My Posts</Text>
          <View style={{ height: 10 }} />

          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={item => item.id}
            onEndReached={fetchData}
            onEndReachedThreshold={0.2}
            ListEmptyComponent={() => {
              if (loadingMore.current) {
                return <ActivityIndicator size="small" color={colors.text}/>
              } 
              else {
                return (
                  <View style={{paddingVertical: 10}}>
                    <Text style={{color: colors.settingsText, fontWeight: "bold", textAlign: "center"}}> No posts to see here... create a forum post now! </Text>
                  </View>
                )
              }
            }}
            ListFooterComponent={() => {
              if (posts.length > 0) {
                if (!hasMore.current) {
                  return (
                    <View style={{paddingBottom: 150}}>
                      <Text style={{ color: colors.text }}> No More Posts </Text>
                    </View>
                  )
                } else {
                  return (
                    <View style={{paddingBottom: 150}}>
                      <ActivityIndicator size="small" color={colors.text} />
                    </View>
                  );
                }
              }
            }}
            ListFooterComponentStyle={{ alignItems: "center", marginTop: 15 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}/>
            }
          />
        </GestureHandlerRootView>



        {/* Floating + button */}
        <Pressable
          style={[
            styles.floatingButton,
            {
              backgroundColor: colors.decorativeBackground,
              bottom: insets.bottom + 90,
            },
          ]}
          onPress={handleCreatePost}
        >
          <Feather name="plus" size={28} color={colors.decorativeText} />
        </Pressable>

        <BottomNavButton />

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
          >
            <View
              style={[
                styles.menuContainer,
                { backgroundColor: colors.exploreCardBackground },
              ]}
            >
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
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 180,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 35,
    marginBottom: 20,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
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
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 16,
  },
});
