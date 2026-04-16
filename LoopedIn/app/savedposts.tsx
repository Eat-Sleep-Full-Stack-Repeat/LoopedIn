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
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
// FIXME remove the following import once backend is set up
import mockUser from "./mockData";
import ForumPostView from "@/components/forumPost";
import API_URL from "@/utils/config";
import { Storage } from "../utils/storage";
import { router } from "expo-router";
import {
  GestureHandlerRootView,
  RefreshControl,
} from "react-native-gesture-handler";
import { useAppSize } from "@/Hooks/useSize";

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
  is_saved_post_render: boolean;
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
  const loadingMore = useRef<true | false>(false);
  const hasMore = useRef(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, []);

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
    handleRefresh();
  }, [craftFilter]);

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    } else {
      lastPostID.current = null;
      lastTimeStamp.current = null;
      hasMore.current = true;
      setForumData([]);
      setRefreshing(true);
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
      craftFilter.forEach((element) => {
        let tempElement = element.replace(/"/g, "");
        craftURL = craftURL + `&craft[]=${tempElement}`;
      });

      const res = await fetch(
        `${API_URL}/api/forum/get-all-saved-forums?limit=${limit}${includeBefore}${includePostID}${craftURL}`,
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
      console.log("Error when trying to fetch saved forum data:", e);
    } finally {
      // even if fetching data fails, we will update loading more
      loadingMore.current = false;
    }
  };

  // Styles will go here
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      flexDirection: "column",
      backgroundColor: colors.background,
      paddingHorizontal: 15,
    },
    title: {
      alignItems: "center",
      marginBottom: 20,
      marginTop: 10,
      position: "relative",
      justifyContent: "center",
      flexDirection: "row",
    },
    titleText: {
      color: colors.text,
      fontSize: size.font.largeTitleText,
      fontWeight: size.weight.title,
    },
    refineHeader: {
      flexDirection: "column",
    },
    recentPostsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
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
      width: 90,
      alignItems: "center",
    },
    backFab: {
      position: "absolute",
      left: 0,
    },
    backArrow: {
      fontSize: size.font.largeTitleText,
      color: colors.text,
    },
  });

  const headerView = () => (
    <View>
      {/* Forum title */}
      <View style={styles.title} accessible={true} accessibilityRole={"header"}>
        <Pressable
          style={styles.backFab}
          onPress={() => router.back()}
          accessible={true}
          accessibilityLabel={"Go Back"}
          accessibilityHint={"Navigates back to the previous page."}
          accessibilityRole={"button"}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.titleText}> Saved Posts </Text>
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

      {/* recent posts header - content is in flatlist below */}
      <View style={styles.refineHeader}>
        <View style={styles.recentPostsHeader}>
          <Text style={styles.refineHeaderText}>Saved Posts</Text>
        </View>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        {/* back button */}
        <FlatList
          data={forumData}
          renderItem={({ item }) => (
            <View style={{ alignItems: "center", marginHorizontal: 20 }}>
              <ForumPostView postInfo={item} hasSideBar={false} />
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
              return <ActivityIndicator size="small" color={colors.text} />;
            } else {
              return (
                <View
                  style={{
                    paddingVertical: 40,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.settingsText,
                      fontWeight: size.weight.title,
                      fontSize: size.font.detailText,
                    }}
                  >
                    {" "}
                    No Saved Posts{" "}
                  </Text>
                </View>
              );
            }
          }}
          ListFooterComponent={() => {
            if (forumData.length > 0) {
              if (!hasMore.current) {
                return (
                  <Text
                    style={{
                      color: colors.settingsText,
                      fontWeight: size.weight.title,
                      fontSize: size.font.detailText,
                    }}
                  >
                    {" "}
                    No More Saved Posts{" "}
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
      </View>
    </GestureHandlerRootView>
  );
}
