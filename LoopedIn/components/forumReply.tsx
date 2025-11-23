import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image
} from "react-native";

type Comment = {
    id: string;
    username: string;
    date: string;
    text: string;
    profileuri: string | null;
    children?: Comment[];
  };
  
  type Post = {
    id: string;
    title: string;
    username: string;
    dateposted: string;
    content: string;
    profileuri: string | null;
    //hasImagePlaceholder?: boolean;
    imageuri?: string | null;
  };

type ForumReplyProps = {
  isVisible: boolean;
  onClose: () => void;
  onPostReply: (text: string) => void;
  replyPost: Comment | Post | null;
  postID?: string;
};

const ForumReplyModal = ({
  isVisible,
  onClose,
  onPostReply,
  replyPost,
  postID,
}: ForumReplyProps) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const [replyText, setReplyText] = useState("");

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    replyContainer: {
      backgroundColor: colors.topBackground,
      padding: 15,
      borderRadius: 10,
      flexDirection: "column",
      marginBottom: 20,
      marginHorizontal: 10,
      marginLeft: 22,
      marginTop: 10
    },
    postCard: {
        backgroundColor: colors.topBackground,
        marginHorizontal: 8,
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
      button: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 20
      },
      commentBubble: {
        backgroundColor: colors.topBackground,
        borderRadius: 12,
        padding: 10,
        alignSelf: "stretch",
        marginHorizontal: 8,
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



  });

  const handlePost = () => {
    console.log("Going to handle posting the text");
    if (replyText.trim().length === 0){
        console.log("User entered an empty reply (nothing to post)");
        setReplyText("");
        onClose();
        return;
    }
    onPostReply(replyText);
    setReplyText("");
    onClose();
  };

  const handleCancel = () => {
    setReplyText("");
    onClose();
  }

  {if (!replyPost){
    return;
  }}

  const isPost = (item: Comment | Post): item is Post => {
    return "content" in item;
  }

  const isComment = (item: Comment | Post): item is Comment => {
    return "text" in item;
  }

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* show the comment the user is replying to (or the main forum title) */}
        {isPost(replyPost) && (
            <View style={styles.postCard}>
                <View style={styles.postHeaderRow}>
                {replyPost.profileuri ? (
                        <Image source={{ uri: replyPost.profileuri}} style={styles.avatarCircle}/>
                    ):(
                    <View>
                        <Image
                        source={require("@/assets/images/icons8-cat-profile-50.png")}
                        style={styles.avatarCircle}
                    />
                    </View>
                    )}
                <View style={{ flex: 1 }}>
                    <Text style={styles.postTitle}>{replyPost.title}</Text>
                    <View style={styles.postUserRow}>
                    <Text style={styles.postUser}>{replyPost.username}</Text>
                    {replyPost.dateposted ? (
                        <Text style={styles.postDate}>{new Date(replyPost.dateposted).toDateString()}</Text>
                    ) : (
                        <Text style={styles.postDate}> Unknown Date</Text>
                    )}
                    </View>
                </View>
                </View>
                <Text style={styles.postBody}>{replyPost.content}</Text>
            </View>
        )}

        {isComment(replyPost) && (
            <View style={styles.commentBubble}>
              <View style={styles.commentHeaderRow}>
                {replyPost.profileuri ? (
                    <Image source={{ uri: replyPost.profileuri}} style={styles.commentAvatarInline}/>
                  ):(
                  <View>
                    <Image
                    source={require("@/assets/images/icons8-cat-profile-50.png")}
                    style={styles.commentAvatarInline}
                  />
                  </View>
                  )}
                <View style={styles.commentHeaderText}>
                  <Text style={styles.commentUser} numberOfLines={1}>
                    {replyPost.username}
                  </Text>
                  <Text style={styles.commentDate}>{new Date(replyPost.date).toDateString()}</Text>
                </View>
              </View>
    
              <Text style={styles.commentText}>{replyPost.text}</Text>
    
            </View>
        )}

        <View style={styles.replyContainer}>
          <TextInput
            style={{ color: colors.text, justifyContent: "flex-start", alignItems: "flex-start", marginBottom: 15 }}
            placeholder="Enter your reply here!"
            placeholderTextColor={colors.text}
            value={replyText}
            onChangeText={setReplyText}
            multiline={true}
            autoFocus={true}
          />
          <View style={{justifyContent: "flex-end", gap: 10, flexDirection: "row"}}>
            <Pressable onPress={handleCancel} style={styles.button}>
                <Text style={{color: colors.warning}}> Cancel </Text>
            </Pressable>
            <Pressable onPress={handlePost} style={styles.button}>
                <Text style={{color: "black"}}>Post →</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ForumReplyModal;
