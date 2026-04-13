import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Storage } from "@/utils/storage";
import API_URL from "@/utils/config";
import { useAppSize } from "@/Hooks/useSize";

type ProjectPhoto = {
  pic: string;
  altText: string;
  id: string;
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
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [loading, setLoading] = useState(false);
  const alreadyAlerted = useRef(false);

  const projectId = Array.isArray(id) ? id[0] : id;

  const size = useAppSize();
  const { width } = useWindowDimensions();

  const formattedStartDate = (startDate ?? new Date()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

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
      setStartDate(
        info?.fld_date_started ? new Date(info.fld_date_started) : null
      );

      const mappedPhotos: ProjectPhoto[] = Array.isArray(
        responseData.projectPics
      )
        ? responseData.projectPics
            .map((pic: any) => {
              if (Array.isArray(pic)) {
                const [url, alt, picId] = pic;
                if (!url) return null;
                return {
                  pic: String(url),
                  altText: alt ?? "",
                  id: String(picId ?? ""),
                };
              }

              if (pic?.pic) {
                return {
                  pic: String(pic.pic),
                  altText: pic.altText ?? "",
                  id: String(pic.id ?? ""),
                };
              }

              return null;
            })
            .filter(Boolean)
        : [];

      setPhotos(mappedPhotos);
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
    photos.length > 0
      ? photos[Math.min(selectedThumb, photos.length - 1)]?.pic
      : null;

  const handleSaveChanges = async () => {
    if (!projectId || loading) return;

    try {
      setLoading(true);
      const token = await Storage.getItem("token");

      if (!token) {
        alert("Access denied, please log in and try again.");
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/project/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          title: titleText,
          note: noteText,
          dateStarted: startDate ? startDate.toISOString() : null,
        }),
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
      fontSize: 28,
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

          <View
            style={styles.mainPhotoPlaceholder}
            accessible={true}
            accessibilityLabel={
              mainImageUri ? "Primary Project Photo" : "No Project Photo"
            }
            accessibilityRole={mainImageUri ? "image" : "none"}
          >
            {mainImageUri ? (
              <Image
                source={{ uri: mainImageUri }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            ) : (
              <>
                <Feather
                  name="image"
                  size={size.iconSize + 20}
                  color={colors.decorativeText}
                />
                <Text style={styles.mainPhotoText}>No project image</Text>
              </>
            )}
          </View>

          <View style={styles.thumbRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbList}
            >
              {photos.map((photo, index) => (
                <Pressable
                  key={`${photo.id}-${index}`}
                  onPress={() => setSelectedThumb(index)}
                  style={[
                    styles.thumbCard,
                    selectedThumb === index && styles.thumbCardSelected,
                  ]}
                  accessible={true}
                  accessibilityLabel={photo.altText}
                  accessibilityRole={"image"}
                >
                  <Image
                    source={{ uri: photo.pic }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>

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
            accessibilityLabel={"Edit Start Date"}
            accessibilityHint={"Double tap to edit project start date."}
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
                  onChange={(_event, selectedDate) => {
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
