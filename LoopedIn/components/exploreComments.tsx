import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import API_URL from "@/utils/config";
import { Storage } from "@/utils/storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, View, Text, FlatList, Pressable, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ExploreCommentsProps = {
  isVisible: boolean;
  onClose: () => void;
  currentPost: number; // FIXME: update the following 3 values once explore page implementation is merged
  postCreator: number;
};

type Comment = {
  id: string,
  commenterid: string,
  profilepic: string | null,
  username: string,
  dateposted: string,
  body: string
}

type userInfo = {
  username: string,
  profilepic: string | null,
}

// FIXME: right now the current post is hard coded to = 3 (update once explore posts are implemented)
const ExploreCommentsModal = ({
  isVisible,
  onClose,
  currentPost,
  postCreator,
}: ExploreCommentsProps) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets(); 
  const [displayCheckDelete, setDisplayCheckDelete] = useState(false);
  const [commentValue, setCommentValue] = useState('');
  const lastTimeStamp = useRef<string | null>(null);
  const lastPostID = useRef<number | null>(null);
  const [Comments, setComments] = useState<Comment[]>([]);
  const hasMore = useRef<true | false>(true);
  const loadingMore = useRef<true | false>(false);
  const currentUser = useRef<string | null>(null);
  const currentUserInfo = useRef<userInfo | null>(null);
  const commentIDToDelete = useRef<number | null>(null);

  useEffect (() => {
    //FIXME: need to fetch the current user from backend - IDK if there is a way to get it just on front-end?? - JK that looks complicated lol
    if (isVisible){
      console.log("I will need to fetch the current user here");
      fetchComments();
    } else {
      setComments([]);
      hasMore.current = true;
      lastTimeStamp.current = null;
      lastPostID.current = null;
      setCommentValue('');
    }
  }, [isVisible])

  useEffect(() => {
    if (currentUser.current === null && currentUserInfo.current === null){
      fetchUserInfo();
    }
  }, [])

  const fetchUserInfo = async () => {
    console.log("Going to fetch the user information")
    const token = await Storage.getItem("token");

    try {
      console.log("Right before fetching user info")
      const res = await fetch(
        `${API_URL}/api/get-user-info`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );
  
      if (!res.ok){
        alert("Error when fetching user information");
        return;
      }

      const responseData = await res.json();
      console.log("This is the response data", responseData.currentUserID);

      currentUserInfo.current = (responseData.currentUserInfo[0]);
      currentUser.current = (responseData.currentUserID);

      console.log("The current user id number is: ", currentUser.current);
      console.log("The current user info is: ", currentUserInfo.current);
    } catch (e) {
      console.log("Error when getting the current user");
    }
  }

  const fetchComments = async () => {
    console.log("Going to fetch comments");
    const token = await Storage.getItem("token");
    if (loadingMore.current || !hasMore.current) {
      return;
    }

    loadingMore.current = true;

    try {

      const includeLastTimeStamp = lastTimeStamp.current ? `&lastTimestamp=${lastTimeStamp.current}`: "";
      const includeLastPostID = lastPostID.current ? `&lastPostID=${lastPostID.current}`: "";

      console.log("Right before the fetch")
      const res = await fetch(
        `${API_URL}/api/get-post-comments?postID=${currentPost}${includeLastPostID}${includeLastTimeStamp}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!res.ok){
        alert("Error when fetching post comments");
        return;
      }

      const responseData = await res.json();
      const tempArray: Comment[] = responseData.newComments;

      console.log("The comments being added to the array are: ", tempArray);

      setComments((prev) => [...prev, ...tempArray]);
      hasMore.current = (responseData.hasMore);
      lastTimeStamp.current = tempArray[tempArray.length - 1].dateposted;
      lastPostID.current = Number(tempArray[tempArray.length - 1].id);
    } catch (e) {
      console.log("Error when fetching comments", e);
      alert("Could not fetch comments");
    } finally {
      loadingMore.current = false;
    }
  }

  const handleCloseComments = () => {
    onClose();
  }

  const checkDeleteComment = (commentToDelete: string) => {
    commentIDToDelete.current = Number(commentToDelete);
    console.log("Need to make sure they want to delete");
    if (displayCheckDelete === false){
        setDisplayCheckDelete(true);
    }
  }

  const handleDeleteComment = async () => {
    console.log("Delete the comment with id, ", commentIDToDelete.current);
    const token = await Storage.getItem("token");
    try {
        //FIXME: Delete comment from backend
        const response = await fetch(`${API_URL}/api/delete-post-comment`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({CommentID: commentIDToDelete.current}),
        });

        if (!response.ok) {
          alert("Error while deleting the forum comment. Try again later.");
          return;
        }

        console.log("Done deleting the comment!!");
        const removeComment: Comment[] = Comments.filter(comment => Number(comment.id) !== commentIDToDelete.current);
        setComments(removeComment);

    } catch (e) {
        console.log("Error when deleting explore comment ", e);
    } finally {
        setDisplayCheckDelete(false);
        commentIDToDelete.current = null;
    }
  }

  const postComment = async (commentToPost: string) => {
    console.log("This is the comment to post: ", commentToPost);
    const token = await Storage.getItem("token");

    if (commentToPost.trim().length === 0){
      alert("Cannot add that comment due to no text entered");
      return;
    }

    const tempID = Number(Comments[0].id) - 1;
    const tempDate = new Date();

    if (!currentUser.current || !currentUserInfo.current){
      console.log("Could not find current user id to add comment")
      return;
    }

    const tempAddComment:Comment = {
      id: String(tempID),
      commenterid: currentUser.current,
      profilepic: currentUserInfo.current.profilepic,
      username: currentUserInfo.current.username,
      dateposted: String(tempDate),
      body: commentToPost,
    }

    setComments([tempAddComment, ...Comments])

    setCommentValue('');
    Keyboard.dismiss();

    try {
      const commentData = {
        postID: currentPost,
        content: commentToPost
      }

      const response = await fetch(`${API_URL}/api/add-post-comment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        credentials: "include",
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        alert("Could not create that post comment :( ");
        return;
      }

      console.log("Created the comment yayayayayaya!!!")

    } catch (e) {
        console.log("Error when trying to post the comment", e)
    }
  }
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    commentsHeading: {
      color: colors.text,
      paddingTop: 0,
      fontSize: 24,
      fontWeight: "600",
      marginBottom: 20,
    },
    commentsContainer: {
      height: "85%",
      backgroundColor: colors.background,
      width: "85%",
      marginTop: insets.top,
      borderRadius: 20,
      alignItems: "center",
      flexDirection: "column",
    },
    replyContainer: {
      backgroundColor: "white",
      marginBottom: 20,
      alignSelf: "center",
      padding: 15,
      borderRadius: 20,
      borderColor: colors.decorativeBackground,
      borderWidth: 1,
      flexGrow: 1,
      marginLeft: 10,
    },
    individualCommentContainer: {
      flexDirection: "column",
      alignSelf: "center",
      width: "90%",
      justifyContent: "space-between",
      padding: 5,
      marginVertical: 5,
    },
    profilePicture: {
      backgroundColor: "white",
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    userInfo: {
      flexDirection: "column",
      marginLeft: 5,
    },
    userInfoHeader: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    topComments: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    commentContent: {
        marginLeft: 20,
        marginTop: 5,
    }
  });

  const renderCommentHeader = (item: Comment) => (
    <View style={styles.individualCommentContainer}>
      <View style={styles.topComments}>
        <View style={styles.userInfoHeader}>
          <View style={styles.profilePicture} />
          <View style={styles.userInfo}>
            <Text style={{ color: colors.text }}>{item.username}</Text>
            <Text style={{ color: colors.text, marginLeft: 5 }}>
              {new Date(item.dateposted).toDateString()}
            </Text>
          </View>
        </View>
        {currentUser.current === item.commenterid? (
            <Pressable onPress={() => checkDeleteComment(item.id)}>
                <Ionicons name="trash-outline" size={24} color={colors.text} />
            </Pressable>
        ) : (
            null
        )}
        
      </View>
      <View style={styles.commentContent}>
        <Text>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      transparent={true}
      animationType="none"
    >
      {/* <View style={styles.container}> */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.commentsContainer}>
                    <View style={{flexDirection: "row", justifyContent: "flex-end", width: "100%"}}>
                        <Pressable onPress={handleCloseComments}>
                            <Text style={{marginRight: 25, marginTop: 15, fontSize: 22 }}>
                                X
                            </Text>
                        </Pressable>
                    </View>
                    <Text style={styles.commentsHeading}>Comments</Text>
                <View style={{ flex: 1, width: "100%" }}>
                    <FlatList 
                        data={Comments}
                        renderItem={({item}) => renderCommentHeader(item)}
                        keyExtractor={item => item.id}
                        onEndReached={fetchComments}
                        onEndReachedThreshold={0.5}
                        ListEmptyComponent={
                            (
                                <View style={{alignItems: "center", justifyContent: "center"}}>
                                    <Text style={{color: colors.text}}> There are no comments to display </Text>
                                </View>
                            )
                        }
                    />
                    </View>
                <View style={{flexDirection: "row", justifyContent: "space-between", width: "100%", alignItems: "center"}}>
                    <View style={styles.replyContainer}>
                        <TextInput placeholder="Reply here" placeholderTextColor={colors.text} style={{color: colors.text}} value={commentValue} onChangeText={setCommentValue} multiline={true}/>
                    </View>
                    <Pressable onPress={() => postComment(commentValue)} style={{marginBottom: 20, marginLeft: 5, marginRight: 5}}>
                        <MaterialCommunityIcons name="send-circle-outline" size={40} color={colors.decorativeBackground}/>
                    </Pressable>
                </View>

                </View>
            </TouchableWithoutFeedback>

            <Modal visible={displayCheckDelete} onRequestClose={() => setDisplayCheckDelete(false)} transparent={true} animationType="none">
                        <View style={{flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",}}>
                            <View style={{backgroundColor: colors.background, padding: 20, borderRadius: 20, alignItems: "center"}}>
                                <Text style={{color: colors.text, fontSize: 18, paddingBottom: 15}}> Are you sure you want to delete? </Text>
                                <View style={{flexDirection: "row", gap: 25, alignItems: "center"}}>
                                    <Pressable onPress={handleDeleteComment} style={{backgroundColor: colors.exploreCardBackground, padding: 10, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: colors.decorativeBackground}}>
                                        <Text style={{color: colors.text, fontSize: 16, padding: 5}}> Yes </Text>
                                    </Pressable>
                                    <Pressable onPress={() => {setDisplayCheckDelete(false); commentIDToDelete.current = null}} style={{backgroundColor: colors.exploreCardBackground, padding: 10, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: colors.decorativeBackground}}>
                                        <Text style={{color: colors.text, fontSize: 16, padding: 5}}> Cancel </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
            </Modal>

        </KeyboardAvoidingView>
      {/* </View> */}
    </Modal>
  );
};

export default ExploreCommentsModal;
