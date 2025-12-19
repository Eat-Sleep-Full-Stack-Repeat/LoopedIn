import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { StyleSheet, View, Image, Text, Pressable, Dimensions, useWindowDimensions } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";

type ForumPost = {
  id: string;
  title: string;
  username: string;
  content: string;
  datePosted: string;
  profilePic: string | null;
  userID: string;
};

type ForumPostViewProps = {
  postInfo: ForumPost;
};

const ForumPostView = ({ postInfo }: ForumPostViewProps) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const {width} = useWindowDimensions();

  let avatarSize;
  const staticTags = ["cozy", "crochet", "blanket", "money", "daily"];

  if (width >= 768) {
    avatarSize = 120;
  } else {
    avatarSize = 100;
  }

  const forumPressed = () => {
    if (postInfo) {
      router.push({pathname: "/singleForum/[id]", params: { id: postInfo.id.toString()}});
    } else {
      console.log("tried to pass an empty post :(");
    }
  }

  const profilePress = () => {
    //fixed -> added clickable post user image
    if (postInfo) {
      router.push({pathname: "/userProfile/[id]", params: { id:  postInfo.userID}});
    }
    else {
      console.log("tried to pass an empty post :(");
    }
  }

  const styles = StyleSheet.create({
    forumPost: {
      flexDirection: "column",
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.topBackground,
      borderRadius: 15,
      width: width - 40,
    },
    forumTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      flexShrink: 1, 
    },
    topForumPost: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    forumContent: {
      marginHorizontal: 20,
      marginBottom: 10,
      flex: 1,
      paddingTop: 5,
    },
    postDate: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "flex-end",
    },
    allTagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 2,
    },
    individualTag: {
      padding: 5,
      backgroundColor: colors.decorativeBackground,
      borderRadius: 20,
      margin: 2,
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 6,
    },
    tagChip: {
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
      backgroundColor: colors.topBackground,
    },
    tagText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
  });

  return (
    <Pressable onPress={forumPressed}>
      <View style={styles.forumPost}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 5,
          }}
        >
          <View style={styles.topForumPost}>
            <Pressable onPress={profilePress}>
              {postInfo.profilePic ? (
                <Image source={{ uri: postInfo.profilePic}} style={{ width: avatarSize/2, height: avatarSize/2, borderRadius: avatarSize / 2, backgroundColor: colors.boxBackground }}/>
              ):(
              <View>
                <Image
                source={require("@/assets/images/icons8-cat-profile-50.png")}
                style={{ width: avatarSize/2, height: avatarSize/2, borderRadius: avatarSize / 2 }}
              />
              </View>
              )}
            </Pressable>
            
            <View style={{ flexShrink: 1, maxWidth: '85%'}}>
              <Text
                style={styles.forumTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {postInfo.title}
              </Text>
              <Pressable onPress={profilePress}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ color: colors.text }}
                >
                  {postInfo.username}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.forumContent}>
          <Text
            ellipsizeMode="tail"
            numberOfLines={2}
            style={{ color: colors.text }}
          >
            {postInfo.content}
          </Text>
        </View>
        {!!staticTags.length && (
          <View style={styles.tagRow}>
            {staticTags.map((tag) => (
              <View key={`${postInfo.id}-${tag}`} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.postDate}>
          <Text style={{ color: colors.text }}>
            {new Date(postInfo.datePosted).toDateString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default ForumPostView;
