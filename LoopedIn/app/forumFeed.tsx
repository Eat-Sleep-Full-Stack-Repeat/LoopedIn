import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import BottomNavButton from "@/components/bottomNavBar";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "expo-router";
// FIXME remove the following import once backend is set up
import mockUser from "./mockData";
import ForumPostView from "@/components/forumPost";
import API_URL from "@/utils/config";
import { Storage } from "../utils/storage";
import { router } from "expo-router";
import { GestureHandlerRootView, RefreshControl } from "react-native-gesture-handler";

/*
Ideas for backend implementation:
- Display saved posts from most newly saved -> oldest saved posts
- Display all other posts based on when they were posted
*/

type ForumPost = {
  id: string;
  title: string;
  profilePic: string | null;
  username: string;
  content: string;
  postImages: Image;
  datePosted: string;
};

type BackendPost = {
  fld_post_pk: string;
  fld_header: string;
  fld_profile_pic: string | null;
  fld_username: string;
  fld_body: string;
  fld_pic: Image;
  fld_timestamp: string;
};

export default function ForumFeed() {
  // Constants and functions
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedFilter, setFilter] = useState<string>("All");
  //the following is used to only display 10 posts, and then change to an infinite scroll when user hits seee more
  const [forumData, setForumData] = useState<ForumPost[]>([]);
  const [savedForumData, setSavedForumData] = useState<ForumPost[]>([]);
  const loadingMore = useRef<true | false>(false);
  const hasMore = useRef(true);
  const [refreshing, setRefreshing] = useState(false);

  const userData = mockUser;
  const filters = ["All", "Crochet", "Knit"];

  const limit = 10;
  const lastTimeStamp = useRef<string | null>(null);
  const lastPostID = useRef<number | null>(null);

  const [craftFilter, setCraftFilter] = useState<string[]>(["Crochet", "Knit"]);


  useEffect(() => {
    fetchData();
    fetchSavedData();
  }, []);

  const searchFunctionality = () => {
    // FIXME: handle searching the forums here
    console.log("Search pressed");
  };

  const handleSeeMorePress = (origin: string) => {
    //FIXME: handle when user wants to see all saved posts
    console.log("See more was pressed", origin);
  };

  const handleCreatePost = () => {
    router.push("/newforumpost");
  };

  useEffect(() => {
    console.log("Filter is now: ", selectedFilter);
    if (selectedFilter === "All") { // pass all craft filters to backend
      setCraftFilter(["Crochet", "Knit"]);
    } else { //pass specific craft to backend
      setCraftFilter([selectedFilter]);
    }
  }, [selectedFilter]);

  // originally had this in the above use effect but a race condition caused it to show a white screen sometimes
  // This makes sure the craftFilter is fully updated before fetching the new data
  useEffect(() => {
    handleRefresh();
  }, [craftFilter])

  const handleRefresh = async() => {
    console.log("in handlerefresh functionality");
    if (refreshing) {
      return 
    } else {
      console.log("Going to refresh")
      lastPostID.current = null;
      lastTimeStamp.current = null;
      hasMore.current = true;
      setForumData([]);
      setSavedForumData([]);
      setRefreshing(true);
    }
  }

  // need to use useEffect to ensure previous data is flushed before fetching new data
  useEffect(() => {
    if (refreshing) {
      try {
        fetchData();
        fetchSavedData();
      } catch (e) {
        console.log("error when refreshing data", e);
      } finally {
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
      // need to check if there is a stored timeStamp -> If not, it will be undefined
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


      console.log("The include before variable is: ", includeBefore);
      console.log('Passing back this craft variables: ', craftURL);

      const res = await fetch(
        `${API_URL}/api/forum/get-forums?limit=${limit}${includeBefore}${includePostID}${craftURL}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      console.log("fetched forum data");

      if (!res.ok) {
        alert("Error when fetching new forum posts");
        router.replace("/");
        return;
      }

      const responseData = await res.json();

      // update with the new feed
      let tempArray: ForumPost[] = responseData.newFeed.map(
        (post: BackendPost) => ({
          id: post.fld_post_pk,
          profilePic: post.fld_profile_pic,
          title: post.fld_header,
          username: post.fld_username,
          content: post.fld_body,
          datePosted: post.fld_timestamp,
        })
      );

      console.log("The post ids returned before filtering: \n")
      tempArray.forEach((item) => {
        console.log(item.id)
        console.log("The URL in each item is: ", item.profilePic)
      })

      //double check the returned posts to make sure no duplicates are put into forumData
      let filteredArray: ForumPost[] = tempArray.filter(
        (post) => !forumData.some((checkPost) => checkPost.id === post.id)
      );

      console.log("Going to add this many items to the forums array: ", filteredArray.length);

      setForumData((prev) => [...prev, ...filteredArray]);
      hasMore.current = (responseData.hasMore);
      console.log("The last item in the array is: ", tempArray[tempArray.length - 1])
      lastTimeStamp.current = tempArray[tempArray.length - 1].datePosted;
      console.log("Current timestamp is: ", lastTimeStamp.current);
      lastPostID.current = Number(tempArray[tempArray.length - 1].id);
      console.log("Current post ID is: ", lastPostID);
    } catch (e) {
      console.log("Error when trying to fetch forum data:", e);
    } finally {
      // even if fetching data fails, we will update loading more
      loadingMore.current = false;
    }
  };

  const fetchSavedData = async () => {
    const token = await Storage.getItem("token");

    try {
      let craftURL = ``;
      craftFilter.forEach(element => {
        let tempElement = element.replace(/"/g, '');
        craftURL = craftURL + `&craft[]=${tempElement}`
      });

      console.log('Passing back this craft variables: ', craftURL);

      const res = await fetch(
        `${API_URL}/api/forum/get-saved-forums?limit=${limit}${craftURL}`,
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
        alert("Error when fetching new forum posts");
        router.replace("/");
        return;
      }

      const responseData = await res.json();

      // update with the new feed
      let tempArray: ForumPost[] = responseData.newFeed.map(
        (post: BackendPost) => ({
          id: post.fld_post_pk,
          profilePic: post.fld_profile_pic,
          title: post.fld_header,
          username: post.fld_username,
          content: post.fld_body,
          datePosted: post.fld_timestamp,
        })
      );

      setSavedForumData(tempArray);

    } catch (e) {
      console.log("error when fetching saved posts");
    }

  }

  // Styles will go here
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      flexDirection: "column",
      backgroundColor: colors.background,
      justifyContent: "center",
      position: "relative",
    },
    searchBar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginHorizontal: 20,
    },
    searchIcon: {
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    searchText: {
      color: colors.text,
    },
    title: {
      alignItems: "center",
      marginBottom: 20,
    },
    titleText: {
      color: colors.text,
      fontSize: 35,
      fontWeight: "bold",
    },
    refineHeader: {
      flexDirection: "column",
      marginHorizontal: 20,
    },
    refineHeaderText: {
      fontWeight: "bold",
      fontSize: 16,
      color: colors.text,
      marginBottom: 10,
    },
    craftFilter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: 10,
      marginBottom: 20,
    },
    craftTags: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 20,
    },
    buttonPressed: {
      backgroundColor: colors.decorativeBackground,
    },
    buttonNotPressed: {
      backgroundColor: colors.topBackground,
    },
    buttonBase: {
      padding: 10,
      borderRadius: 15,
    },
    savedPostsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    floatingButton: {
      position: "absolute",
      right: 20,
      bottom: insets.bottom + 90,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.decorativeBackground,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 5,
    },
  });

  const headerView = () => (
    <View>
      {/* Search icon section */}
      <View style={styles.searchBar}>
        <Pressable style={styles.searchIcon} onPress={searchFunctionality}>
          <Feather name="search" size={24} color={colors.text} />
          <Text style={styles.searchText}> Search </Text>
        </Pressable>
      </View>

      {/* Forum title */}
      <View style={styles.title}>
        <Text style={styles.titleText}> Forum </Text>
      </View>

      {/* Refine by craft section */}
      <View style={styles.refineHeader}>
        <Text style={styles.refineHeaderText}> Refine by craft </Text>
        <View style={styles.craftFilter}>
          {/* Craft tags */}
          <View style={styles.craftTags}>
            {filters.map((filterOption) => (
              <Pressable
                key={filterOption}
                onPress={() => setFilter(filterOption)}
                style={[
                  styles.buttonBase,
                  filterOption === selectedFilter
                    ? styles.buttonPressed
                    : styles.buttonNotPressed,
                ]}
              >
                <Text
                  style={[
                    filterOption === selectedFilter
                      ? { color: colors.decorativeText }
                      : { color: colors.text },
                  ]}
                >
                  {filterOption}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Saved forum posts */}
      <View style={styles.refineHeader}>
        <View style={styles.savedPostsHeader}>
          <Text style={styles.refineHeaderText}> Saved Posts </Text>
          <Pressable onPress={() => handleSeeMorePress("saved")}>
            <Text style={{ color: colors.text }}>See More {">"}</Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={savedForumData}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <ForumPostView postInfo={item} />}
        contentContainerStyle={{
          gap: 15,
          marginBottom: 20,
          paddingHorizontal: 15,
          flexGrow: 1
        }}
        ListEmptyComponent={() => {
          if (loadingMore.current) {
            return <ActivityIndicator size="small" color={colors.text} style={{flexGrow: 1, alignItems: "center", justifyContent: "center"}}/>
          } else {
            return (
              <View style={{paddingVertical: 40, justifyContent: "center", alignItems: "center", marginLeft: 30}}>
                <Text style={{color: colors.settingsText, textAlign: "center", fontWeight: "bold"}}> No saved posts </Text>
              </View>
            )
          }
        }}
        style={{flexGrow: 1}}
      />

      {/* recent posts header - content is in flatlist below */}
      <View style={styles.refineHeader}>
        <View style={styles.savedPostsHeader}>
          <Text style={styles.refineHeaderText}>Recent Posts</Text>
        </View>
      </View>
    </View>
  );

  // Page view
  return (
    <GestureHandlerRootView>

      <View style={styles.container}>
        <FlatList
          // will only show 10 posts - user can then select "see more"
          data={forumData}
          renderItem={({ item }) => (
            <View style={{ alignItems: "center", marginHorizontal: 20 }}>
              <ForumPostView postInfo={item} />
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={headerView}
          ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
            backgroundColor: colors.background,
          }}
          onEndReached={fetchData}
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
            if (forumData.length > 0) {
              if (!hasMore.current) {
                return <Text style={{ color: colors.text }}> No More Data To Load </Text>;
              } else {
                return (
                  <ActivityIndicator size="small" color={colors.text} />
                );
              }
            }
          }}
          ListFooterComponentStyle={{ alignItems: "center", marginTop: 15 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}/>
          }
        />
        <Pressable style={styles.floatingButton} onPress={handleCreatePost}>
          <Feather name="plus" size={28} color={colors.decorativeText} />
        </Pressable>
        <BottomNavButton />
      </View>
    </GestureHandlerRootView>
  );
}
