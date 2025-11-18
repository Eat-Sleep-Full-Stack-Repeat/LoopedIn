import { useRef, useState } from "react";
import {
  Dimensions,
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

type PhotoCard = {
  id: string;
  altText: string;
};

export default function EditPost() {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const CAPTION_LIMIT = 1000;
  const CARD_ALT_TEXT_LIMIT = 100;
  const CARD_WIDTH = Math.min(Dimensions.get("window").width - 64, 400);
  const [caption, setCaption] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const createEmptyPhotoCard = (): PhotoCard => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    altText: "",
  });
  const [photoCards, setPhotoCards] = useState<PhotoCard[]>([createEmptyPhotoCard()]);
  const photoScrollRef = useRef<ScrollView | null>(null);
  const formScrollRef = useRef<ScrollView | null>(null);
  const [captionSectionY, setCaptionSectionY] = useState(0);
  const [tagSectionY, setTagSectionY] = useState(0);

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

  const handleAltTextChange = (cardId: string, text: string) => {
    setPhotoCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, altText: text.slice(0, CARD_ALT_TEXT_LIMIT) }
          : card
      )
    );
  };

  const scrollToSection = (offset: number) => {
    formScrollRef.current?.scrollTo({
      y: Math.max(offset - 40, 0),
      animated: true,
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
    cardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
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
    },
    uploadAreaDisabled: {
      borderStyle: "solid",
      backgroundColor: colors.topBackground,
      opacity: 0.9,
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
          <Text style={styles.title}>Edit Post</Text>
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
                    index !== photoCards.length - 1 && styles.photoCardSpacing,
                  ]}
                >
                  <Text style={[styles.cardTitle, { marginBottom: 12 }]}>
                    Photo {index + 1}
                  </Text>
                  <View style={[styles.uploadArea, styles.uploadAreaDisabled]}>
                    <Feather name="image" size={40} color={colors.decorativeText} />
                    <Text style={styles.uploadTitle}>Photo updates disabled</Text>
                    <Text style={styles.uploadSubtitle}>
                      Add or remove photos on the create flow. Update alt text here.
                    </Text>
                  </View>
                  <View style={styles.cardAltWrapper}>
                    <TextInput
                      value={card.altText}
                      onChangeText={(text) => handleAltTextChange(card.id, text)}
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
            Photos are fixed on edit. Update their alt text if needed.
          </Text>
        </View>

        <View
          style={styles.formSection}
          onLayout={(event) => setCaptionSectionY(event.nativeEvent.layout.y)}
        >
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
              onFocus={() => scrollToSection(tagSectionY)}
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

        <Pressable style={styles.submitButton} onPress={() => console.log("Submit pressed")}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </Pressable>

        <View style={styles.contentSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
