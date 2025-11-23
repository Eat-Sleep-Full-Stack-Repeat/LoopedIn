import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
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

type EditReplyProps = {
  isVisible: boolean;
  onClose: () => void;
  onPostEditedReply: (text: string, commentID: string) => void;
  postToEdit: Comment | null;
  postID?: string;
};

const EditForumReplyModal = ({
  isVisible,
  onClose,
  onPostEditedReply,
  postToEdit,
}: EditReplyProps) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const [newReplyText, setNewReplyText] = useState("");

  useEffect (() => {
    console.log("Running the useEffect");
    if (!postToEdit){
        return;
    }
    setNewReplyText(postToEdit?.text);
  }, [postToEdit])

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

    {if (!postToEdit){
        return;
    }}

    if (newReplyText.trim().length === 0){
        console.log("User entered an empty reply (nothing new to post)");
        alert("Please enter text. If you no longer want this comment to be visible, please select delete")
        if (!postToEdit){
            return;
        }
        setNewReplyText(postToEdit?.text);
        onClose();
        return;
    }
    onPostEditedReply(newReplyText.trim(), postToEdit.id);
    setNewReplyText("");
    onClose();
  };

  const handleCancel = () => {
    if (!postToEdit){
        return;
    }
    setNewReplyText(postToEdit?.text);
    onClose();
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
        <View style={styles.replyContainer}>
          <TextInput
            style={{ color: colors.text, justifyContent: "flex-start", alignItems: "flex-start", marginBottom: 15 }}
            placeholder="Enter your reply here!"
            placeholderTextColor={colors.text}
            value={newReplyText}
            onChangeText={setNewReplyText}
            multiline={true}
            autoFocus={true}
          />
          <View style={{justifyContent: "flex-end", gap: 10, flexDirection: "row"}}>
            <Pressable onPress={handleCancel} style={styles.button}>
                <Text style={{color: colors.warning}}> Cancel </Text>
            </Pressable>
            <Pressable onPress={handlePost} style={styles.button}>
                <Text style={{color: colors.text}}>Post →</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditForumReplyModal;
