import { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Dimensions,
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
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "@/utils/config";


type CraftOption = {
  id: string;
  label: string;
  icon?: ImageSourcePropType;
};

type PhotoCard = {
  id: string;
  altText: string;
  hasImage: boolean;
  source?: "camera" | "cameraRoll";
  localUri?: string;
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
  const CAPTION_LIMIT = 1000;
  const PHOTO_LIMIT = 5;
  const CARD_ALT_TEXT_LIMIT = 100;
  const CARD_WIDTH = Math.min(Dimensions.get("window").width - 64, 400);
  const [caption, setCaption] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const [postVisibility, setPostVisibility] = useState<"public" | "private">(
    "public"
  );
  const createEmptyPhotoCard = (): PhotoCard => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    altText: "",
    hasImage: false,
  });
  const [photoCards, setPhotoCards] = useState<PhotoCard[]>([
    createEmptyPhotoCard(),
  ]);
  const photoScrollRef = useRef<ScrollView | null>(null);
  const formScrollRef = useRef<ScrollView | null>(null);
  const previousPhotoCountRef = useRef<number>(photoCards.length);
  const [captionSectionY, setCaptionSectionY] = useState(0);
  const [tagSectionY, setTagSectionY] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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

  const handleUploadPress = (cardId: string) => {
    const pickImage = async (source: "camera" | "cameraRoll") => {
      try {
        if (source === "camera") {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission needed", "Camera access is required.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.9,
          });
          if (result.canceled) return;
          const uri = result.assets?.[0]?.uri;
          if (!uri) return;

          setPhotoCards((prev) =>
            prev.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    hasImage: true,
                    source,
                    localUri: uri,
                  }
                : card
            )
          );
        } else {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permission needed",
              "Photo library access is required."
            );
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.9,
          });
          if (result.canceled) return;
          const uri = result.assets?.[0]?.uri;
          if (!uri) return;

          setPhotoCards((prev) =>
            prev.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    hasImage: true,
                    source,
                    localUri: uri,
                  }
                : card
            )
          );
        }
      } catch (err) {
        console.log("Image pick error:", err);
        Alert.alert("Error", "Failed to pick image.");
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Upload From Camera Roll", "Camera"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            console.log("Upload from camera roll selected");
            pickImage("cameraRoll");
          } else if (buttonIndex === 2) {
            console.log("Camera selected");
            pickImage("camera");
          }
        }
      );
    } else {
      Alert.alert("Upload Image", undefined, [
        {
          text: "Upload From Camera Roll",
          onPress: () => {
            console.log("Upload from camera roll selected");
            pickImage("cameraRoll");
          },
        },
        {
          text: "Camera",
          onPress: () => {
            console.log("Camera selected");
            pickImage("camera");
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    }
  };

  const handleAddPhotoCard = () => {
    setPhotoCards((prev) => {
      if (prev.length >= PHOTO_LIMIT) {
        return prev;
      }
      return [...prev, createEmptyPhotoCard()];
    });
  };

  const handleAltTextChange = (cardId: string, text: string) => {
    setPhotoCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, altText: text.slice(0, CARD_ALT_TEXT_LIMIT) }
          : card
      )
    );
  };

  const handleRemovePhotoCard = (cardId: string) => {
    setPhotoCards((prev) => {
      const filtered = prev.filter((card) => card.id !== cardId);
      if (filtered.length === 0) {
        return [createEmptyPhotoCard()];
      }
      return filtered;
    });
  };

  useEffect(() => {
    if (photoCards.length > previousPhotoCountRef.current) {
      photoScrollRef.current?.scrollToEnd({ animated: true });
    }
    previousPhotoCountRef.current = photoCards.length;
  }, [photoCards.length]);

  const scrollToSection = (offset: number) => {
    formScrollRef.current?.scrollTo({
      y: Math.max(offset - 40, 0),
      animated: true,
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      const hasAnyPhoto = photoCards.some(
        (c) => c.hasImage && c.localUri
      );
      if (!hasAnyPhoto) {
        Alert.alert("Missing photo", "Please add at least one photo.");
        return;
      }

      setSubmitting(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }

      const formData = new FormData();
      formData.append("caption", caption.trim());
      formData.append(
        "isPublic",
        postVisibility === "public" ? "true" : "false"
      );
      formData.append("tags", JSON.stringify(tags));
      formData.append(
        "altTexts",
        JSON.stringify(
          photoCards.map((card) =>
            (card.altText || "").slice(0, CARD_ALT_TEXT_LIMIT)
          )
        )
      );
      formData.append("craft", selectedCraft);

      photoCards.forEach((card, index) => {
        if (!card.hasImage || !card.localUri) return;

        const uri = card.localUri;
        const name = uri.split("/").pop() || `photo-${index}.jpg`;
        const match = /\.(\w+)$/.exec(name);
        const ext = match ? match[1].toLowerCase() : "jpg";
        const type =
          ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

        formData.append(
          "photos",
          {
            uri,
            name,
            type,
          } as any
        );
      });

      const response = await fetch(`${API_URL}/api/post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        } as any,
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.log("Post create error:", text);
        Alert.alert("Error creating post", text || "Unknown error");
        return;
      }

      Alert.alert("Posted!", "Your post has been created.");
      router.back();
    } catch (err: any) {
      console.log("Submit error:", err);
      Alert.alert("Error", err?.message || "Failed to create post.");
    } finally {
      setSubmitting(false);
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
      width: "100%",
    },
    photosWrapper: {
      marginTop: 8,
      width: "100%",
    },
    photoScrollContent: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    photoCard: {
      width: CARD_WIDTH,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.topBackground,
      backgroundColor: colors.boxBackground,
      padding: 20,
    },
    photoCardSpacing: {
      marginRight: 16,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    removePhotoButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.decorativeText,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: `${colors.decorativeBackground}33`,
    },
    uploadArea: {
      height: 200,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.decorativeText,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
      gap: 10,
      marginBottom: 16,
      overflow: "hidden",
    },
    uploadImagePreview: {
      width: "100%",
      height: "100%",
      borderRadius: 20,
    },
    uploadTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    uploadSubtitle: {
      color: `${colors.text}aa`,
      fontSize: 14,
      textAlign: "center",
    },
    cardAltWrapper: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
    },
    cardAltInput: {
      minHeight: 50,
      color: colors.text,
      fontSize: 14,
    },
    cardCounterText: {
      color: `${colors.text}99`,
      fontSize: 12,
      marginTop: 8,
      textAlign: "left",
    },
    photoHelperText: {
      marginTop: 16,
      color: `${colors.text}aa`,
      fontSize: 14,
    },
    addCardRow: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 16,
    },
    photoCountText: {
      color: colors.text,
      fontWeight: "600",
    },
    addPhotoFab: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: colors.decorativeText,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    addPhotoFabDisabled: {
      opacity: 0.4,
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
      paddingVertical: 30,
      borderWidth: 1,
      borderColor: colors.topBackground,
      color: colors.text,
      fontSize: 16,
    },
    captionInput: {
      minHeight: 90,
      paddingTop: 15,
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
    submitButton: {
      marginTop: 32,
      paddingVertical: 16,
      borderRadius: 20,
      backgroundColor: colors.decorativeBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonText: {
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
        ref={formScrollRef}
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
          <View style={styles.photosWrapper}>
            <ScrollView
              ref={photoScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoScrollContent}
              scrollEnabled={photoCards.length > 1}
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + 16}
              snapToAlignment="start"
            >
              {photoCards.map((card, index) => (
                <View
                  key={card.id}
                  style={[
                    styles.photoCard,
                    index !== photoCards.length - 1 &&
                      styles.photoCardSpacing,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                      Photo {index + 1}
                    </Text>
                    <Pressable
                      style={styles.removePhotoButton}
                      onPress={() => handleRemovePhotoCard(card.id)}
                    >
                      <Feather
                        name="trash-2"
                        size={16}
                        color={colors.decorativeText}
                      />
                    </Pressable>
                  </View>
                  <Pressable
                    style={styles.uploadArea}
                    onPress={
                      card.hasImage
                        ? undefined
                        : () => handleUploadPress(card.id)
                    }
                    disabled={card.hasImage}
                  >
                    {card.hasImage && card.localUri ? (
                      <Image
                        source={{ uri: card.localUri }}
                        style={styles.uploadImagePreview}
                        resizeMode="cover"
                      />
                    ) : (
                      <>
                        <Feather
                          name="image"
                          size={40}
                          color={colors.decorativeText}
                        />
                        <Text style={styles.uploadTitle}>Upload a photo</Text>
                        <Text style={styles.uploadSubtitle}>
                          Tap to choose from your library or camera.
                        </Text>
                      </>
                    )}
                  </Pressable>
                  <View style={styles.cardAltWrapper}>
                    <TextInput
                      value={card.altText}
                      onChangeText={(text) =>
                        handleAltTextChange(card.id, text)
                      }
                      placeholder="Describe this photo for accessibility (max 100 characters)"
                      placeholderTextColor={`${colors.decorativeText}cc`}
                      style={styles.cardAltInput}
                      multiline
                      maxLength={CARD_ALT_TEXT_LIMIT}
                    />
                    <Text style={styles.cardCounterText}>
                      {card.altText.length}/{CARD_ALT_TEXT_LIMIT}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
          <Text style={styles.photoHelperText}>
            Add up to 5 cards. Each card holds one photo with its own alt text.
          </Text>
          <View style={styles.addCardRow}>
            <Text style={styles.photoCountText}>
              {photoCards.length}/{PHOTO_LIMIT}
            </Text>
            <Pressable
              style={[
                styles.addPhotoFab,
                photoCards.length >= PHOTO_LIMIT &&
                  styles.addPhotoFabDisabled,
              ]}
              onPress={handleAddPhotoCard}
              disabled={photoCards.length >= PHOTO_LIMIT}
            >
              <Feather
                name="plus"
                size={20}
                color={
                  photoCards.length >= PHOTO_LIMIT
                    ? colors.text
                    : colors.decorativeText
                }
              />
            </Pressable>
          </View>
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

        <View
          style={styles.formSection}
          onLayout={(event) =>
            setCaptionSectionY(event.nativeEvent.layout.y)
          }
        >
          <View style={styles.inputHeaderRow}>
            <Text style={styles.inputLabel}>Caption</Text>
            <Text style={styles.counterText}>
              {caption.length}/{CAPTION_LIMIT}
            </Text>
          </View>
          <TextInput
            value={caption}
            onChangeText={(text) =>
              setCaption(text.slice(0, CAPTION_LIMIT))
            }
            placeholder="Add a caption"
            placeholderTextColor={`${colors.text}99`}
            style={[styles.input, styles.captionInput]}
            maxLength={CAPTION_LIMIT}
            multiline
            onFocus={() => scrollToSection(captionSectionY)}
          />
        </View>
        <View
          style={styles.tagSection}
          onLayout={(event) => setTagSectionY(event.nativeEvent.layout.y)}
        >
          <Text style={[styles.inputLabel, { marginBottom: 10 }]}>
            Tags (Up to 5)
          </Text>
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
              onChangeText={(text) =>
                setNewTag(text.replace(/\s/g, ""))
              }
              placeholder="Add a tag"
              placeholderTextColor={`${colors.text}99`}
              style={styles.tagInput}
              onFocus={() => scrollToSection(tagSectionY)}
            />
            <Pressable
              onPress={handleAddTag}
              disabled={tags.length >= 5 || !newTag.trim()}
              style={[
                styles.addTagButton,
                (tags.length >= 5 || !newTag.trim()) &&
                  styles.addTagButtonDisabled,
              ]}
            >
              <Feather
                name="plus"
                size={28}
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

        <View style={styles.postOptionsRow}>
          <Pressable
            style={[
              styles.postOptionButton,
              postVisibility === "public" &&
                styles.postOptionButtonSelected,
            ]}
            onPress={() => setPostVisibility("public")}
          >
            <Feather
              name="globe"
              size={20}
              style={[
                styles.postOptionIcon,
                postVisibility === "public" &&
                  styles.postOptionIconSelected,
              ]}
            />
            <Text
              style={[
                styles.postOptionText,
                postVisibility === "public" &&
                  styles.postOptionTextSelected,
              ]}
            >
              Public Post
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.postOptionButton,
              postVisibility === "private" &&
                styles.postOptionButtonSelected,
            ]}
            onPress={() => setPostVisibility("private")}
          >
            <Feather
              name="lock"
              size={20}
              style={[
                styles.postOptionIcon,
                postVisibility === "private" &&
                  styles.postOptionIconSelected,
              ]}
            />
            <Text
              style={[
                styles.postOptionText,
                postVisibility === "private" &&
                  styles.postOptionTextSelected,
              ]}
            >
              Private Post
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </Pressable>

        <View style={styles.contentSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
