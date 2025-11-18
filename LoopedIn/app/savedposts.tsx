import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import { useRouter } from "expo-router";
import BottomNavButton from "@/components/bottomNavBar";
import ForumPostView from "@/components/forumPost";
import API_URL from "@/utils/config";
import { Storage } from "@/utils/storage";

type ForumPost = {
  id: string;
  title: string;
  profilePic: string | null;
  username: string;
  content: string;
  datePosted: string;
};

type BackendPost = {
  fld_post_pk: string;
  fld_header: string;
  fld_profile_pic: string | null;
  fld_username: string;
  fld_body: string;
  fld_timestamp: string;
};

export default function SavedPosts() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [savedPosts, setSavedPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedPosts = async () => {
    try {
      const token = await Storage.getItem("token");

      const res = await fetch(`${API_URL}/api/forum/get-saved-forums`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        alert("Error fetching saved posts");
        router.replace("/");
        return;
      }

      const responseData = await res.json();

      const mapped: ForumPost[] = responseData.newFeed.map(
        (post: BackendPost) => ({
          id: post.fld_post_pk,
          profilePic: post.fld_profile_pic,
          title: post.fld_header,
          username: post.fld_username,
          content: post.fld_body,
          datePosted: post.fld_timestamp,
        })
      );

      setSavedPosts(mapped);

      



      
    } catch (e) {
      console.log("Error loading saved posts:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSavedPosts();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: 20,
          alignItems: "center",
        }}
      >
        <Text
          style={[
            styles.pageTitle,
            { color: colors.text, fontSize: 35, fontWeight: "bold" },
          ]}
        >
          Saved Posts
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.text} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={savedPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ alignItems: "center", marginHorizontal: 20 }}>
              <ForumPostView postInfo={item} />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
          ListEmptyComponent={() => (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ color: colors.settingsText, fontWeight: "bold" }}>
                No saved posts
              </Text>
            </View>
          )}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 120,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      <BottomNavButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
});
