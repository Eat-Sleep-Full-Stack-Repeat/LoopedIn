import { useState, useEffect } from "react";
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import API_URL from "@/utils/config";
import { Storage } from "@/utils/storage";
import { useRouter, useLocalSearchParams } from "expo-router";

type CraftOption = {
  id: string;
  label: string;
  icon?: ImageSourcePropType;
};

type Attachment = {
  id: string;
  name: string;
  type: "image" | "file";
  thumbnail?: ImageSourcePropType;
};


type ForumPost = {
  id: string;
  header: string;
  body: string;
  picture: string;
  craftID: string;
  craftType: string;
};

const craftOptions: CraftOption[] = [
  {
    id: "Crochet",
    label: "Crochet",
    icon: require("@/assets/images/chrocheticon.png"),
  },
  {
    id: "Knit",
    label: "Knit",
    icon: require("@/assets/images/kniticon.png"),
  },
  {
    id: "Misc",
    label: "Misc",
    icon: require("@/assets/images/paw-icon.png"),
  },
];

export default function EditForum() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [postTitle, setPostTitle] = useState<string>("");
  const [postContent, setPostContent] = useState<string>("");
  const [lockedCraftId, setLockedCraftId] = useState<string | null>(null);
  const [attachments] = useState<Attachment[]>([]);

  const [forumData, setForumData] = useState<ForumPost | null>(null)

  //lock after saved changes
  const [savedChanges, setSavedChanges] = useState(false);
  const lockedCraft =
    craftOptions.find((option) => option.id === lockedCraftId) || null;


  const { id } = useLocalSearchParams();

  const fetchData = async () => {
    //check token
    const token = await Storage.getItem("token");

    //login check to reduce unnecessary fetches
    if (!token) {
      alert("Hold on there... you need to login first!")
      router.replace("/login")
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/forum/my-forum-posts/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      )

      //if editing post that doesn't exist or someone doesn't have access to edit
      if (response.status == 404) {
        alert("This forum post doesn't exist")
        return;
      }

      //expired token not taken away from storage or overall not allowed to access resource
      else if (response.status == 403) {
        alert("Hold on there... you need to login first!")
        router.replace("/login")
        return
      }

      else if (!response.ok) {
        alert("Server error occured. Please try again later.")
        router.back()
        return;
      }

      const responseData = await response.json();

      let tempPostData: ForumPost = {
        id: responseData.fld_post_pk,
        header: responseData.fld_header,
        body: responseData.fld_body,
        picture: responseData.fld_pic,
        craftID: responseData.fld_tags_pk,
        craftType: responseData.fld_tag_name
      }

      setForumData(tempPostData)
      setPostTitle(tempPostData.header)
      setPostContent(tempPostData.body)
      setLockedCraftId(tempPostData.craftType)
    
    }
    catch(error) {
      console.log("Error fetching posts: ", error)
      alert("Server error. Please try again later.")
      router.back()
    }
  }


  const editForum = async () => {
    //check token
    const token = await Storage.getItem("token");

    //login check to reduce unnecessary fetches
    if (!token) {
      alert("Hold on there... you need to login first!")
      router.replace("/login")
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/forum/forum_post/${id}`,
        {
          method: "PATCH",
          headers : {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            header: postTitle,
            body: postContent,
          }),
          credentials: "include",
        }
      )

      if (response.status === 403) {
        alert("Forbidden: You do not have permission to edit this post.")
        return
      }

      else if (!response.ok) {
        alert("Server error occured. Please try again later.")
        router.back()
        return
      }

      setSavedChanges(true)

      alert("Forum post successfully saved!")

    }
    catch(error) {
      alert("Server error. Please try again later.")
      console.log("Error editing post:", error)

    }
  }


  //saved changes button handler
  const saveChangedHandler = () => {
    setSavedChanges(true)
    //api endpoint call
    editForum()

    router.replace("/myposts")
  }


  useEffect(() => {
    fetchData()
    console.log("Edit forum data fetched")
  }, [id])

  const styles = StyleSheet.create({
    keyboardAvoider: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top + 24,
      paddingHorizontal: 24,
    },
    scrollContent: {
      paddingBottom: insets.bottom + 48,
    },
    header: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      marginBottom: 32,
    },
    backButton: {
      position: "absolute",
      left: 0,
    },
    backArrow: {
      fontSize: 30,
      color: colors.text,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
    },
    section: {
      marginBottom: 24,
    },
    sectionLabel: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 16,
      marginBottom: 12,
    },
    lockedCraftCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.topBackground,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.boxBackground,
    },
    craftIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.decorativeBackground,
    },
    craftIconImage: {
      width: 30,
      height: 30,
      tintColor: colors.decorativeText,
    },
    craftLabelColumn: {
      flex: 1,
    },
    craftLabel: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 15,
    },
    sectionLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    inputLabel: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 16,
    },
    characterCounter: {
      color: `${colors.text}99`,
      fontSize: 13,
    },
    input: {
      backgroundColor: colors.boxBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.topBackground,
      color: colors.text,
      fontSize: 16,
    },
    contentInput: {
      minHeight: 140,
      textAlignVertical: "top",
    },
    attachmentList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 8,
    },
    attachmentCard: {
      width: 120,
      backgroundColor: colors.topBackground,
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.boxBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    attachmentThumb: {
      width: 90,
      height: 70,
      borderRadius: 8,
      marginBottom: 6,
    },
    attachmentName: {
      color: colors.text,
      fontSize: 12,
      textAlign: "center",
    },
    saveButton: {
      backgroundColor: colors.decorativeBackground,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButtonText: {
      color: colors.decorativeText,
      fontSize: 18,
      fontWeight: "700",
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoider}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.title}>Edit Forum Post</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Associated Craft</Text>
          <View style={styles.lockedCraftCard}>
            {lockedCraft?.icon ? (
              <View style={styles.craftIconWrapper}>
                <Image
                  source={lockedCraft.icon}
                  style={styles.craftIconImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={[styles.craftIconWrapper, { opacity: 0.5 }]}>
                <Text style={{ color: colors.decorativeText }}>?</Text>
              </View>
            )}
            <View style={styles.craftLabelColumn}>
              <Text style={styles.craftLabel}>
                {lockedCraft?.label || "Loading craft..."}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.inputLabel}>Title</Text>
            <Text style={styles.characterCounter}>{`${postTitle.length}/150`}</Text>
          </View>
          <TextInput
            value={postTitle}
            onChangeText={setPostTitle}
            placeholder="Update the title"

            placeholderTextColor={`${colors.text}99`}
            maxLength={150}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.inputLabel}>Content</Text>
            <Text style={styles.characterCounter}>{`${postContent.length}/10000`}</Text>
          </View>
          <TextInput
            value={postContent}
            onChangeText={setPostContent}
            placeholder="Update the details..."
            placeholderTextColor={`${colors.text}99`}
            multiline
            maxLength={10000}
            style={[styles.input, styles.contentInput]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Attached Files</Text>
          {attachments.length ? (
            <View style={styles.attachmentList}>
              {attachments.map((file) => (
                <View key={file.id} style={styles.attachmentCard}>
                  {file.type === "image" && file.thumbnail ? (
                    <Image
                      source={file.thumbnail}
                      style={styles.attachmentThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.characterCounter}>File</Text>
                  )}
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {file.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.characterCounter}>No attachments added.</Text>
          )}
        </View>

        <Pressable style={styles.saveButton} disabled={savedChanges} onPress={saveChangedHandler}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
