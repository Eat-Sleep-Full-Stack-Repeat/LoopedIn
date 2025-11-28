import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, View, Text, FlatList, Pressable, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ExploreCommentsProps = {
  isVisible: boolean;
  onClose: () => void;
  currentPost: number;
};

// FIXME: right now the current post is hard coded to = 3 (update once explore posts are implemented)
const ExploreCommentsModal = ({
  isVisible,
  onClose,
  currentPost,
}: ExploreCommentsProps) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<number | null>(null); 
  const [displayCheckDelete, setDisplayCheckDelete] = useState(false);
  const [commentValue, setCommentValue] = useState('');

  type Comment = {
    id: string,
    commenterid: number,
    profilePic: string | null,
    username: string,
    datePosted: string,
    content: string
  }

  const Comments: Comment[] = [
    {
      id: "1",
      commenterid: 54,
      profilePic: null,
      username: "helloWorld",
      datePosted: "a temp date",
      content: "Testing out the comments",
    },
    {
      id: "2",
      commenterid: 13,
      profilePic: null,
      username: "SnoopyReallyIsTheBest",
      datePosted: "a temp date",
      content:
        "I am going to type out a really long comment to see what it will render like on the front-end to make sure everything is ok!!! Yippeee!!!! Wow this post is absolutely fantastic!! I can't believe you did all of that!!",
    },
  ];

  useEffect (() => {
    //FIXME: need to fetch the current user from backend - IDK if there is a way to get it just on front-end?? - JK that looks complicated lol
    console.log("I will need to fetch the current user here");
    setCurrentUser(54);
  }, [])

  const handleCloseComments = () => {
    onClose();
  }

  const checkDeleteComment = () => {
    console.log("Need to make sure they want to delete");
    if (displayCheckDelete === false){
        setDisplayCheckDelete(true);
    }
  }

  const handleDeleteComment = () => {
    console.log("Delete the comment")
    try {
        //FIXME: Delete comment from backend
    } catch (e) {
        console.log("Error when deleting explore comment ", e);
    } finally {
        setDisplayCheckDelete(false);
    }
  }

  const postComment = (commentToPost: string) => {
    console.log("This is the comment to post: ", commentToPost);
    try {
        //FIXME: actually add the comment to the backend
    } catch (e) {
        console.log("Error when trying to post the comment", e)
    } finally {
        setCommentValue('');
        Keyboard.dismiss();
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
              {item.datePosted}
            </Text>
          </View>
        </View>
        {currentUser === item.commenterid? (
            <Pressable onPress={checkDeleteComment}>
                <Ionicons name="trash-outline" size={24} color={colors.text} />
            </Pressable>
        ) : (
            null
        )}
        
      </View>
      <View style={styles.commentContent}>
        <Text>{item.content}</Text>
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
                        bounces={false}
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
                        <TextInput placeholder="Reply here" placeholderTextColor={colors.text} style={{color: colors.text}} value={commentValue} onChangeText={setCommentValue}/>
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
                                    <Pressable onPress={() => setDisplayCheckDelete(false)} style={{backgroundColor: colors.exploreCardBackground, padding: 10, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: colors.decorativeBackground}}>
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
