import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import API_URL from "@/utils/config";
import { Storage } from "@/utils/storage";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSize } from "@/Hooks/useSize";
import Animated, {useAnimatedStyle, useSharedValue, withSpring, withTiming} from "react-native-reanimated";

type PhotoCard = {
  id: string;
  altText: string;
  hasImage: boolean;
  source?: "camera" | "cameraRoll";
  localUri?: string;
  isExisting?: boolean;
};

export default function EditProject() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [titleText, setTitleText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [finishDate, setFinishDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [photos, setPhotos] = useState<PhotoCard[]>([]);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [loading, setLoading] = useState(false);
  const alreadyAlerted = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [activeDateField, setActiveDateField] = useState<"start" | "finish" | null>(null);
  const formattedStartDate = (startDate ?? new Date()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  const formattedFinishDate = (finishDate ?? new Date()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  const MIN_START_DATE = new Date(1950, 0, 1); //jan = 0

  const projectId = Array.isArray(id) ? id[0] : id;

  //fixed values
  const CAPTION_LIMIT = 1000;
  const PHOTO_LIMIT = 5;
  const CARD_ALT_TEXT_LIMIT = 100;
  const CARD_WIDTH = Math.min(Dimensions.get("window").width - 64, 400);

  const size = useAppSize();
  const { width } = useWindowDimensions();

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

  useEffect(() => {
    if (photoCards.length > previousPhotoCountRef.current) {
      photoScrollRef.current?.scrollToEnd({ animated: true });
    }
    previousPhotoCountRef.current = photoCards.length;
  }, [photoCards.length]);

  const fetchProject = async () => {
    if (!projectId || loading) return;

    setLoading(true);
    try {
      const token = await Storage.getItem("token");
      if (!token) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Access denied, please log in and try again.");
        }
        router.replace("/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/single-project?id=${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (res.status === 403) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Access denied, please log in and try again.");
        }
        router.replace("/login");
        return;
      }

      if (res.status === 404) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Project does not exist. Please try again later.");
        }
        router.back();
        return;
      }

      if (!res.ok) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Whoops! Something went wrong... please try again later.");
        }
        router.back();
        return;
      }

      const responseData = await res.json();
      const info = responseData.projectInfo;

      setTitleText(info?.fld_p_name ?? "");
      setNoteText(info?.fld_notes ?? "");

      const fetchedStart = info?.fld_date_started
        ? new Date(info.fld_date_started)
        : null;

      const fetchedFinish = info?.fld_date_completed
        ? new Date(info.fld_date_completed)
        : null;

      setStartDate(fetchedStart);
      setFinishDate(fetchedFinish);

      //get toggles in a roundabout way
      setIsStarted(!!fetchedStart);
      setIsComplete(!!fetchedFinish);

      const mappedPhotos: PhotoCard[] = Array.isArray(responseData.projectPics)
        ? responseData.projectPics.map((pic: any) => {
        if (!pic) return null;

        if (Array.isArray(pic)) {
          const [url, alt, id] = pic;
          if (!url) return null;

          return {
            id: String(id ?? `${Date.now()}-${Math.random()}`),
            altText: alt ?? "",
            hasImage: true,
            localUri: url,
            isExisting: true,
          };
        }

        if (pic?.pic) {
          return {
            id: String(pic.id ?? `${Date.now()}-${Math.random()}`),
            altText: pic.altText ?? "",
            hasImage: true,
            localUri: pic.pic,
            isExisting: true,
          };
        }

        return null;
      })
      .filter(Boolean) as PhotoCard[]
    : [];

      setPhotos(mappedPhotos);
        if (mappedPhotos.length > 0) {
          setPhotoCards(mappedPhotos);
        }
      setSelectedThumb(0);
    } catch (error) {
      console.log("Error when trying to fetch project data:", error);
      if (!alreadyAlerted.current) {
        alreadyAlerted.current = true;
        alert("Whoops! Something went wrong... please try again later.");
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const mainImageUri =
    photos.length > 0 ? photos[Math.min(selectedThumb, photos.length - 1)]?.localUri : null;

  const handleSaveChanges = async () => {
    if (!projectId || loading) return;

    if(titleText.trim().length === 0){
      alert("Please give your project a title before saving.");
      return;
    }

    //deduce completion status
        let status: "Not Started" | "In Progress" | "Completed";
    
        if (!isStarted) {
          status = "Not Started";
        } else if (isStarted && !isComplete) {
          status = "In Progress";
    
          if (!startDate) {
            Alert.alert("Missing start date", "Please add a start date.");
            return;
          }
    
        } else {
          status = "Completed";
    
          if (!startDate || !finishDate) {
            Alert.alert("Missing dates", "Please add both start and finish dates.");
            return;
          }
    
          if (finishDate < startDate) {
            Alert.alert(
              "Invalid dates",
              "Finish date must be on or after the start date."
            );
            return;
          }
        }

    try {
      setLoading(true);
      const token = await Storage.getItem("token");

      if (!token) {
        alert("Access denied, please log in and try again.");
        router.replace("/login");
        return;
      }

      //consolidate formdata
      const formData = new FormData();

      //format dates
      formData.append("status", status);

      if (status === "In Progress") {
        formData.append("startDate", startDate!.toISOString());
      }

      if (status === "Completed") {
        formData.append("startDate", startDate!.toISOString());
        formData.append("finishDate", finishDate!.toISOString());
      }

      formData.append("title", titleText.trim());
      formData.append("note", noteText.trim());
      // formData.append("dateStarted", formattedStartDate);
      
      const existingImages: any[] = [];
      const newImagesMeta: any[] = [];

      //image handling!!!!! (save me)
      photoCards.forEach((card, index) => {
        if (!card.hasImage || !card.localUri) return;

        //handle old images
        if (!card.localUri.startsWith("file://")) {
          existingImages.push({
            uri: card.localUri,
            altText: (card.altText || "").slice(0, CARD_ALT_TEXT_LIMIT),
            order: index,
          });
          return;
        }

        //handle new images
        const uri = card.localUri;
        const name = uri.split("/").pop() || `photo-${index}.jpg`;
        const match = /\.(\w+)$/.exec(name);
        const ext = match ? match[1].toLowerCase() : "jpg";
        const type =
          ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

          formData.append("photos",
          { uri,
            name,
            type,
          } as any);

        //alt text as metadata
        newImagesMeta.push({
          altText: (card.altText || "").slice(0, CARD_ALT_TEXT_LIMIT),
          order: index,
        });

      });

      //re-save old images separately from new uploads
      formData.append("existingImages", JSON.stringify(existingImages));
      formData.append("newImagesMeta", JSON.stringify(newImagesMeta));

      const response = await fetch(`${API_URL}/api/project/${projectId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 403) {
        alert("Access denied, please log in and try again.");
        router.replace("/login");
        return;
      }

      if (response.status === 404) {
        alert("Project does not exist. Please try again later.");
        router.back();
        return;
      }

      if (!response.ok) {
        alert("Whoops! Something went wrong... please try again later.");
        return;
      }

      alert("Project updated successfully!");
      router.replace({
        pathname: "/singleProject/[id]",
        params: { id: projectId.toString() },
      });
    } catch (error) {
      console.log("Error when updating project data:", error);
      alert("Whoops! Something went wrong... please try again later.");
    } finally {
      setLoading(false);
    }
  };


  //helpers
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

    //animation work for toggles
    const toggleAnimStart = useSharedValue(isStarted ? 1 : 0);
    const toggleAnimComplete = useSharedValue(isComplete ? 1 : 0);
  
    useEffect(() => {
    toggleAnimStart.value = withTiming(isStarted ? 1 : 0, { duration: 200 });
    }, [isStarted]);
  
      useEffect(() => {
    toggleAnimComplete.value = withTiming(isComplete ? 1 : 0, { duration: 200 });
    }, [isComplete]);
  
    const toggleStyleStart = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleAnimStart.value * 24 + 2 }],
    }));
  
    const toggleStyleComplete = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleAnimComplete.value * 24 + 2 }],
    }));
  
    //clear dates upon toggle-deselect not-started
    useEffect(() => {
      if (!isStarted) {
        setStartDate(null);
        setFinishDate(null);
        setIsComplete(false);
      }
    }, [isStarted]);

    useEffect(() => {
      if (!isComplete) {
        setFinishDate(null);
      }
    }, [isComplete]);

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
      marginTop: 10,
      marginBottom: 20,
      justifyContent: "space-between",
    },
    headerSide: {
      width: size.iconSize + 12,
      alignItems: "center",
      justifyContent: "center",
    },
    backButton: {
      paddingVertical: 6,
    },
    backArrow: {
      fontSize: size.font.largeTitleText,
      color: colors.text,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: colors.text,
      fontSize: size.font.largeTitleText,
      fontWeight: size.weight.title,
    },
    mainPhotoPlaceholder: {
      marginTop: 12,
      width: "80%",
      aspectRatio: 3 / 4,
      borderRadius: 16,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.topBackground,
      alignSelf: "center",
      overflow: "hidden",
    },
    mainPhotoText: {
      color: colors.settingsText,
      marginTop: 8,
      fontSize: size.font.detailText,
      fontWeight: size.weight.headline,
    },
    mainPhotoText2: {
      color: `${colors.text}aa`,
      marginTop: 8,
      fontSize: 14,
      textAlign: "center",
    },
    mainImage: {
      width: "100%",
      height: "100%",
    },
    thumbRow: {
      marginTop: 8,
    },
    thumbList: {
      paddingRight: 8,
    },
    thumbCard: {
      width: width * 0.2,
      aspectRatio: 3 / 4,
      borderRadius: 10,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.topBackground,
      marginRight: 10,
      overflow: "hidden",
    },
    thumbCardSelected: {
      borderWidth: 2,
      borderColor: colors.decorativeBackground,
    },
    thumbImage: {
      width: "100%",
      height: "100%",
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
      fontSize: size.font.bodyText,
      textAlign: "center",
      width: "100%",
    },
    dateLabel: {
      marginTop: 16,
      color: colors.text,
      fontSize: size.font.bodyText,
    },
    dateLabel2: {
      color: colors.text,
      fontSize: size.font.bodyText,
      fontWeight: 600,
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
      fontSize: size.font.bodyText,
      fontWeight: size.weight.title,
    },
    datePicker: {
      alignSelf: "center",
    },
    addProjectButton: {
      marginTop: 35,
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
    ploadContainer: {
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
      color: `${colors.text}99`,
      fontSize: 12,
      marginTop: 8,
      textAlign: "left",
    },
    photoHelperText: {
      marginTop: 16,
      color: `${colors.text}aa`,
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
    menuItem: {
      minHeight: 48,
      paddingHorizontal: 23,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
            <View style={styles.headerSide}>
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
            </View>
            <View
              style={styles.headerCenter}
              accessible={true}
              accessibilityRole={"header"}
            >
              <Text style={styles.title}>Edit Project</Text>
            </View>
            <View style={styles.headerSide} />
          </View>

          {loading ? (
            <View
              style={{ alignItems: "center", paddingVertical: 12 }}
              accessible={true}
              accessibilityLabel={"loading"}
            >
              <ActivityIndicator size="small" color={colors.text} />
            </View>
          ) : null}

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
                    <Text style={styles.cardTitle}>
                      Photo {index + 1}
                    </Text>
                    {!card.isExisting ? (
                    
                    <Pressable
                      style={styles.removePhotoButton}
                      onPress={() => handleRemovePhotoCard(card.id)}
                      accessible={true}
                      accessibilityLabel={"Delete photo."}
                      accessibilityHint={`Removes photo ${index + 1} from selection.`}
                      accessibilityRole={"button"}
                    >
                      <Feather
                        name="trash-2"
                        size={16}
                        color={colors.decorativeText}
                      />
                    </Pressable> ): null}
                  </View>
                  <Pressable
                    style={styles.uploadArea}
                    onPress={
                      card.hasImage || card.isExisting
                        ? undefined
                        : () => handleUploadPress(card.id)
                    }
                    accessible={true}
                    accessibilityLabel={card.hasImage ? "Uploaded Photo" : "Upload a photo"}
                    accessibilityHint={card.hasImage ? "" : "Double tap to choose from your library or camera."}
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
                        <Text style={styles.mainPhotoText}>Upload a photo</Text>
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
                    <Text style={styles.cardCounterText}
                      accessible={true}
                      accessibilityLabel={`${card.altText.length} out of ${CARD_ALT_TEXT_LIMIT} characters are used.`}>
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
            <Text style={styles.photoCountText}
              accessible={true}
              accessibilityLabel={`${photoCards.length} out of ${PHOTO_LIMIT} cards are taken.`}>
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
              accessibilityHint={photoCards.length >= PHOTO_LIMIT ? "Cannot add more cards. Reached 5 card maximum." 
                : "Double tap to add another card"}
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


          {/* AFTER PHOTOS... */}
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

          {/* notes */}
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


          {/* is this started yet? */}
        <View
        style={{
                marginTop: 24,
              }}>
        <Pressable
            onPress={() => setIsStarted(!isStarted)}
            style={styles.menuItem}
            accessible={true}
            accessibilityRole="switch"
            accessibilityState={{ checked: isStarted }}
            accessibilityLabel="Toggle - project has been started"
          >
            <Text style={styles.dateLabel2}>This project is already started.</Text>

            <View
              style={{
                width: 50,
                height: 28,
                borderRadius: 20,
                backgroundColor: isStarted ? colors.decorativeBackground : colors.disabledButton,
                justifyContent: "center",
              }}
              >
              <Animated.View
                style={[
                {
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.text,
                position: "absolute",
                },
                toggleStyleStart,
                ]}
              />
            </View>
          </Pressable>
        </View>


        {/* start date */}
        {isStarted ? (
          <>
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
                minimumDate: MIN_START_DATE,
                onChange: (event, selectedDate) => {
                  if (event.type === "set" && selectedDate) {
                    setStartDate(selectedDate);
                  }
                },
              });
              return;
            }
            setActiveDateField("start");
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
                    if (activeDateField === "start") {
                      setStartDate(tempDate);
                    } else if (activeDateField === "finish") {
                      setFinishDate(tempDate);
                    }
                    setIsDatePickerVisible(false);
                    setActiveDateField(null);
                  }}
                >
                  <Text style={styles.dateModalButtonText}>Confirm</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                minimumDate={MIN_START_DATE}
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
        
        </>
        ) : null}


        {/* is this finished yet? */}
        {isStarted && (
        <View style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 20,
              //marginBottom: 20,
              justifyContent: "center",
            }}>
          <Pressable
            onPress={() => setIsComplete(!isComplete)}
            style={styles.menuItem}
            accessible={true}
            accessibilityRole="switch"
            accessibilityState={{ checked: isComplete }}
            accessibilityLabel="Toggle - project has been completed"
          >
            <Text style={styles.dateLabel2}>This project is completed.</Text>

            <View
              style={{
                width: 50,
                height: 28,
                borderRadius: 20,
                backgroundColor: isComplete ? colors.decorativeBackground : colors.disabledButton,
                justifyContent: "center",
              }}
              >
              <Animated.View
                style={[
                {
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.text,
                position: "absolute",
                },
                toggleStyleComplete,
                ]}
              />
            </View>
          </Pressable>
          </View>
          )}

          {/* finish date */}
          {(isStarted && isComplete) ? (
            <>
          <Text style={styles.dateLabel}>Finish Date</Text>
          <Pressable
            style={styles.dateField}
            onPress={() => {
              const baseDate = finishDate ?? startDate ?? new Date();
              if (Platform.OS === "android") {
                DateTimePickerAndroid.open({
                  value: baseDate,
                  mode: "date",
                  display: "spinner",
                  minimumDate: MIN_START_DATE,
                  onChange: (event, selectedDate) => {
                    if (event.type === "set" && selectedDate) {
                      setFinishDate(selectedDate);
                    }
                  },
                });
                return;
              }
              setActiveDateField("finish");
              setTempDate(baseDate);
              setIsDatePickerVisible(true);
            }}
            accessible={true}
            accessibilityLabel={"Add Completion Date"}
            accessibilityHint={"Double tap to add a project completion date."}
            accessibilityRole={"spinbutton"}
          >
            <Text style={styles.dateInput}>{formattedFinishDate}</Text>
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
                    if (activeDateField === "start") {
                      setStartDate(tempDate);
                    } else if (activeDateField === "finish") {
                      setFinishDate(tempDate);
                    }
                    setIsDatePickerVisible(false);
                    setActiveDateField(null);
                  }}
                >
                  <Text style={styles.dateModalButtonText}>Confirm</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                minimumDate={startDate ?? undefined}
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
        </>
        ) : null}


          <Pressable
            style={styles.addProjectButton}
            onPress={handleSaveChanges}
            accessible={true}
            accessibilityRole={"button"}
            accessibilityHint={"Double tap to save edits to project"}
          >
            <Text style={styles.addProjectButtonText}>Save Changes</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
