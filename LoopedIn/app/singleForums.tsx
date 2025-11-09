import React, { useMemo, useState, useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";

type Comment = {
  id: string;
  username: string;
  date: string;
  text: string;
  children?: Comment[];
};

type Post = {
  id: string;
  title: string;
  username: string;
  date: string;
  body: string;
  hasImagePlaceholder?: boolean; //Use to show/hide image placeholder, can be reworked later to just check if post has the imageurl populated
  imageUri?: string | null;
};

const SCREEN_W = Dimensions.get("window").width;

export default function ForumPostDetail() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  const post: Post = useMemo(
    () => ({
      id: "p1",
      title: "Title of this forum post",
      username: "Username",
      date: "Today at 2:34 PM",
      body:
        "A brief snippet of a forum post here. And keep going as long as the person has something to say.\n\nMore text to simulate a longer body for layout.\n\nCool that tab works here!",
      hasImagePlaceholder: true, // Change to false to test without image!
      imageUri: null,
    }),
    []
  );

  const comments: Comment[] = useMemo(
    () => [
      {
        id: "c1", //id scheme is generic, nothing here relys on it so we can change/fix later
        username: "woolwizard",
        date: "3h ago",
        text: "Wow that is so amazing!!",
        children: [
          {
            id: "c1-1",
            username: "knitknight",
            date: "2h ago",
            text: "Agreed! Love the texture.",
            children: [
              {
                id: "c1-1-1",
                username: "crochetcat",
                date: "1h ago",
                text: "Pattern link please?",
                children: [
                  {
                    id: "c1-1-1-1",
                    username: "weavewave",
                    date: "45m ago",
                    text: "Following for updates!",
                    children: [
                      {
                        id: "c1-1-1-1-1",
                        username: "fiberfox",
                        date: "20m ago",
                        text: "Same here—looks great!",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "c2",
        username: "knittheory",
        date: "5h ago",
        text:
          "Here’s a longer comment to show wrapping across multiple lines. Blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah.",
      },
      {
        id: "c3",
        username: "weavewave",
        date: "yesterday",
        text: "Very helpful post, thanks!",
        children: [
             {
            id: "c3-1",
            username: "knitknight",
            date: "2h ago",
            text: "Agreed! Love the texture.",
            children: [
              {
                id: "c3-1-1",
                username: "crochetcat",
                date: "1h ago",
                text: "Pattern link please?",
                children: [],
              },
              {
                  
                    id: "c3-2-1",
                    username: "weavewave",
                    date: "45m ago",
                    text: "Following for updates!",
                    children: [
                      {
                        id: "c3-1-1-1-1",
                        username: "fiberfox",
                        date: "20m ago",
                        text: "Same here—looks great!",
                      },
                    ],
                  
                
              },
            ],
          },
        ]
      },
    ],
    []
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },

    backFab: {
      position: "absolute",
      top: insets.top + 8,
      left: 10,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.boxBackground,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },

    postCard: {
      backgroundColor: colors.topBackground,
      marginHorizontal: 8,
      marginTop: insets.top + 60,
      borderRadius: 16,
      padding: 16,
    },
    postHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    avatarCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.boxBackground,
      marginRight: 12,
    },
    postTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
    postUserRow: { flexDirection: "row", alignItems: "center" },
    postUser: { color: colors.text, marginRight: 8, fontWeight: "600" },
    postDate: { color: colors.text, fontSize: 12 },
    postBody: { color: colors.text, marginTop: 8, lineHeight: 20 },
    imagePlaceholder: {
      width: SCREEN_W - 8 * 2 - 16 * 2,
      height: (SCREEN_W - 8 * 2 - 16 * 2) * 0.65,
      borderRadius: 12,
      backgroundColor: colors.boxBackground,
      marginTop: 14,
    },
    actionRow: { flexDirection: "row", gap: 14, marginTop: 14, alignItems: "center" },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.boxBackground,
      borderRadius: 10,
    },
    actionText: { color: colors.text, fontWeight: "600" },

    sectionHeader: { marginHorizontal: 10, marginTop: 20, marginBottom: 8 },
    sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 18 },

    commentWrap: {
      marginTop: 10,
      position: "relative",
    },

    commentBubble: {
      backgroundColor: colors.topBackground,
      borderRadius: 12,
      padding: 10,
      alignSelf: "stretch",
      marginRight: 8,
    },

    commentHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    commentAvatarInline: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.boxBackground,
    },
    commentHeaderText: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
      minWidth: 0,
    },
    commentUser: { color: colors.text, fontWeight: "700" },
    commentDate: { color: colors.text, fontSize: 12 },
    commentText: { color: colors.text, marginTop: 6, lineHeight: 18 },

    commentActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
      alignItems: "center",
    },
    smallAction: { flexDirection: "row", alignItems: "center", gap: 4 },
    smallIconText: { color: colors.text, fontWeight: "600", fontSize: 12 },

    seeMoreChip: {
      alignSelf: "flex-start",
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.boxBackground,
      borderRadius: 8,
      marginTop: 6,
    },

    divider: { height: 10 },
  });

  const PostCard = () => (
    <View style={styles.postCard}>
      <View style={styles.postHeaderRow}>
        <View style={styles.avatarCircle} />
        <View style={{ flex: 1 }}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <View style={styles.postUserRow}>
            <Text style={styles.postUser}>{post.username}</Text>
            <Text style={styles.postDate}>{post.date}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.postBody}>{post.body}</Text>

      {post.imageUri ? (
        <Image source={{ uri: post.imageUri }} style={styles.imagePlaceholder} resizeMode="cover" />
      ) : post.hasImagePlaceholder ? (
        <View style={styles.imagePlaceholder} />
      ) : null}

      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn}>
          <Feather name="heart" size={18} color={colors.text} />
          <Text style={styles.actionText}>Like</Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Feather name="bookmark" size={18} color={colors.text} />
          <Text style={styles.actionText}>Save</Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Feather name="message-circle" size={18} color={colors.text} />
          <Text style={styles.actionText}>Reply</Text>
        </Pressable>
      </View>
    </View>
  );

  const bubbleLeftForDepth = (depth: number) =>
    10 + depth * 12;

  const renderCommentBranch = (node: Comment, depth: number): React.ReactNode => { //The 3's here represent the max comment chains before prompting "see more"
    const children = node.children || [];
    const hasDeepChildren = depth >= 3 && children.length > 0;
    const isExpanded = !!expanded[node.id];
    const showChildren =
      depth < 3 || (depth >= 3 && isExpanded);

    return (
      <View key={node.id} style={styles.commentWrap}>
        <View style={[styles.commentBubble, { marginLeft: bubbleLeftForDepth(depth) }]}>
          <View style={styles.commentHeaderRow}>
            <View style={styles.commentAvatarInline} />
            <View style={styles.commentHeaderText}>
              <Text style={styles.commentUser} numberOfLines={1}>
                {node.username}
              </Text>
              <Text style={styles.commentDate}>{node.date}</Text>
            </View>
          </View>

          <Text style={styles.commentText}>{node.text}</Text>

          <View style={styles.commentActions}>
            <Pressable style={styles.smallAction}>
              <Feather name="heart" size={14} color={colors.text} />
              <Text style={styles.smallIconText}>Like</Text>
            </Pressable>
            <Pressable style={styles.smallAction}>
              <Feather name="message-circle" size={14} color={colors.text} />
              <Text style={styles.smallIconText}>Reply</Text>
            </Pressable>
          </View>
        </View>

        {showChildren &&
          children.map((child) => renderCommentBranch(child, depth + 1))}

        {hasDeepChildren && !isExpanded && (
          <Pressable
            onPress={() => toggleExpanded(node.id)}
            style={[styles.seeMoreChip, { marginLeft: bubbleLeftForDepth(depth) }]}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              See more replies
            </Text>
          </Pressable>
        )}
        {hasDeepChildren && isExpanded && (
          <Pressable
            onPress={() => toggleExpanded(node.id)}
            style={[styles.seeMoreChip, { marginLeft: bubbleLeftForDepth(depth) }]}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              Hide replies
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Pressable style={styles.backFab} onPress={() => router.back()}>
        <Feather name="chevron-left" size={22} color={colors.text} />
      </Pressable>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <PostCard />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Replies</Text>
            </View>
          </>
        }
        renderItem={({ item }) => <>{renderCommentBranch(item, 0)}</>}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
