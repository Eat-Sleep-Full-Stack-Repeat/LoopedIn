import React, { useState, useRef, useEffect } from "react";
import {
  ActionSheetIOS,
  KeyboardAvoidingView,
  Modal,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import API_URL from "@/utils/config";
import { Storage } from "../utils/storage";
import { useAppSize } from "@/Hooks/useSize";

type PhotoCard = {
  id: string;
  altText: string;
  hasImage: boolean;
  source?: "camera" | "cameraRoll";
  localUri?: string;
};

export default function SingleProject() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const initialThumbIcons: Array<
    "image" | "aperture" | "camera" | "grid" | "layers"
  > = ["image", "aperture", "camera", "grid", "layers"];
  const [thumbIcons, setThumbIcons] = useState<typeof initialThumbIcons>([]);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [titleText, setTitleText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const selectedIcon = thumbIcons[selectedThumb] ?? "image";
  const formattedStartDate = (startDate ?? new Date()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  //new things for image upload
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

  //fixed values
  const CAPTION_LIMIT = 1000;
  const PHOTO_LIMIT = 5;
  const CARD_ALT_TEXT_LIMIT = 100;
  const CARD_WIDTH = Math.min(Dimensions.get("window").width - 64, 400);

  const size = useAppSize();

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

  const handleSubmit = async () => {
    if (submitting) return;
    const fid = await Storage.getItem("folderID");

    console.log("folder id is", fid);

    try {
      const hasAnyPhoto = photoCards.some((c) => c.hasImage && c.localUri);
      // if (!hasAnyPhoto) {
      //   Alert.alert("Missing photo", "Please add at least one photo.");
      //   return;
      // }

      setSubmitting(true);

      const token = await Storage.getItem("token");
      if (!token) {
        Alert.alert("Not signed in", "Please sign in again.");
        return;
      }

      //format date
      const formattedDate = startDate
        ? startDate.toISOString()
        : new Date().toISOString();

      const formData = new FormData();
      formData.append("title", titleText.trim());
      formData.append("notes", noteText.trim());
      formData.append("startDate", formattedDate);
      formData.append("folderID", fid); //get this from prior navigation?

      formData.append(
        "altTexts",
        JSON.stringify(
          photoCards.map((card) =>
            (card.altText || "").slice(0, CARD_ALT_TEXT_LIMIT)
          )
        )
      );

      photoCards.forEach((card, index) => {
        if (!card.hasImage || !card.localUri) return;

        const uri = card.localUri;
        const name = uri.split("/").pop() || `photo-${index}.jpg`;
        const match = /\.(\w+)$/.exec(name);
        const ext = match ? match[1].toLowerCase() : "jpg";
        const type =
          ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

        formData.append("photos", {
          uri,
          name,
          type,
        } as any);
      });

      //ACTUAL CALL
      const response = await fetch(`${API_URL}/api/create-project`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.log("Project create error:", text);
        Alert.alert("Error creating project", text || "Unknown error");
        return;
      }

      Alert.alert("Success!", "Your project has been created.");
      router.back();
    } catch (err: any) {
      console.log("Submit error:", err);
      Alert.alert("Error", err?.message || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      marginTop: 10,
      position: "relative",
    },
    backButton: {
      position: "absolute",
      left: 0,
    },
    backArrow: {
      fontSize: 28,
      color: colors.text,
    },
    createButton: {
      paddingLeft: 8,
      paddingVertical: 6,
    },
    title: {
      color: colors.text,
      fontSize: size.font.largeTitleText,
      fontWeight: size.weight.title,
    },
    mainPhotoText: {
      color: colors.text,
      marginTop: 8,
      fontSize: size.font.button,
      fontWeight: size.weight.title,
    },
    mainPhotoText2: {
      color: colors.inputContainerPlaceholderText,
      marginTop: 8,
      fontSize: size.font.caption,
      textAlign: "center",
    },
    notePlaceholder: {
      marginTop: 6,
      width: "100%",
      minHeight: 180,
      borderRadius: 14,
      backgroundColor: colors.topBackground,
      alignItems: "flex-start",
      justifyContent: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 12,
      paddingBottom: 16,
      borderWidth: 1,
      borderColor: colors.topBackground,
      alignSelf: "center",
    },
    noteTitleBox: {
      marginTop: 6,
      width: "100%",
      borderRadius: 14,
      backgroundColor: colors.topBackground,
      alignItems: "flex-start",
      justifyContent: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.topBackground,
      alignSelf: "center",
    },
    noteHeaderRow: {
      marginTop: 10,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateField: {
      marginTop: 5,
      width: "100%",
      borderRadius: 14,
      backgroundColor: colors.topBackground,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.topBackground,
      alignSelf: "center",
    },
    dateInput: {
      color: colors.text,
      fontSize: size.font.caption,
      textAlign: "center",
      width: "100%",
    },
    dateLabel: {
      marginTop: 16,
      color: colors.text,
      fontSize: size.font.caption,
    },
    dateModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      justifyContent: "flex-end",
    },
    dateModalCard: {
      backgroundColor: colors.background,
      paddingTop: 12,
      paddingBottom: 16,
      paddingHorizontal: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    dateModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginBottom: 8,
    },
    dateModalButton: {
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    dateModalButtonText: {
      color: colors.decorativeText,
      fontSize: size.font.caption,
      fontWeight: size.weight.title,
    },
    datePicker: {
      alignSelf: "center",
    },
    addProjectButton: {
      marginTop: 20,
      width: "100%",
      borderRadius: 14,
      backgroundColor: colors.decorativeBackground,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      alignSelf: "center",
    },
    addProjectButtonText: {
      color: colors.antiText,
      fontSize: size.font.button,
      fontWeight: size.weight.title,
    },
    countText: {
      color: colors.settingsText,
      fontSize: size.font.detailText,
    },
    noteText: {
      color: colors.text,
      fontSize: size.font.bodyText,
      lineHeight: 20,
      textAlignVertical: Platform.OS === "android" ? "top" : "auto",
      flexShrink: 1,
      width: "100%",
    },
    noteTitleInput: {
      color: colors.text,
      fontSize: size.font.bodyText,
      paddingVertical: 4,
      width: "100%",
    },
    noteBodyInput: {
      color: colors.text,
      fontSize: size.font.bodyText,
      lineHeight: 20,
      textAlignVertical: Platform.OS === "android" ? "top" : "auto",
      minHeight: 120,
      width: "100%",
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
      fontSize: size.font.button,
      fontWeight: size.weight.headline,
    },
    removePhotoButton: {
      width: size.iconSize + 24,
      height: size.iconSize + 24,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.secondaryButton,
    },
    uploadArea: {
      height: 200,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.secondaryText,
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
      fontSize: size.font.bodyText,
    },
    cardCounterText: {
      color: colors.settingsMenuText,
      fontSize: size.font.caption,
      marginTop: 8,
      textAlign: "left",
    },
    photoHelperText: {
      marginTop: 16,
      color: colors.settingsMenuText,
      fontSize: size.font.caption,
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
      fontWeight: size.weight.title,
    },
    addPhotoFab: {
      width: size.iconSize + 24,
      height: size.iconSize + 24,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.secondaryButton,
    },
    addPhotoFabDisabled: {
      opacity: 0.4,
    },
  });

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
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
              Create New Project
            </Text>
          </View>

          {/* PRE-PHOTO-UPLOADS */}
          <View style={styles.noteHeaderRow}>
            <Text style={styles.dateLabel}>Title</Text>
            <Text
              style={styles.countText}
              accessible={true}
              accessibilityLabel={`${titleText.length} out of  40 characters are used.`}
            >
              {titleText.length}/40
            </Text>
          </View>
          <View style={styles.noteTitleBox}>
            <TextInput
              placeholderTextColor={colors.settingsText}
              maxLength={40}
              style={styles.noteTitleInput}
              value={titleText}
              onChangeText={setTitleText}
            />
          </View>
          <Text style={styles.dateLabel}>Start Date</Text>
          <Pressable
            style={styles.dateField}
            onPress={() => {
              const baseDate = startDate ?? new Date();
              if (Platform.OS === "android") {
                DateTimePickerAndroid.open({
                  value: baseDate,
                  mode: "date",
                  display: "spinner",
                  onChange: (event, selectedDate) => {
                    if (event.type === "set" && selectedDate) {
                      setStartDate(selectedDate);
                    }
                  },
                });
                return;
              }
              setTempDate(baseDate);
              setIsDatePickerVisible(true);
            }}
            accessible={true}
            accessibilityLabel={"Add Start Date"}
            accessibilityHint={"Double tap to add a project start date."}
            accessibilityRole={"spinbutton"}
          >
            <Text style={styles.dateInput}>{formattedStartDate}</Text>
          </Pressable>
          <Modal
            visible={isDatePickerVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setIsDatePickerVisible(false)}
          >
            <Pressable
              style={styles.dateModalOverlay}
              onPress={() => setIsDatePickerVisible(false)}
            >
              <Pressable style={styles.dateModalCard}>
                <View style={styles.dateModalHeader}>
                  <Pressable
                    style={styles.dateModalButton}
                    onPress={() => {
                      setStartDate(tempDate);
                      setIsDatePickerVisible(false);
                    }}
                  >
                    <Text style={styles.dateModalButtonText}>Confirm</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  style={styles.datePicker}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempDate(selectedDate);
                    }
                  }}
                />
              </Pressable>
            </Pressable>
          </Modal>
          <View style={styles.noteHeaderRow}>
            <Text style={styles.dateLabel}>Note</Text>
            <Text
              style={styles.countText}
              accessible={true}
              accessibilityLabel={`${noteText.length} out of 5000 characters are used.`}
            >
              {noteText.length}/5000
            </Text>
          </View>
          <View style={styles.notePlaceholder}>
            <TextInput
              placeholderTextColor={colors.settingsText}
              maxLength={5000}
              multiline
              style={styles.noteBodyInput}
              value={noteText}
              onChangeText={setNoteText}
            />
          </View>

          {/* UPLOAD TIME BABEY */}
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
                      <Text style={styles.cardTitle}>Photo {index + 1}</Text>
                      <Pressable
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhotoCard(card.id)}
                        accessible={true}
                        accessibilityLabel={"Delete photo."}
                        accessibilityHint={`Removes photo ${
                          index + 1
                        } from selection.`}
                        accessibilityRole={"button"}
                      >
                        <Feather
                          name="trash-2"
                          size={size.iconSize}
                          color={colors.decorativeBackground}
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
                      accessible={true}
                      accessibilityLabel={
                        card.hasImage ? "Uploaded Photo" : "Upload a photo"
                      }
                      accessibilityHint={
                        card.hasImage
                          ? ""
                          : "Double tap to choose from your library or camera."
                      }
                      accessibilityRole={card.hasImage ? "image" : "button"}
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
                          <Text style={styles.mainPhotoText}>
                            Upload a photo
                          </Text>
                          <Text style={styles.mainPhotoText2}>
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
                      <Text
                        style={styles.cardCounterText}
                        accessible={true}
                        accessibilityLabel={`${card.altText.length} out of ${CARD_ALT_TEXT_LIMIT} characters are used.`}
                      >
                        {card.altText.length}/{CARD_ALT_TEXT_LIMIT}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.photoHelperText}>
              Add up to 5 cards. Each card holds one photo with its own alt
              text.
            </Text>
            <View style={styles.addCardRow}>
              <Text
                style={styles.photoCountText}
                accessible={true}
                accessibilityLabel={`${photoCards.length} out of ${PHOTO_LIMIT} cards are taken.`}
              >
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
                accessible={true}
                accessibilityLabel={"Add Card"}
                accessibilityHint={
                  photoCards.length >= PHOTO_LIMIT
                    ? "Cannot add more cards. Reached 5 card maximum."
                    : "Double tap to add another card"
                }
              >
                <Feather
                  name="plus"
                  size={20}
                  color={
                    photoCards.length >= PHOTO_LIMIT
                      ? colors.secondaryText
                      : colors.decorativeBackground
                  }
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={styles.addProjectButton}
            onPress={handleSubmit}
            disabled={submitting}
            accessible={true}
            accessibilityHint={"Add project to folder"}
            accessibilityRole={"button"}
          >
            <Text style={styles.addProjectButtonText}>Add Project</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
