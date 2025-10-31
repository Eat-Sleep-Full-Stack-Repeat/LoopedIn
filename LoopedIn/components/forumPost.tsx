import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { StyleSheet, View, Image, Text, Pressable, Dimensions } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";

type ForumPost = {
  id: string;
  title: string;
  username: string;
  content: string;
  datePosted: string;
  profilePic: string | null;
};

type ForumPostViewProps = {
  postInfo: ForumPost;
};

const ForumPostView = ({ postInfo }: ForumPostViewProps) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  let avatarSize;

  if (Dimensions.get("window").width >= 768) {
    avatarSize = 120;
  } else {
    avatarSize = 100;
  }

  const styles = StyleSheet.create({
    forumPost: {
      flexDirection: "column",
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.topBackground,
      borderRadius: 15,
      width: Dimensions.get("window").width - 40,
    },
    forumTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
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
  });

  return (
    <View style={styles.forumPost}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingTop: 5,
        }}
      >
        <View style={styles.topForumPost}>
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
          
          <View>
            <Text
              style={styles.forumTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {postInfo.title}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ color: colors.text }}
            >
              {postInfo.username}
            </Text>
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
      <View style={styles.postDate}>
        <Text style={{ color: colors.text }}>
          {new Date(postInfo.datePosted).toDateString()}
        </Text>
      </View>
    </View>
  );
};

export default ForumPostView;
