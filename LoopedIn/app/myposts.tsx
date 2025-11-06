import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import BottomNavButton from "@/components/bottomNavBar";
import { useRouter, Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ForumPostView from "@/components/forumPost";
import { useState } from "react";

export default function MyPosts() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [myPosts, setMyPosts] = useState([
    {
      id: "1",
      title: "My Favorite Knit Patterns",
      profilePic: null,
      username: "looplover",
      content:
        "I just finished a new scarf pattern and wanted to share it! What do you all think?",
      datePosted: "2025-10-20",
    },
    {
      id: "2",
      title: "Crochet Blanket Progress",
      profilePic: null,
      username: "looplover",
      content:
        "Making good progress on my blanket project. This yarn is so soft!",
      datePosted: "2025-10-22",
    },
  ]);

  const handleCreatePost = () => {
    router.push("/newforumpost");
  };

  return (
    <GestureHandlerRootView>
      {/* Hide default Expo header */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* ✅ Custom sticky beige/dark header with adaptive text */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.headerText, { color: colors.text }]}>
            My Posts
          </Text>
        </View>

        <FlatList
          data={myPosts}
          renderItem={({ item }) => (
            <View style={{ alignItems: "center", marginHorizontal: 20 }}>
              <ForumPostView postInfo={item} />
            </View>
          )}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 25 }} />}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
            backgroundColor: colors.background,
          }}
          ListHeaderComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.settingsText }]}>
                You haven’t posted anything yet.
              </Text>
            </View>
          )}
        />

        {/* Floating add post button */}
        <Pressable
          style={[
            styles.floatingButton,
            { backgroundColor: colors.decorativeBackground },
          ]}
          onPress={handleCreatePost}
        >
          <Feather name="plus" size={28} color={colors.decorativeText} />
        </Pressable>

        {/* Bottom nav bar */}
        <BottomNavButton />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    position: "sticky", // keeps header visible on web
    top: 0,
    zIndex: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 90,
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
});
