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

  const handleCreatePost = () => {
    console.log("Create Post pressed", {
      selectedFilter,
      postTitle,
      postContent,
      tags,
    });
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
    formSection: {
      marginBottom: 20,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
    },
    refineSection: {
      marginBottom: 15,
    },
    sectionLabel: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 16,
      marginBottom: 8,
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
    mediaIconCircle: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor: colors.decorativeBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    mediaIcon: {
      color: colors.decorativeText,
    },
    mediaBlockLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 12,
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
      backgroundColor: `${colors.topBackground}55`,
    },
    addTagIcon: {
      color: colors.decorativeText,
    },
    createButton: {
      backgroundColor: colors.decorativeBackground,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    createButtonText: {
      color: colors.decorativeText,
      fontSize: 18,
      fontWeight: "700",
    },
    refineHeaderText: {
      color: colors.text,
      fontWeight: "bold",
      fontSize: 16,
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
        keyboardShouldPersistTap="handled"
      >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>New Forum Post</Text>
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
        <Text style={styles.sectionLabel}>Title</Text>
        <TextInput
          value={postTitle}
          onChangeText={setPostTitle}
          placeholder="Enter a title"
          placeholderTextColor={`${colors.text}99`}
          style={styles.input}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>Content</Text>
        <TextInput
          value={postContent}
          onChangeText={setPostContent}
          placeholder="Share the details..."
          placeholderTextColor={`${colors.text}99`}
          multiline
          style={[styles.input, styles.contentInput]}
        />
      </View>

      <View style={[styles.formSection, styles.mediaSection]}>
        <Text style={styles.sectionLabel}>Upload Media</Text>
        <View style={styles.mediaBlockRow}>
          <Pressable style={styles.mediaBlock}>
            <View style={styles.mediaIconCircle}>
              <Feather name="image" size={46} style={styles.mediaIcon} />
            </View>
            <Text style={styles.mediaBlockLabel}>Upload From Cameraroll</Text>
          </Pressable>
          <Pressable style={styles.mediaBlock}>
            <View style={styles.mediaIconCircle}>
              <Feather name="camera" size={46} style={styles.mediaIcon} />
            </View>
            <Text style={styles.mediaBlockLabel}>Camera</Text>
          </Pressable>
          <Pressable style={styles.mediaBlock}>
            <View style={styles.mediaIconCircle}>
              <Feather name="upload" size={46} style={styles.mediaIcon} />
            </View>
            <Text style={styles.mediaBlockLabel}>Upload File</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.formSection, styles.tagSection]}>
        <Text style={styles.sectionLabel}>Tag (Up to 5)</Text>
        <View style={styles.tagList}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              style={styles.tagChip}
              onPress={() => handleRemoveTag(tag)}
            >
              <Text style={styles.tagChipText}>#{tag}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.tagInputRow}>
          <TextInput
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add a tag"
            placeholderTextColor={`${colors.text}99`}
            style={styles.tagInput}
          />
          <Pressable
            style={[
              styles.addTagButton,
              (tags.length >= 5 || !newTag.trim()) && styles.addTagButtonDisabled,
            ]}
            onPress={handleAddTag}
            disabled={tags.length >= 5 || !newTag.trim()}
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

      <Pressable style={styles.createButton} onPress={handleCreatePost}>
        <Text style={styles.createButtonText}>Create Post</Text>
      </Pressable>
    </ScrollView>
  </KeyboardAvoidingView>
  );
}
