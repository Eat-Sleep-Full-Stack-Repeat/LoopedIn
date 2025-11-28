import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import BottomNavButton from "@/components/bottomNavBar";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import API_URL from "@/utils/config";
import { Storage } from "../utils/storage";
import { GestureHandlerRootView, RefreshControl } from "react-native-gesture-handler";


type Post = {
  id: string;
  username: string;
  userID: string;
  profilePic: string | null;
  postImage: string; //because we only load up the most recent image
  postImageID: string;
  caption: string;
  datePosted: string;
}

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
  const [selectedFilter, setSelectedFilter] = useState("All");
  const filters = ["All", "Crochet", "Knit"];
  const insets = useSafeAreaInsets();
  const router = useRouter()

  //limit -> change if we want
  const limit = 10;
  const lastTimeStamp = useRef<string | null>(null);
  const lastPostID = useRef<number | null>(null);
  const hasMore = useRef(true);

  //the following is used to only display 10 posts, and then change to an infinite scroll when user hits seee more
  const [postData, setPostData] = useState<Post[]>([]);
  const loadingMore = useRef<true | false>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [craftFilter, setCraftFilter] = useState<string[]>(["Crochet", "Knit"]);

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <View style={styles.profileRow}>
        <Image style={styles.profilePic} 
          source={ item?.profilePic ? {uri: item.profilePic} : require("@/assets/images/icons8-cat-profile-100.png")}/>
        <Text style={styles.username}>
          {item.username}
        </Text>
      </View>

      <Image style={styles.postImage} source={{uri: item.postImage}}/>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.postAction}>
          <Image style={[styles.actionIcon, {tintColor: colors.text}]} source={require("../assets/images/heart.png")} />
          <Text style={styles.postActionText}>Like</Text>
        </View>

        <View style={styles.postAction}>
          <Image style={[styles.actionIcon, {tintColor: colors.text}]} source={require("../assets/images/comment.png")} />
          <Text style={styles.postActionText}>Comment</Text>
        </View>

        <View style={styles.postAction}>
          <Image style={[styles.actionIcon, {tintColor: colors.text}]} source={require("../assets/images/tags.png")} />
          <Text style={styles.postActionText}>Tags</Text>
        </View>

        <View style={styles.postAction}>
          <Image style={[styles.actionIcon, {tintColor: colors.text}]} source={require("../assets/images/saved.png")} />
          <Text style={styles.postActionText}>Saved</Text>
        </View>
      </View>
    </View>
  )


  useEffect(() => {
    if (selectedFilter === "All") { // pass all craft filters to backend
      setCraftFilter(["Crochet", "Knit"]);
    } 
    else { //pass specific craft to backend
      setCraftFilter([selectedFilter]);
    }
  }, [selectedFilter]);

  useEffect(() => {
    if (!refreshing) {
      handleRefresh();
    }
  }, [craftFilter])


  const handleRefresh = async() => {
    if (refreshing) {
      return 
    } 
    else {
      setRefreshing(true);
      setPostData([]);
      lastPostID.current = null;
      lastTimeStamp.current = null;
      hasMore.current = true;
    }
  }

  // need to use useEffect to ensure previous data is flushed before fetching new data
  useEffect(() => {
    if (refreshing) {
      try {
        fetchData();
      }
      catch (e) {
        console.log("error when refreshing data", e);
      } 
      finally {
        setRefreshing(false);
      }
    }
  }, [refreshing])

  const fetchData = async () => {
    const token = await Storage.getItem("token");
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

      let craftURL = ``;
      craftFilter.forEach(element => {
        let tempElement = element.replace(/"/g, '');
        craftURL = craftURL + `&craft[]=${tempElement}`
      });

      console.log("before:", lastTimeStamp.current, lastPostID.current)

      const response = await fetch(`${API_URL}/api/post?limit=${limit}${includeBefore}${includePostID}${craftURL}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      )

      if (!response.ok) {
        alert("Error during post fetch from backend")
        router.replace("/")
        return;
      }

      const responseData = await response.json();

      let tempPostData: Post[] = responseData.newFeed.map(
        (post: BackendPost) => ({
          id: post.fld_post_pk,
          username: post.fld_username,
          userID: post.fld_user_pk,
          profilePic: post.fld_profile_pic,
          postImage: post.fld_post_pic,
          postImageID: post.fld_pic_id,
          caption: post.fld_caption,
          datePosted: post.fld_timestamp,
        })
      )
      
      setPostData((prev) => [...prev, ...tempPostData]);
      hasMore.current = (responseData.hasMore);
      lastTimeStamp.current = tempPostData[tempPostData.length - 1].datePosted;
      lastPostID.current = Number(tempPostData[tempPostData.length - 1].id);
      console.log("after:", lastTimeStamp.current, lastPostID.current)
    }
    catch(error) {
      console.log("Error fetching posts: ", error)
    }
    finally {
      // even if fetching data fails, we will update loading more
      loadingMore.current = false;
    }
  }


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
      marginHorizontal: 20,
      borderColor: colors.exploreFilterSelected,
      backgroundColor: "#FFFFFF",
      color: colors.text,
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
      width: 35,
      height: 35,
      borderRadius: 17,
      marginRight: 10,
    },
    username: {
      fontWeight: "600",
      fontSize: 15,
      color: colors.text,
    },
    postImage: {
      width: "100%",
      height: 180,
      borderRadius: 8,
      backgroundColor: "#EAEAEA",
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
  });

  return (
    <>
      {/* ✅ Disable transition animation for Explore only */}
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "none", // disables slide-in animation
        }}
      />

      <View style={styles.container}>
        <GestureHandlerRootView>
          <Text style={styles.pageTitle}>Explore</Text>

          {/* Search Bar */}
          <TextInput
            style={styles.searchBar}
            placeholder="Search"
            placeholderTextColor="#666"
          />

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            {filters.map((filterOption) => (
              <Pressable
                key={filterOption}
                onPress={() => setSelectedFilter(filterOption)}
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
              data={postData}
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
                    <View style={{paddingVertical: 40}}>
                      <Text style={{color: colors.settingsText, fontWeight: "bold", textAlign: "center"}}> No Recent Posts </Text>
                    </View>
                  )
                }
              }}
              ListFooterComponent={() => {
                if (postData.length > 0) {
                  if (!hasMore.current) {
                    return (
                      <View style={{paddingBottom: 150}}>
                        <Text style={{ color: colors.text }}> No More Data To Load </Text>
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

        <BottomNavButton />
      </View>
    </>
  );
}

