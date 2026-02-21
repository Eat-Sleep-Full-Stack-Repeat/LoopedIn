import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Storage } from "../../utils/storage";
import API_URL from "@/utils/config";

type PhotoCard = {
  pic: string;
  altText: string;
  id: string;
};

type ProjectInfo = {
  fld_project_pk: string | number;
  fld_folder_fk: string | number;
  fld_creator: string | number;
  fld_p_name: string;
  fld_cover_image: string | null;
  fld_date_started: string | null;
  fld_date_completed: string | null;
  fld_notes: string | null;
  fld_status: string;
  fld_f_name?: string;
};

type SingleProjectPayload = {
  id: string;
  info: ProjectInfo;
  coverImage: string | null;
  imageUrls: PhotoCard[];
};

export default function SingleProject() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [selectedThumb, setSelectedThumb] = useState(0);

  const [tokenOkay, setTokenOkay] = useState(false);
  const alreadyAlerted = useRef(false);
  const [loading, setLoading] = useState(false);

  const [project, setProject] = useState<SingleProjectPayload | null>(null);

  const projectId = Array.isArray(id) ? id[0] : id;

  const checkTokenOkay = async () => {
    try {
      const token = await Storage.getItem("token");
      if (!token) {
        throw new Error("no token");
      } else {
        setTokenOkay(true);
      }
    } catch (e) {
      if (!alreadyAlerted.current) {
        alreadyAlerted.current = true;
        alert("Access denied, please log in and try again.");
        router.replace("/");
      }
    }
  };

  useEffect(() => {
    checkTokenOkay();
  }, []);

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchProject = async () => {
    if (!tokenOkay) return;
    if (!projectId) return;
    if (loading) return;

    setLoading(true);

    try {
      const token = await Storage.getItem("token");

      const res = await fetch(`${API_URL}/api/single-project?id=${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (res.status == 403) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Access denied, please log in and try again.");
        }
        router.replace("/");
        return;
      } else if (res.status == 404) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Project does not exist. Please try again later.");
        }
        router.back();
        return;
      } else if (!res.ok) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Whoops! Something went wrong... please try again later.");
        }
        router.back();
        return;
      }

      const responseData = await res.json();

      const mapped: SingleProjectPayload = {
        id: String(projectId),
        info: responseData.projectInfo,
        coverImage: responseData.projectInfo?.fld_cover_image ?? null,
        imageUrls: Array.isArray(responseData.projectPics)
          ? responseData.projectPics
              .map((pic: any) => {
                if (Array.isArray(pic)) {
                  const [url, alt, id] = pic;
                  if (!url) return null;
                  return { pic: url, altText: alt ?? "", id: String(id ?? "") };
                }

                //backup
                if (pic?.pic) {
                  return {
                    pic: pic.pic,
                    altText: pic.altText ?? "",
                    id: String(pic.id ?? ""),
                  };
                }

                return null;
              })
              .filter(Boolean)
          : [],
      };

      setProject(mapped);
      setSelectedThumb(0);
    } catch (error) {
      console.log("Error when trying to fetch project data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tokenOkay) return;
    fetchProject();
  }, [tokenOkay, projectId]);

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
      paddingHorizontal: 8,
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
      overflow: "hidden",
    },
    mainPhotoText: {
      color: colors.settingsText,
      marginTop: 8,
      fontSize: 12,
      fontWeight: "500",
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
      width: 70,
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
      marginTop: 16,
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
    noteText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      textAlignVertical: Platform.OS === "android" ? "top" : "auto",
      flexShrink: 1,
      width: "100%",
    },
  });

  const titleText =
    project?.info?.fld_p_name ?? (loading ? "Loading..." : "Project Title");
  const statusText = project?.info?.fld_status ?? (loading ? "" : "Not Started");
  const startedLabel = project?.info?.fld_date_started
    ? `Started: ${formatDate(project.info.fld_date_started)}`
    : "";
  const notesText = project?.info?.fld_notes ?? "";

  const gallery = project?.imageUrls ?? [];
  const mainImageUri =
    project?.coverImage ||
    (gallery.length > 0
      ? gallery[Math.min(selectedThumb, gallery.length - 1)]?.pic
      : null);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerSide}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>
              {titleText}
            </Text>
          </View>

          <View style={styles.headerSide}>
            <Pressable style={styles.createButton}>
              <Feather name="edit" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {loading && !project ? (
          <View style={{ paddingTop: 12, alignItems: "center" }}>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        ) : null}

        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        {startedLabel ? (
          <Text style={styles.startDateText}>{startedLabel}</Text>
        ) : null}

        <View style={styles.mainPhotoPlaceholder}>
          {mainImageUri ? (
            <Image
              source={{ uri: mainImageUri }}
              style={styles.mainImage}
              resizeMode="cover"
              accessible
              accessibilityLabel="Project image"
            />
          ) : (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Feather name="image" size={40} color={colors.decorativeText} />
              <Text style={styles.mainPhotoText}>Main image placeholder</Text>
            </View>
          )}
        </View>

        <View style={styles.thumbRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbList}
          >
            {gallery.length > 0
              ? gallery.map((photo, index) => (
                  <Pressable
                    key={`${photo.id}-${index}`}
                    onPress={() => setSelectedThumb(index)}
                    style={[
                      styles.thumbCard,
                      selectedThumb === index && styles.thumbCardSelected,
                    ]}
                  >
                    <Image
                      source={{ uri: photo.pic }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                      accessible
                      accessibilityLabel={photo.altText || "Project thumbnail"}
                    />
                  </Pressable>
                ))
              : null}
          </ScrollView>
        </View>

        <View style={styles.notePlaceholder}>
          <Text style={styles.noteText}>{notesText}</Text>
        </View>
      </ScrollView>
    </View>
  );
}