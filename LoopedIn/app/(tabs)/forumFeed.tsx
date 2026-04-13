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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "expo-router";
// FIXME remove the following import once backend is set up
import mockUser from "../mockData";
import ForumPostView from "@/components/forumPost";
import API_URL from "@/utils/config";
import { Storage } from "../../utils/storage";
import {
  GestureHandlerRootView,
  RefreshControl,
} from "react-native-gesture-handler";
import ForumSearchOverlay from "@/components/forumSearchOverlay";
import { useAppSize } from "@/Hooks/useSize";
import BottomFab from "@/components/bottomFab";

type Tag = {
  tagID: string;
  tagColor: string;
  tagName: string;
};

type ForumPost = {
  id: string;
  title: string;
  profilePic: string | null;
  username: string;
  content: string;
  postImages: Image;
  datePosted: string;
  userID: string;
  is_saved_post_render: boolean; //for display purposes -> ensure every saved post on horizontal scroll is same size
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
  fld_profile_pic: string | null;
  fld_username: string;
  fld_body: string;
  fld_pic: Image;
  fld_timestamp: string;
  fld_user_pk: string;
  is_saved_post_render: boolean;
  tag_data: BackendTags[] | [];
};

export default function ForumFeed() {
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [tokenOkay, setTokenOkay] = useState(false);
  const alreadyAlerted = useRef(false); //preventing double-alert in dev

  const userData = mockUser;
  const filters = ["All", "Crochet", "Knit", "Misc"];

  const limit = 10;
  const lastTimeStamp = useRef<string | null>(null);
  const lastPostID = useRef<number | null>(null);

  const size = useAppSize();

  const [craftFilter, setCraftFilter] = useState<string[]>([
    "Crochet",
    "Knit",
    "Misc",
  ]);

  //check token FIRST (prevents 3 errors)
  const checkTokenOkay = async () => {
    try {
      const token = await Storage.getItem("token");
      if (!token) {
        throw new Error("no token");
      } else {
        setTokenOkay(true);
      }
    } catch (e) {
      if (!alreadyAlerted.current) {
        alreadyAlerted.current = true;
        alert("Access denied, please log in and try again.");
        router.replace("/");
      }
    }
  };

  useEffect(() => {
    checkTokenOkay();
  }, []);

  //with good token, load up data
  useEffect(() => {
    if (!tokenOkay) {
      return;
    }
    fetchData();
    fetchSavedData();
  }, [tokenOkay]);

  //trigger search
  const searchFunctionality = () => {
    setSearchOpen(true);
  };

  const handleSeeMorePress = (origin: string) => {
    //FIXME: handle when user wants to see all saved posts
    router.push("/savedposts");
  };

  const handleCreatePost = () => {
    router.push("/newforumpost");
  };

  useEffect(() => {
    if (selectedFilter === "All") {
      // pass all craft filters to backend
      setCraftFilter(["Crochet", "Knit", "Misc"]);
    } else {
      //pass specific craft to backend
      setCraftFilter([selectedFilter]);
    }
  }, [selectedFilter]);

  // originally had this in the above use effect but a race condition caused it to show a white screen sometimes
  // This makes sure the craftFilter is fully updated before fetching the new data
  useEffect(() => {
    if (!tokenOkay) {
      return;
    }
    handleRefresh();
  }, [craftFilter]);

  const handleRefresh = async () => {
    if (!tokenOkay) {
      return;
    }
    if (refreshing) {
      return;
    } else {
      lastPostID.current = null;
      lastTimeStamp.current = null;
      hasMore.current = true;
      setForumData([]);
      setSavedForumData([]);
      setRefreshing(true);
    }
  };

  // need to use useEffect to ensure previous data is flushed before fetching new data
  useEffect(() => {
    if (refreshing) {
      const refreshNewData = async () => {
        try {
          await fetchData();
          await fetchSavedData();
        } catch (e) {
          console.log("error when refreshing data", e);
        } finally {
          setRefreshing(false);
        }
      };

      refreshNewData();
    }
  }, [refreshing]);

  const fetchData = async () => {
    if (!tokenOkay) {
      return;
    }
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
      craftFilter.forEach((element) => {
        let tempElement = element.replace(/"/g, "");
        craftURL = craftURL + `&craft[]=${tempElement}`;
      });

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

      if (!res.ok) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Access denied, please log in and try again.");
        }
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
          userID: post.fld_user_pk,
          is_saved_post_render: false,
          tag_data: post.tag_data.map((tag: BackendTags) => ({
            tagID: tag.tagID,
            tagName: tag.tagName,
            tagColor: tag.tagColor,
          })),
        })
      );

      //double check the returned posts to make sure no duplicates are put into forumData
      let filteredArray: ForumPost[] = tempArray.filter(
        (post) => !forumData.some((checkPost) => checkPost.id === post.id)
      );

      setForumData((prev) => [...prev, ...filteredArray]);
      hasMore.current = responseData.hasMore;
      lastTimeStamp.current = tempArray[tempArray.length - 1].datePosted;
      lastPostID.current = Number(tempArray[tempArray.length - 1].id);
    } catch (e) {
      console.log("Error when trying to fetch forum data:", e);
    } finally {
      // even if fetching data fails, we will update loading more
      loadingMore.current = false;
    }
  };

  const fetchSavedData = async () => {
    if (!tokenOkay) {
      return;
    }
    const token = await Storage.getItem("token");

    try {
      let craftURL = ``;
      craftFilter.forEach((element) => {
        let tempElement = element.replace(/"/g, "");
        craftURL = craftURL + `&craft[]=${tempElement}`;
      });

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
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Access denied, please log in and try again.");
        }
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
          userID: post.fld_user_pk,
          is_saved_post_render: true,
          tag_data: post.tag_data.map((tag: BackendTags) => ({
            tagID: tag.tagID,
            tagName: tag.tagName,
            tagColor: tag.tagColor,
          })),
        })
      );

      setSavedForumData(tempArray);
    } catch (e) {
      console.log("error when fetching saved posts");
    }
  };

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
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.secondaryButton,
      width: size.iconSize + 24,
      height: size.iconSize + 24,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
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
      fontSize: size.font.largeTitleText,
      fontWeight: size.weight.title,
    },
    refineHeader: {
      flexDirection: "column",
      marginHorizontal: 20,
    },
    refineHeaderText: {
      fontWeight: size.weight.largeTitle,
      fontSize: size.font.button,
      color: colors.text,
      marginBottom: 10,
    },
    craftFilter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: 5,
      marginBottom: 20,
    },
    craftTags: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 15,
    },
    buttonPressed: {
      backgroundColor: colors.decorativeBackground,
    },
    buttonNotPressed: {
      backgroundColor: colors.secondaryButton,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
    },
    buttonBase: {
      padding: 10,
      borderRadius: 50,
      width: 75,
      alignItems: "center",
    },
    savedPostsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });

  const headerView = () => (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {/* my posts */}
        <View style={styles.searchBar}>
          <Pressable
            style={styles.searchIcon}
            onPress={() => router.push("/myposts")}
            accessible={true}
            accessibilityLabel={"My Posts"}
            accessibilityRole={"button"}
            accessibilityHint={
              "Navigates to the page to view all your forum posts."
            }
          >
            <Feather
              name="user"
              size={size.iconSize + 4}
              color={colors.decorativeBackground}
            />
          </Pressable>
        </View>
        {/* Search icon section */}
        <View style={styles.searchBar}>
          <Pressable
            style={styles.searchIcon}
            onPress={searchFunctionality}
            accessible={true}
            accessibilityLabel={"Search"}
            accessibilityRole={"button"}
            accessibilityHint={
              "Navigates to the forum posts search bar. Double tap to search all forum posts."
            }
          >
            <Feather
              name="search"
              size={size.iconSize + 2}
              color={colors.decorativeBackground}
            />
          </Pressable>
        </View>
      </View>

      {/* Forum title */}
      <View style={styles.title}>
        <Text
          style={styles.titleText}
          accessible={true}
          accessibilityRole={"header"}
        >
          {" "}
          Forum{" "}
        </Text>
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
                accessible={true}
                accessibilityHint={
                  filterOption == "All"
                    ? "Shows all forum posts"
                    : "Shows forum posts sorted by " +
                      filterOption +
                      " craft type"
                }
                accessibilityRole={"tab"}
                accessibilityState={
                  selectedFilter === filterOption
                    ? { selected: true }
                    : { selected: false }
                }
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
                      ? { color: colors.antiText }
                      : { color: colors.secondaryText },
                    {
                      fontSize: size.font.bodyText,
                      fontWeight: size.weight.headline,
                    },
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
          <Pressable
            onPress={() => handleSeeMorePress("saved")}
            accessible={true}
            accessibilityLabel={"See More"}
            accessibilityRole={"button"}
            accessibilityHint={"Navigates to the page to view all saved posts."}
          >
            <Text style={{ color: colors.text }}>See More {"→"}</Text>
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
          flexGrow: 1,
        }}
        ListEmptyComponent={() => {
          if (loadingMore.current) {
            return (
              <ActivityIndicator
                size="small"
                color={colors.text}
                style={{
                  flexGrow: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            );
          } else {
            return (
              <View
                style={{
                  paddingVertical: 40,
                  justifyContent: "center",
                  alignItems: "center",
                  marginLeft: 30,
                }}
              >
                <Text
                  style={{
                    color: colors.settingsText,
                    textAlign: "center",
                    fontWeight: size.weight.headline,
                  }}
                >
                  {" "}
                  No saved posts{" "}
                </Text>
              </View>
            );
          }
        }}
        style={{ flexGrow: 1 }}
      />

      {/* recent posts header - content is in flatlist below */}
      <View style={styles.refineHeader}>
        <View style={styles.savedPostsHeader}>
          <Text style={styles.refineHeaderText}>Recent Posts</Text>
        </View>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <FlatList
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
          onEndReached={() => tokenOkay && fetchData()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={() => {
            if (loadingMore.current) {
              return <ActivityIndicator size="small" color={colors.text} />;
            } else {
              return (
                <View style={{ paddingVertical: 40, marginLeft: 50 }}>
                  <Text
                    style={{ color: colors.settingsText, fontWeight: "bold" }}
                  >
                    {" "}
                    No Recent Posts{" "}
                  </Text>
                </View>
              );
            }
          }}
          ListFooterComponent={() => {
            if (forumData.length > 0) {
              if (!hasMore.current) {
                return (
                  <Text style={{ color: colors.settingsText }}>
                    {" "}
                    No More Data To Load{" "}
                  </Text>
                );
              } else {
                return <ActivityIndicator size="small" color={colors.text} />;
              }
            }
          }}
          ListFooterComponentStyle={{ alignItems: "center", marginTop: 15 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />

        <Pressable
          onPress={handleCreatePost}
          accessible={true}
          accessibilityLabel={"Create Forum Post"}
          accessibilityHint={
            "Navigates to the create forum post screen. Double tap to create a forum post."
          }
          accessibilityRole={"button"}
        >
          <BottomFab />
        </Pressable>

        {/*slide-in search overlay */}
        <ForumSearchOverlay
          visible={searchOpen}
          onClose={() => setSearchOpen(false)}
          forumData={forumData}
        />
      </View>
    </GestureHandlerRootView>
  );
}
