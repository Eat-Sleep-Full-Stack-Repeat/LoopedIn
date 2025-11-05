import { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
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
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

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
];

export default function NewPost() {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const [selectedCraft, setSelectedCraft] = useState<string>("Crochet");
  const CAPTION_LIMIT = 150;
  const ALT_TEXT_LIMIT = 10000;
  const [caption, setCaption] = useState<string>("");
  const [postText, setPostText] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const [postVisibility, setPostVisibility] = useState<"public" | "private">("public");

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed || tags.includes(trimmed) || tags.length >= 5) {
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleUploadPress = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Upload From Camera Roll", "Camera"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            console.log("Upload from camera roll selected");
          } else if (buttonIndex === 2) {
            console.log("Camera selected");
          }
        }
      );
    } else {
      Alert.alert("Upload Image", undefined, [
        {
          text: "Upload From Camera Roll",
          onPress: () => console.log("Upload from camera roll selected"),
        },
        {
          text: "Camera",
          onPress: () => console.log("Camera selected"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    }
  };

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
    uploadContainer: {
      alignItems: "center",
    },
    uploadBox: {
      width: 300,
      height: 300,
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: colors.decorativeBackground,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    uploadText: {
      color: colors.text,
      fontSize: 30,
    },
    refineSection: {
      marginTop: 20,
    },
    sectionLabel: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 16,
      marginBottom: 10,
      textAlign: "left",
    },
    craftFilters: {
      flexDirection: "row",
      gap: 20,
      alignItems: "flex-start",
      alignSelf: "flex-start",
    },
    craftOption: {
      alignItems: "center",
      gap: 12,
    },
    craftIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.topBackground,
      borderWidth: 2,
      borderColor: "transparent",
      overflow: "hidden",
    },
    craftIconWrapperSelected: {
      backgroundColor: colors.decorativeBackground,
      borderColor: colors.decorativeText,
    },
    craftIconImage: {
      width: 30,
      height: 30,
      tintColor: colors.decorativeText,
    },
    craftIconLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "500",
    },
    craftIconLabelSelected: {
      color: colors.decorativeText,
    },
    contentSpacer: {
      minHeight: 200,
    },
    formSection: {
      marginTop: 20,
    },
    inputHeaderRow: {
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
    counterText: {
      color: colors.text,
      fontSize: 12,
      opacity: 0.7,
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
    multilineInput: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    tagSection: {
      marginTop: 28,
    },
    tagList: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 16,
    },
    tagChip: {
      backgroundColor: colors.topBackground,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 12,
      marginTop: 10,
    },
    tagChipText: {
      color: colors.text,
      fontWeight: "600",
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
      fontSize: 16,
    },
    addTagButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.decorativeBackground,
      marginLeft: 12,
    },
    addTagButtonDisabled: {
      backgroundColor: `${colors.topBackground}88`,
    },
    addTagIcon: {
      color: colors.decorativeText,
    },
    postOptionsRow: {
      flexDirection: "row",
      gap: 16,
      marginTop: 32,
    },
    postOptionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.topBackground,
      backgroundColor: colors.boxBackground,
    },
    postOptionButtonSelected: {
      backgroundColor: colors.decorativeBackground,
      borderColor: colors.decorativeBackground,
    },
    postOptionIcon: {
      color: colors.text,
    },
    postOptionIconSelected: {
      color: colors.decorativeText,
    },
    postOptionText: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 16,
    },
    postOptionTextSelected: {
      color: colors.decorativeText,
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
          <Text style={styles.title}>New Post</Text>
        </View>

        <View style={styles.uploadContainer}>
          <Pressable style={styles.uploadBox} onPress={handleUploadPress}>
            <Text style={styles.uploadText}>Upload an Image</Text>
          </Pressable>
        </View>

        <View style={styles.refineSection}>
          <Text style={styles.sectionLabel}>Associated Craft</Text>
          <View style={styles.craftFilters}>
            {craftOptions.map((option) => {
              const isSelected = option.id === selectedCraft;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedCraft(option.id)}
                  style={styles.craftOption}
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
                        !isSelected && { tintColor: colors.text },
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
          <View style={styles.inputHeaderRow}>
            <Text style={styles.inputLabel}>Caption</Text>
            <Text style={styles.counterText}>
              {caption.length}/{CAPTION_LIMIT}
            </Text>
          </View>
          <TextInput
            value={caption}
            onChangeText={(text) => setCaption(text.slice(0, CAPTION_LIMIT))}
            placeholder="Add a caption"
            placeholderTextColor={`${colors.text}99`}
            style={styles.input}
            maxLength={CAPTION_LIMIT}
          />
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputHeaderRow}>
            <Text style={styles.inputLabel}>Alt Text</Text>
            <Text style={styles.counterText}>
              {postText.length}/{ALT_TEXT_LIMIT}
            </Text>
          </View>
          <TextInput
            value={postText}
            onChangeText={(text) => setPostText(text.slice(0, ALT_TEXT_LIMIT))}
            placeholder="Describe the image for accessibility..."
            placeholderTextColor={`${colors.text}99`}
            multiline
            style={[styles.input, styles.multilineInput]}
            maxLength={ALT_TEXT_LIMIT}
          />
        </View>

        <View style={styles.tagSection}>
          <Text style={[styles.inputLabel, { marginBottom: 10 }]}>Tags (Up to 5)</Text>
          <View style={styles.tagList}>
            {tags.map((tag) => (
              <Pressable key={tag} style={styles.tagChip} onPress={() => handleRemoveTag(tag)}>
                <Text style={styles.tagChipText}>#{tag}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.tagInputRow}>
            <TextInput
              value={newTag}
              onChangeText={(text) => setNewTag(text.replace(/\s/g, ""))}
              placeholder="Add a tag"
              placeholderTextColor={`${colors.text}99`}
              style={styles.tagInput}
            />
            <Pressable
              onPress={handleAddTag}
              disabled={tags.length >= 5 || !newTag.trim()}
              style={[
                styles.addTagButton,
                (tags.length >= 5 || !newTag.trim()) && styles.addTagButtonDisabled,
              ]}
            >
              <Feather
                name="plus"
                size={28}
                style={[
                  styles.addTagIcon,
                  (tags.length >= 5 || !newTag.trim()) && { color: colors.text },
                ]}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.postOptionsRow}>
          <Pressable
            style={[
              styles.postOptionButton,
              postVisibility === "public" && styles.postOptionButtonSelected,
            ]}
            onPress={() => setPostVisibility("public")}
          >
            <Feather
              name="globe"
              size={20}
              style={[
                styles.postOptionIcon,
                postVisibility === "public" && styles.postOptionIconSelected,
              ]}
            />
            <Text
              style={[
                styles.postOptionText,
                postVisibility === "public" && styles.postOptionTextSelected,
              ]}
            >
              Public Post
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.postOptionButton,
              postVisibility === "private" && styles.postOptionButtonSelected,
            ]}
            onPress={() => setPostVisibility("private")}
          >
            <Feather
              name="lock"
              size={20}
              style={[
                styles.postOptionIcon,
                postVisibility === "private" && styles.postOptionIconSelected,
              ]}
            />
            <Text
              style={[
                styles.postOptionText,
                postVisibility === "private" && styles.postOptionTextSelected,
              ]}
            >
              Private Post
            </Text>
          </Pressable>
        </View>

        <View style={styles.contentSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
