// app/singlepost.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import BottomNavButton from "@/components/bottomNavBar";
import { Feather, Entypo } from "@expo/vector-icons";

type SinglePostParams = {
  id?: string;
  username?: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  profilePic?: string;
  datePosted?: string;
};

export default function SinglePost() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams<SinglePostParams>();

  // fallback mock data so the UI always renders
  const post = {
    id: params.id ?? "1",
    username: params.username ?? "looplover",
    title: params.title ?? "Cozy Crochet Blanket Progress",
    content:
      params.content ??
      "Working on this cozy blanket for winter! The yarn texture is soft and squishy. What color should I add next?",
    imageUrl:
      params.imageUrl ??
      "https://images.pexels.com/photos/3738085/pexels-photo-3738085.jpeg",
    profilePic: params.profilePic ?? "",
    datePosted: params.datePosted ?? "Sun Oct 19 2025",
  };

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
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
            <Image
              source={
                post.profilePic
                  ? { uri: post.profilePic }
                  : require("@/assets/images/icons8-cat-profile-50.png")
              }
              style={styles.profilePic}
            />
            <View>
              <Text style={[styles.username, { color: colors.text }]}>
                {post.username}
              </Text>
              <Text style={[styles.date, { color: colors.text }]}>
                {post.datePosted}
              </Text>
            </View>

            <View style={{ flex: 1 }} />

            <Pressable hitSlop={10}>
              <Entypo
                name="dots-three-vertical"
                size={18}
                color={colors.text}
              />
            </Pressable>
          </View>

          {/* Title */}
          <Text style={[styles.titleText, { color: colors.text }]}>
            {post.title}
          </Text>

          {/* Image (single-image post) */}
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: post.imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>

          {/* Action row (like / comment / save) */}
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.actionButton}
              onPress={() => setLiked((prev) => !prev)}
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

            <Pressable style={styles.actionButton}>
              <Feather name="message-circle" size={24} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                Comment
              </Text>
            </Pressable>

            <View style={{ flex: 1 }} />

            <Pressable
              style={styles.actionButton}
              onPress={() => setSaved((prev) => !prev)}
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

          {/* Caption / content */}
          <Text style={[styles.content, { color: colors.text }]}>
            {post.content}
          </Text>
        </View>
      </ScrollView>

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
    marginBottom: 8,
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
});
