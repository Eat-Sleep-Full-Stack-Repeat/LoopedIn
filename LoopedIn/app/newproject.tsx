import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  const selectedIcon = thumbIcons[selectedThumb] ?? "image";
  const formattedStartDate = (startDate ?? new Date()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top + 8,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      justifyContent: "space-between",
    },
    headerSide: {
      width: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    backButton: {
      paddingRight: 8,
      paddingVertical: 6,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    createButton: {
      paddingLeft: 8,
      paddingVertical: 6,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "600",
    },
    statusPill: {
      alignSelf: "center",
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.topBackground,
    },
    statusText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
    },
    startDateText: {
      color: colors.settingsText,
      fontSize: 12,
      marginTop: 6,
      textAlign: "center",
    },
    mainPhotoPlaceholder: {
      marginTop: 12,
      width: 240,
      aspectRatio: 3 / 4,
      borderRadius: 16,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.topBackground,
      alignSelf: "center",
    },
    mainPhotoText: {
      color: colors.settingsText,
      marginTop: 8,
      fontSize: 12,
      fontWeight: "500",
    },
    thumbRow: {
      marginTop: 8,
    },
    thumbList: {
      paddingRight: 8,
    },
    thumbCard: {
      width: 70,
      aspectRatio: 3 / 4,
      borderRadius: 10,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.topBackground,
      marginRight: 10,
    },
    thumbCardSelected: {
      borderWidth: 2,
      borderColor: colors.decorativeBackground,
    },
    addThumbCard: {
      width: 70,
      aspectRatio: 3 / 4,
      borderRadius: 10,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.topBackground,
      marginRight: 10,
    },
    notePlaceholder: {
      marginTop: 6,
      width: "100%",
      minHeight: 180,
      borderRadius: 14,
      backgroundColor: "transparent",
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
      backgroundColor: "transparent",
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
      backgroundColor: "transparent",
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
      fontSize: 14,
      textAlign: "center",
      width: "100%",
    },
    dateLabel: {
      marginTop: 16,
      color: colors.text,
      fontSize: 14,
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
    dateModalHeaderHidden: {
      display: "none",
    },
    dateModalButton: {
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    dateModalButtonText: {
      color: colors.decorativeText,
      fontSize: 15,
      fontWeight: "600",
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
      color: colors.decorativeText,
      fontSize: 16,
      fontWeight: "600",
    },
    countText: {
      color: colors.settingsText,
      fontSize: 12,
    },
    noteText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      textAlignVertical: Platform.OS === "android" ? "top" : "auto",
      flexShrink: 1,
      width: "100%",
    },
    noteTitleInput: {
      color: colors.text,
      fontSize: 16,
      paddingVertical: 4,
      width: "100%",
    },
    noteBodyInput: {
      color: colors.text,
      fontSize: 14,
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
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Create New Project</Text>
          </View>
          <View style={styles.headerSide}>
          </View>
        </View>
        
        

        <View style={styles.mainPhotoPlaceholder}>
          <Feather name={selectedIcon} size={40} color={colors.decorativeText} />
          <Text style={styles.mainPhotoText}>Main image placeholder</Text>
        </View>

        <View style={styles.thumbRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbList}
          >
            {thumbIcons.map((icon, index) => (
              <Pressable
                key={`thumb-${index}`}
                onPress={() => setSelectedThumb(index)}
                style={[
                  styles.thumbCard,
                  selectedThumb === index && styles.thumbCardSelected,
                ]}
              >
                <Feather
                  name={icon}
                  size={20}
                  color={colors.decorativeText}
                />
              </Pressable>
            ))}
            {thumbIcons.length < 5 && (
              <Pressable
                style={styles.addThumbCard}
                onPress={() => {
                  const nextIcon =
                    initialThumbIcons[thumbIcons.length % initialThumbIcons.length];
                  const nextThumbs = [...thumbIcons, nextIcon];
                  setThumbIcons(nextThumbs);
                  setSelectedThumb(nextThumbs.length - 1);
                }}
              >
                <Feather name="plus" size={22} color={colors.decorativeText} />
              </Pressable>
            )}
          </ScrollView>
        </View>

        <View style={styles.noteHeaderRow}>
          <Text style={styles.dateLabel}>Title</Text>
          <Text style={styles.countText}>{titleText.length}/100</Text>
        </View>
        <View style={styles.noteTitleBox}>
          <TextInput
            placeholderTextColor={colors.settingsText}
            maxLength={100}
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
          <Text style={styles.countText}>{noteText.length}/1000</Text>
        </View>
        <View style={styles.notePlaceholder}>
          <TextInput
            placeholderTextColor={colors.settingsText}
            maxLength={1000}
            multiline
            style={styles.noteBodyInput}
            value={noteText}
            onChangeText={setNoteText}
          />
        </View>
        <Pressable style={styles.addProjectButton}>
          <Text style={styles.addProjectButtonText}>Add Project</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
