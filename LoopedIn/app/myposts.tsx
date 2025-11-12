import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import BottomNavButton from "@/components/bottomNavBar";
import { Feather, Entypo } from "@expo/vector-icons";

export default function MyPosts() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const posts = [
    {
      id: 1,
      title: "My Favorite Knit Patterns",
      username: "looplover",
      content:
        "I just finished a new scarf pattern and wanted to share it! What do you all think?",
      date: "Sun Oct 19 2025",
    },
    {
      id: 2,
      title: "Crochet Blanket Progress",
      username: "looplover",
      content:
        "Making good progress on my blanket project. This yarn is so soft!",
      date: "Tue Oct 21 2025",
    },
  ];

  const handleCreatePost = () => {
    router.push("/newforumpost");
  };

  const openMenu = (postId: number) => {
    setSelectedPostId(postId);
    setMenuVisible(true);
  };

  const handleEdit = () => {
    if (selectedPostId !== null) {
      setMenuVisible(false);
      console.log(`Editing post ID: ${selectedPostId}`);
    }
  };

  const handleDelete = () => {
    if (selectedPostId !== null) {
      setMenuVisible(false);
      console.log(`Deleting post ID: ${selectedPostId}`);
      // future delete logic here
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "none" }} />

      <SafeAreaView
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.pageTitle, { color: colors.text }]}>My Posts</Text>

          {posts.map((post) => (
            <View
              key={post.id}
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
                <View style={styles.profileRow}>
                  <Image
                    source={require("@/assets/images/icons8-cat-profile-50.png")}
                    style={styles.profilePic}
                  />
                  <View>
                    <Text style={[styles.username, { color: colors.text }]}>
                      {post.username}
                    </Text>
                    <Text style={[styles.date, { color: colors.text }]}>
                      {post.date}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => openMenu(post.id)}>
                  <Entypo
                    name="dots-three-vertical"
                    size={18}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.postTitle, { color: colors.text }]}>
                {post.title}
              </Text>
              <Text style={[styles.content, { color: colors.text }]}>
                {post.content}
              </Text>
            </View>
          ))}

          <View style={{ height: 200 }} />
        </ScrollView>

        {/* Floating + button */}
        <Pressable
          style={[
            styles.floatingButton,
            {
              backgroundColor: colors.decorativeBackground,
              bottom: insets.bottom + 120,
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
  floatingButton: {
    position: "absolute",
    right: 25,
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
