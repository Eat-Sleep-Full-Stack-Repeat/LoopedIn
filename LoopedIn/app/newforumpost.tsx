import { useState } from "react";
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
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import API_URL from "@/utils/config";
import { Storage } from "../utils/storage";
import { useAppSize } from "@/Hooks/useSize";

type CraftOption = {
  id: string;
  label: string;
  icon?: ImageSourcePropType;
};

const craftOptions: CraftOption[] = [
  {
    id: "Crochet",
    label: "Crochet",
    icon: require("../assets/images/chrocheticon.png"),
  },
  {
    id: "Knit",
    label: "Knit",
    icon: require("../assets/images/kniticon.png"),
  },
  {
    id: "Misc",
    label: "Misc",
    icon: require("../assets/images/paw-icon.png"),
  },
];

export default function Newformpost() {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>("Crochet");
  const [postTitle, setPostTitle] = useState<string>("");
  const [postContent, setPostContent] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const [pressed, setPressed] = useState<boolean>(false);
  const [createdForumPostId, setCreatedForumPostId] = useState<string | null>(
    null
  );
  const [showMissingFieldsOverlay, setShowMissingFieldsOverlay] =
    useState(false);

  const size = useAppSize();

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed || tags.includes(trimmed) || tags.length >= 5) {
      return;
    }
    if (
      trimmed == "knit" ||
      trimmed == "crochet" ||
      trimmed == "misc" ||
      trimmed == "miscellaneous"
    ) {
      console.log("crochet or knit tag found.");
      alert("You cannot have Knit, Crochet, or Misc tags in your post!");
      setNewTag("");
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleCreatePost = async () => {
    // if already pressed
    if (pressed) {
      return;
    }

    //otherwise, disable button
    setPressed(true);

    console.log("Create Post pressed", {
      selectedFilter,
      postTitle,
      postContent,
      tags,
    });

    //make body payload variable so i can send it
    const body_payload = {
      filter: selectedFilter,
      title: postTitle,
      content: postContent,
      tags: tags,
    };

    if (postTitle.length == 0 || postContent.length == 0) {
      setShowMissingFieldsOverlay(true);
      setPressed(false);
      return;
    }
    if (postTitle.length > 150) {
      alert("Your forum's title cannot have more than 150 charceters.");
      setPressed(false);
      return;
    }
    if (postContent.length > 10000) {
      alert("Your forum's body cannot have more than 10,000 charceters.");
      setPressed(false);
      return;
    }

    //token
    const token = await Storage.getItem("token");

    //FIXME: add images + send them (if exist) to backend
    //right now, I just have my payload data
    let formData = new FormData();
    formData.append("data", JSON.stringify(body_payload));

    try {
      const response = await fetch(`${API_URL}/api/forum/forum-post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        alert("Whomp whomp. Could not create post. Try again later.");
        setPressed(false);
        return;
      }

      const data = await response.json();
      const newPostId = String(data?.postId ?? "");

      console.log("Post created successfully!");
      if (!newPostId) {
        router.replace("/userProfile");
        return;
      }

      setCreatedForumPostId(newPostId);
    } catch (error) {
      console.log("Error creating post: ", error);
      alert("Could not create forum post. Please try again later.");
      setPressed(false);
    }
  };

  const handleViewNewForumPost = () => {
    if (!createdForumPostId) return;

    router.replace({
      pathname: "/singleForum/[id]",
      params: { id: createdForumPostId },
    });
  };

  const handleGoToProfile = () => {
    router.replace("/forumFeed");
  };

  const handleMissingFieldsConfirm = () => {
    setShowMissingFieldsOverlay(false);
  };

  const styles = StyleSheet.create({
    keyboardAvoider: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingHorizontal: 20,
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
      marginBottom: 20,
    },
    backButton: {
      position: "absolute",
      left: 0,
    },
    backArrow: {
      fontSize: size.font.largeTitleText,
      color: colors.text,
    },
    formSection: {
      marginBottom: 20,
    },
    title: {
      color: colors.text,
      fontSize: size.font.largeTitleText,
      fontWeight: size.weight.title,
      textAlign: "center",
    },
    refineSection: {
      marginBottom: 15,
    },
    sectionLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    sectionLabel: {
      color: colors.text,
      fontWeight: size.weight.title,
      fontSize: size.font.button,
    },
    characterCounter: {
      color: `${colors.text}99`,
      fontSize: size.font.detailText,
    },
    input: {
      backgroundColor: colors.boxBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.topBackground,
      color: colors.text,
      fontSize: size.font.bodyText,
    },
    contentInput: {
      minHeight: 130,
      textAlignVertical: "top",
    },
    mediaSection: {
      marginBottom: 25,
    },
    mediaBlockRow: {
      flexDirection: "row",
      gap: 16,
    },
    mediaBlock: {
      flex: 1,
      backgroundColor: colors.topBackground,
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.topBackground,
    },
    tagSection: {
      marginBottom: 32,
    },
    tagList: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 16,
    },
    tagChip: {
      backgroundColor: colors.secondaryButton,
      borderRadius: 50,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 12,
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
    },
    tagChipText: {
      color: colors.text,
      fontWeight: size.weight.title,
    },
    tagInputRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    tagInput: {
      flex: 1,
      backgroundColor: colors.boxBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.topBackground,
      color: colors.text,
      fontSize: size.font.bodyText,
    },
    addTagButton: {
      width: size.iconSize + 30,
      height: size.iconSize + 30,
      borderRadius: 26,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.secondaryButton,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
      marginLeft: 12,
    },
    addTagButtonDisabled: {
      opacity: 0.4,
    },
    addTagIcon: {
      color: colors.decorativeBackground,
    },
    createButton: {
      backgroundColor: colors.decorativeBackground,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    createButtonText: {
      color: colors.antiText,
      fontSize: size.font.button,
      fontWeight: size.weight.largeTitle,
    },
    refineHeaderText: {
      color: colors.text,
      fontWeight: size.weight.title,
      fontSize: size.font.button,
      marginBottom: 16,
    },
    craftFilters: {
      flexDirection: "row",
      gap: 24,
    },
    craftOption: {
      alignItems: "center",
      gap: 12,
    },
    craftIconWrapper: {
      width: size.iconSize + 24,
      height: size.iconSize + 24,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.secondaryButton,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
      overflow: "hidden",
    },
    craftIconWrapperSelected: {
      backgroundColor: colors.decorativeBackground,
      borderColor: colors.decorativeBackground,
    },
    craftIconImage: {
      width: size.iconSize + 10,
      height: size.iconSize + 10,
      tintColor: colors.antiText,
    },
    craftIconLabel: {
      color: colors.text,
      fontSize: size.font.caption,
      fontWeight: size.weight.headline,
    },
    craftIconLabelSelected: {
      color: colors.decorativeText,
    },
    successBackdrop: {
      alignItems: "center",
      bottom: 0,
      justifyContent: "center",
      left: 0,
      padding: 24,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 999,
    },
    successCard: {
      borderRadius: 24,
      borderWidth: 1,
      maxWidth: 420,
      paddingHorizontal: 24,
      paddingVertical: 28,
      width: "100%",
    },
    successTitle: {
      fontSize: size.font.titleText,
      fontWeight: size.weight.largeTitle,
      marginBottom: 12,
      textAlign: "center",
    },
    successDescription: {
      fontSize: size.font.button,
      lineHeight: 24,
      marginBottom: 20,
      textAlign: "center",
    },
    successButtonRow: {
      flexDirection: "row",
      gap: 12,
    },
    successButton: {
      alignItems: "center",
      borderRadius: 999,
      flex: 1,
      paddingHorizontal: 18,
      paddingVertical: 14,
    },
    successButtonText: {
      fontSize: size.font.button,
      fontWeight: size.weight.largeTitle,
    },
    singleOverlayButton: {
      alignItems: "center",
      borderRadius: 999,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: 18,
      paddingVertical: 14,
      width: "100%",
    },
  });

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardAvoider, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessible={true}
            accessibilityLabel={"Go Back"}
            accessibilityHint={"Navigates back to the previous page."}
            accessibilityRole={"button"}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text
            style={styles.title}
            accessible={true}
            accessibilityRole={"header"}
          >
            New Forum Post
          </Text>
        </View>

        <View style={styles.refineSection}>
          <Text style={styles.refineHeaderText}>Associated Craft</Text>
          <View style={styles.craftFilters}>
            {craftOptions.map((option) => {
              const isSelected = option.id === selectedFilter;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedFilter(option.id)}
                  style={styles.craftOption}
                  accessible={true}
                  accessibilityHint={
                    "Selects " + option.label + " as explore post craft type."
                  }
                  accessibilityRole={"button"}
                  accessibilityState={
                    selectedFilter === option.id
                      ? { selected: true }
                      : { selected: false }
                  }
                >
                  <View
                    style={[
                      styles.craftIconWrapper,
                      isSelected && styles.craftIconWrapperSelected,
                    ]}
                  >
                    <Image
                      source={option.icon}
                      style={[
                        styles.craftIconImage,
                        !isSelected && {
                          tintColor: colors.secondaryText,
                        },
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={[
                      styles.craftIconLabel,
                      isSelected && styles.craftIconLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Title</Text>
            <Text
              style={styles.characterCounter}
              accessible={true}
              accessibilityLabel={`${postTitle.length} out of 150 characters are used.`}
            >{`${postTitle.length}/150`}</Text>
          </View>
          <TextInput
            value={postTitle}
            onChangeText={setPostTitle}
            placeholder="Enter a title"
            placeholderTextColor={`${colors.text}99`}
            maxLength={150}
            style={styles.input}
          />
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Content</Text>
            <Text
              style={styles.characterCounter}
              accessible={true}
              accessibilityLabel={`${postContent.length} out of 10000 characters are used.`}
            >{`${postContent.length}/10000`}</Text>
          </View>
          <TextInput
            value={postContent}
            onChangeText={setPostContent}
            placeholder="Share the details..."
            placeholderTextColor={`${colors.text}99`}
            multiline
            maxLength={10000}
            style={[styles.input, styles.contentInput]}
          />
        </View>

        <View style={[styles.formSection, styles.tagSection]}>
          <Text style={styles.sectionLabel}>Tag (Up to 5)</Text>
          <View style={styles.tagList}>
            {tags.map((tag) => (
              <Pressable
                key={tag}
                style={styles.tagChip}
                onPress={() => handleRemoveTag(tag)}
                accessible={true}
                accessibilityLabel={"Remove tag"}
                accessibilityHint={"Double tap to remove " + tag}
              >
                <Text style={styles.tagChipText}>#{tag}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.tagInputRow}>
            <TextInput
              value={newTag}
              onChangeText={(text) =>
                setNewTag(text.replace(/\s/g, "").toLowerCase())
              }
              placeholder="Add a tag"
              placeholderTextColor={`${colors.text}99`}
              style={styles.tagInput}
            />
            <Pressable
              style={[
                styles.addTagButton,
                (tags.length >= 5 || !newTag.trim()) &&
                  styles.addTagButtonDisabled,
              ]}
              onPress={handleAddTag}
              disabled={tags.length >= 5 || !newTag.trim()}
              accessible={true}
              accessibilityLabel={"Add Tag"}
              accessibilityHint={
                tags.length >= 5 || !newTag.trim()
                  ? "Cannot add more tags. Ensure tag text field is filled out, and number of tags is under 5."
                  : "Double tap to add tag"
              }
            >
              <Feather
                name="plus"
                size={size.iconSize + 8}
                style={[
                  styles.addTagIcon,
                  (tags.length >= 5 || !newTag.trim()) && {
                    color: colors.text,
                  },
                ]}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.createButton}
          onPress={handleCreatePost}
          disabled={pressed}
          accessible={true}
          accessibilityHint={"Post to forum feed."}
        >
          <Text style={styles.createButtonText}>Create Post</Text>
        </Pressable>
      </ScrollView>
      {createdForumPostId ? (
        <View
          style={[
            styles.successBackdrop,
            {
              backgroundColor: `${colors.background}E6`,
            },
          ]}
        >
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: colors.boxBackground,
                borderColor: colors.blockedBackground,
              },
            ]}
          >
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Your post is live!
            </Text>
            <Text
              style={[
                styles.successDescription,
                { color: colors.settingsText },
              ]}
            >
              Want to check it out?
            </Text>
            <View style={styles.successButtonRow}>
              <Pressable
                onPress={handleViewNewForumPost}
                style={[
                  styles.successButton,
                  { backgroundColor: colors.activeContainer },
                ]}
              >
                <Text
                  style={[
                    styles.successButtonText,
                    { color: colors.background },
                  ]}
                >
                  Yes
                </Text>
              </Pressable>
              <Pressable
                onPress={handleGoToProfile}
                style={[
                  styles.successButton,
                  { backgroundColor: colors.disabledButton },
                ]}
              >
                <Text
                  style={[
                    styles.successButtonText,
                    { color: colors.disabledButtonText },
                  ]}
                >
                  No
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      {showMissingFieldsOverlay ? (
        <View
          style={[
            styles.successBackdrop,
            {
              backgroundColor: `${colors.background}E6`,
            },
          ]}
        >
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: colors.boxBackground,
                borderColor: colors.blockedBackground,
              },
            ]}
          >
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Fields required
            </Text>
            <Text
              style={[
                styles.successDescription,
                { color: colors.settingsText },
              ]}
            >
              Oops! Something&apos;s missing
            </Text>
            <Pressable
              onPress={handleMissingFieldsConfirm}
              style={[
                styles.singleOverlayButton,
                { backgroundColor: colors.activeContainer },
              ]}
            >
              <Text
                style={[styles.successButtonText, { color: colors.background }]}
              >
                Ok
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
