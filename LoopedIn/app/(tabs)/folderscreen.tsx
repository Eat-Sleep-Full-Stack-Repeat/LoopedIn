import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  TextInput,
  ImageSourcePropType,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AntDesign, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import API_URL from "@/utils/config";
import { Storage } from "../../utils/storage";
import {
  GestureHandlerRootView,
  RefreshControl,
} from "react-native-gesture-handler";
import { useAppSize } from "@/Hooks/useSize";
import BottomFab from "@/components/bottomFab";

/* ---------------- types ---------------- */
type Folder = {
  id: string;
  name: string;
  count: number;
  icon: any;
};

type BackendFolder = {
  fld_folder_pk: string;
  fld_f_name: string;
  fld_craft_type: string;
  project_cnt: number;
};

type CraftOption = {
  id: string;
  label: string;
  icon: ImageSourcePropType;
};

const craftOptions: CraftOption[] = [
  {
    id: "C",
    label: "C",
    icon: require("@/assets/images/crochet.png"),
  },
  {
    id: "K",
    label: "K",
    icon: require("@/assets/images/knit.png"),
  },
  {
    id: "S",
    label: "S",
    icon: require("@/assets/images/sewing.png"),
  },
  {
    id: "M",
    label: "M",
    icon: require("@/assets/images/misc.png"),
  },
];

export default function FolderScreen() {
  const insets = useSafeAreaInsets();

  /* ------------ *.+ Colors +.*------------ */
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  /* ---------------- state ---------------- */
  const [folders, setFolders] = useState<Folder[]>([]);
  const folder: Folder[] = useMemo(() => folders, [folders]);

  //api query variables
  const limit = 10;
  const lastPostID = useRef<number | null>(null);
  const hasMore = useRef(true);
  const loadingMore = useRef<true | false>(false);

  //token-related variables + states
  const [tokenOkay, setTokenOkay] = useState(false);
  const alreadyAlerted = useRef(false); //preventing double-alert in dev

  //refresh
  const [refreshing, setRefreshing] = useState(false);
  const [createOrSaving, setCreateOrSaving] = useState(false);

  //folder ops
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<any>(
    require("@/assets/images/misc.png")
  );

  //folder info things
  const [noFolders, setNoFolders] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const searchTimer = useRef<number | null>(null);

  const size = useAppSize();
  const inset = useSafeAreaInsets();

  /* ---------------- functionalities ---------------- */
  //check token before doing anything
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
        console.log(e);
        alreadyAlerted.current = true;
        alert("Access denied, please log in and try again.");
        router.replace("/");
      }
    }
  };

  useEffect(() => {
    checkTokenOkay();
  }, []);

  //with good token, load up data
  useEffect(() => {
    if (!tokenOkay) {
      return;
    }
    //fetch data
    fetchData();
  }, [tokenOkay]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setFolders([]);
    lastPostID.current = null;
    hasMore.current = true;
  };

  useEffect(() => {
    if (!refreshing) return;

    const refreshNewData = async () => {
      try {
        if (searchQuery.trim().length > 0) {
          await fetchSearch(searchQuery.trim());
        } else {
          await fetchData();
        }
      } catch (e) {
        console.log("error when refreshing data", e);
      } finally {
        setRefreshing(false);
      }
    };

    refreshNewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  //collect data
  const fetchData = async () => {
    if (!tokenOkay) {
      return;
    }

    if (searchQuery.trim().length > 0) return;

    const token = await Storage.getItem("token");

    if (loadingMore.current || !hasMore.current) {
      //if already loading more data or there is no more data in database then return
      return;
    }

    loadingMore.current = true;

    try {
      const includePostID = lastPostID.current
        ? `&postID=${lastPostID.current}`
        : "";

      const res = await fetch(
        `${API_URL}/api/folder?limit=${limit}${includePostID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (res.status == 403) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Access denied, please log in and try again.");
        }
        router.replace("/");
        return;
      } else if (res.status == 404) {
        setNoFolders(true);
        return;
      } else if (!res.ok) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Whoops! Something went wrong... please try again later.");
        }
        router.replace("/");
        return;
      }

      const responseData = await res.json();

      // update with the new feed
      let tempArray: Folder[] = responseData.newFeed.map(
        (folder: BackendFolder) => ({
          id: folder.fld_folder_pk,
          name: folder.fld_f_name,
          count: folder.project_cnt,
          icon: craftOptions.find(
            (option) => option.id === folder.fld_craft_type
          )?.icon,
        })
      );

      //double check the returned folders to make sure no duplicates are put into forumData
      setFolders((prev) => {
        const existing = new Set(prev.map((f) => f.id));
        const next = tempArray.filter((f) => !existing.has(f.id));
        return [...prev, ...next];
      });

      hasMore.current = responseData.hasMore;

      if (tempArray.length > 0) {
        lastPostID.current = Number(tempArray[tempArray.length - 1].id);
      }
    } catch (e) {
      console.log("Error when trying to fetch folder data:", e);
    } finally {
      // even if fetching data fails, we will update loading more
      loadingMore.current = false;
    }
  };

  const fetchSearch = async (q: string) => {
    if (!tokenOkay) return;

    const token = await Storage.getItem("token");

    hasMore.current = false;
    lastPostID.current = null;

    try {
      const res = await fetch(
        `${API_URL}/api/folder?limit=50&q=${encodeURIComponent(q)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (res.status == 403) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Access denied, please log in and try again.");
        }
        router.replace("/");
        return;
      } else if (!res.ok) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Whoops! Something went wrong... please try again later.");
        }
        router.replace("/");
        return;
      }

      const data = await res.json();

      let mapped: Folder[] = (data.newFeed || []).map(
        (folder: BackendFolder) => ({
          id: folder.fld_folder_pk,
          name: folder.fld_f_name,
          count: folder.project_cnt,
          icon: craftOptions.find(
            (option) => option.id === folder.fld_craft_type
          )?.icon,
        })
      );

      setFolders(mapped);
      setNoFolders(mapped.length === 0);
    } catch (e) {
      console.log("Error when trying to fetch search folder data:", e);
    }
  };

  useEffect(() => {
    if (!tokenOkay) return;

    const q = searchQuery.trim();

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!q) {
      setNoFolders(false);
      setFolders([]);
      lastPostID.current = null;
      hasMore.current = true;
      loadingMore.current = false;

      setTimeout(() => {
        fetchData();
      }, 0);

      return;
    }

    searchTimer.current = setTimeout(() => {
      fetchSearch(q);
    }, 500);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, tokenOkay]);

  /* ---------------- handlers ---------------- */
  const saveRename = async () => {
    if (!editingFolder || !folderName.trim()) return;

    if (folderName.length > 20) {
      alert("Folder name is too long (must be 20 characters or less)");
      return;
    }

    await renameFolder();

    setFolders((prev) =>
      prev.map((f) =>
        f.id === editingFolder.id
          ? { ...f, name: folderName, icon: selectedIcon }
          : f
      )
    );

    setEditingFolder(null);
    setFolderName("");
  };

  const deleteFolder = async () => {
    if (!editingFolder) return;

    if (editingFolder.count > 0) {
      alert("You can only delete empty folders.");
      return;
    }

    const token = await Storage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/api/folder_delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          folderID: editingFolder.id,
          folderName: editingFolder.name,
        }),
      });

      if (response.status === 403) {
        alert("Cannot delete: This folder has projects.");
        return;
      } else if (response.status === 404) {
        alert("Cannot delete: folder does not exist");
        return;
      } else if (!response.ok) {
        alert("Server error occured. Please try again later.");
        router.back();
        return;
      }
    } catch (error) {
      console.log("Front-end error log when deleting a folder:", error);
      alert("Could not delete folder");
      return;
    }

    setFolders((prev) => prev.filter((f) => f.id !== editingFolder.id));
    setEditingFolder(null);

    alert("Empty folder successfully deleted!");
  };

  const renameFolder = async () => {
    //check token
    const token = await Storage.getItem("token");

    //login check to reduce unnecessary fetches
    if (!token) {
      alert("Hold on there... you need to login first!");
      router.replace("/login");
      return;
    }

    if (!editingFolder) return;

    //Figure out which craft to update the folder to
    const newCraftType = craftOptions.find(
      (option) => option.icon === selectedIcon
    );
    const paramCraftType = newCraftType?.id;

    try {
      const response = await fetch(`${API_URL}/api/folder_rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          folderID: editingFolder?.id,
          folderName: folderName,
          craftType: paramCraftType,
        }),
        credentials: "include",
      });

      if (response.status === 404) {
        alert("Folder does not exist.");
        return;
      } else if (!response.ok) {
        alert("Server error occured. Please try again later.");
        router.back();
        return;
      }

      alert("Folder successfully renamed!");
    } catch (error) {
      alert("Server error. Please try again later.");
      console.log("Error editing post:", error);
    }
  };

  const createFolder = async () => {
    if (!folderName.trim()) return;
    if (createOrSaving) return;
    try {
      setCreateOrSaving(true);
      const trimmed = folderName.trim();
      if (trimmed.length === 0 || trimmed.toLowerCase() === "all") {
        return;
      } else if (trimmed.length > 20) {
        alert(
          "Name is too long! Please try again with a folder name of 20 characters or less."
        );
        return;
      }

      //check for duplicate
      const alreadyExists = folders.find(
        (folder) => folder.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (alreadyExists) {
        alert("Folder name taken. Please try again with a new name!");
        return;
      }

      //deduce craft type (single char)
      const selectedCraft = craftOptions.find(
        (option) => option.icon === selectedIcon
      );
      const craftType = selectedCraft?.id ?? "M"; //misc default if needed

      //if no duplicate
      const token = await Storage.getItem("token");
      const res = await fetch(`${API_URL}/api/new-t-folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmed,
          type: craftType,
        }),
      });

      if (res.status == 404) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert(`Endpoint does not exist. Please try again later.`);
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

      const data = await res.json();

      const mappedFolder: Folder = {
        id: data.fID,
        name: data.fName,
        count: 0,
        icon: selectedIcon,
      };

      setFolders((prev) => [...prev, mappedFolder]);

      setFolderName("");
      setCreateOpen(false);
      setRefreshing(true);
    } catch (e) {
      console.log("Encountered an error:", e);
    } finally {
      setCreateOrSaving(false);
    }
  };

  const enterFolder = async (fid: string) => {
    //save folderID in local storage
    await Storage.setItem("folderID", fid);

    //move
    router.push({
      pathname: "/trackerFolder/[id]",
      params: { id: fid },
    });
  };

  /* ---------------- styles ---------------- */
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    title: {
      fontSize: size.font.largeTitleText,
      fontWeight: size.weight.title,
      textAlign: "center",
      marginBottom: 20,
      marginTop: 10,
      color: colors.text,
    },
    searchBar: {
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: colors.background,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
      padding: 12,
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      paddingVertical: 0,
      fontSize: size.font.bodyText,
    },
    folderCard: {
      width: "47%",
      backgroundColor: colors.exploreCardBackground,
      borderRadius: 18,
      padding: 16,
      alignItems: "center",
    },
    icon: {
      width: size.iconSize + 35,
      height: size.iconSize + 35,
      marginBottom: 10,
      tintColor: colors.text,
    },
    folderName: {
      fontWeight: size.weight.headline,
      fontSize: size.font.bodyText,
      color: colors.text,
    },
    count: {
      fontSize: size.font.detailText,
      color: colors.decorativeText,
      marginBottom: 6,
    },
    editText: {
      color: colors.decorativeBackground,
      fontWeight: size.weight.headline,
    },
    modalOverlay: {
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      width: "85%",
      backgroundColor: colors.exploreBackground,
      borderRadius: 20,
      padding: 20,
    },
    modalTitle: {
      fontSize: size.font.titleText,
      fontWeight: size.weight.title,
      marginBottom: 12,
      textAlign: "center",
      color: colors.text,
    },
    label: {
      fontSize: size.font.caption,
      marginBottom: 6,
      color: colors.text,
    },
    subLabel: {
      fontSize: size.font.caption,
      marginBottom: 10,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.inputContainer,
      borderRadius: 12,
      padding: 12,
      marginBottom: 15,
    },
    iconRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    iconChoice: {
      alignItems: "center",
      padding: 8,
      borderRadius: 14,
    },
    iconSelected: {
      backgroundColor: colors.secondaryButton,
      borderWidth: 0.5,
      borderColor: colors.decorativeBackground,
    },
    choiceIcon: {
      width: size.iconSize + 20,
      height: size.iconSize + 20,
      marginBottom: 6,
    },
    choiceText: {
      fontSize: size.font.detailText,
      color: colors.exploreBackground,
    },
    modalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    cancelBtn: {
      padding: 10,
      borderRadius: 12,
      width: "45%",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.warning,
    },
    createBtn: {
      padding: 10,
      backgroundColor: colors.decorativeBackground,
      borderRadius: 12,
      width: "45%",
      alignItems: "center",
    },
    deleteText: {
      color: colors.warning,
      textAlign: "center",
      fontWeight: size.weight.headline,
    },
  });

  /* ---------------- render component ---------------- */
  //need component to render folder items one by one
  const renderFolder = useCallback(
    ({ item }: { item: Folder }) => (
      <View style={styles.folderCard}>
        <Pressable
          onPress={() => {
            setEditingFolder(item);
            setFolderName(item.name);
            setSelectedIcon(item.icon);
          }}
          accessible={true}
          accessibilityHint={
            "Navigates to the edit project folder screen. Click to edit " +
            item.name +
            " project folder."
          }
          accessibilityRole={"button"}
          style={{
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "flex-end",
            position: "absolute",
            marginTop: 10,
            right: 10,
            zIndex: 2,
          }}
        >
          <Feather
            name="edit"
            size={size.iconSize}
            color={colors.decorativeBackground}
            style={{
              backgroundColor: colors.secondaryButton,
              padding: 8,
              borderRadius: 50,
            }}
          />
        </Pressable>

        <Pressable
          onPress={() => enterFolder(item.id)}
          style={{ width: "100%", alignItems: "center", marginTop: 10 }}
          accessible={true}
          accessibilityHint={
            "Navigates inside the " +
            item.name +
            " folder, allowing to view projects within."
          }
          accessibilityRole={"button"}
        >
          <Image source={item.icon} style={styles.icon} />
          <Text style={styles.folderName}>{item.name}</Text>
          <Text style={styles.count}>{item.count} projects</Text>
        </Pressable>
      </View>
    ),
    [router, styles]
  );

  /* ---------------- render ---------------- */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Text
          style={styles.title}
          accessible={true}
          accessibilityRole={"header"}
        >
          My Folders
        </Text>

        {/* search */}
        <View style={styles.searchBar}>
          <Feather
            name="search"
            size={size.iconSize - 4}
            color={colors.inputContainerPlaceholderText}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search folders"
            placeholderTextColor={colors.inputContainerPlaceholderText}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessible={true}
            accessibilityHint={
              "Allows to search for specific folders from the Project Folder page"
            }
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={10}
              accessible={true}
              accessibilityLabel={"Cancel"}
              accessibilityHint={"Double tap to cancel search."}
              accessibilityRole={"button"}
            >
              <Feather
                name="x"
                size={size.iconSize - 4}
                color={colors.inputContainerPlaceholderText}
              />
            </Pressable>
          )}
        </View>

        {/* folders */}
        <FlatList
          data={folder}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 20,
            paddingBottom: insets.bottom + 220,
          }}
          renderItem={renderFolder}
          onEndReached={() => {
            if (searchQuery.trim().length === 0) fetchData();
          }}
          ListEmptyComponent={() => {
            if (searchQuery.trim().length > 0 && noFolders) {
              return (
                <View style={{ paddingVertical: 10 }}>
                  <Text
                    style={{
                      color: colors.settingsText,
                      fontWeight: "bold",
                      textAlign: "center",
                      lineHeight: 24,
                    }}
                  >
                    No folders match “{searchQuery.trim()}”
                  </Text>
                </View>
              );
            } else if (noFolders) {
              return (
                <View style={{ paddingVertical: 10 }}>
                  <Text
                    style={{
                      color: colors.settingsText,
                      textAlign: "center",
                      lineHeight: 24,
                    }}
                  >
                    Nothing to see here... {"\n"} Create a project folder now!{" "}
                  </Text>
                </View>
              );
            }
          }}
          ListFooterComponent={() => {
            if (searchQuery.trim().length > 0) {
              return <View style={{ height: 160 }} />;
            }
            if (folder.length > 0) {
              if (!hasMore.current) {
                return (
                  <View style={{ paddingBottom: 150 }}>
                    <Text
                      style={{ color: colors.inputContainerPlaceholderText }}
                    >
                      No More Folders to Load
                    </Text>
                  </View>
                );
              } else {
                return (
                  <View style={{ paddingBottom: 150 }}>
                    <ActivityIndicator size="small" color={colors.text} />
                  </View>
                );
              }
            }
            return <View style={{ height: 160 }} />;
          }}
          ListFooterComponentStyle={{ alignItems: "center", marginTop: 15 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      </GestureHandlerRootView>

      {/* FAB */}
      <Pressable
        accessible={true}
        accessibilityLabel={"Create Project Folder"}
        accessibilityHint={
          "Navigates to the create project folder screen. Click to create project folder."
        }
        accessibilityRole={"button"}
        onPress={() => {
          setCreateOpen(true);
          setSelectedIcon(require("@/assets/images/misc.png"));
        }}
      >
        <BottomFab />
      </Pressable>

      {/* CREATE / EDIT MODAL */}
      {(createOpen || editingFolder) && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Pressable
              style={{
                flexDirection: "row",
                alignSelf: "flex-end",
                position: "absolute",
                right: 20,
                top: 20,
                zIndex: 2,
              }}
              accessible={true}
              accessibilityHint={"Exits the Create Project Folder Screen."}
              accessibilityRole={"button"}
              onPress={() => {
                setCreateOpen(false);
                setEditingFolder(null);
                setFolderName("");
              }}
            >
              <AntDesign
                name="close"
                size={size.iconSize + 4}
                color={colors.text}
              />
            </Pressable>

            <Text style={styles.modalTitle}>
              {editingFolder ? "Edit Folder" : "Create a new folder"}
            </Text>

            <Text style={styles.label}>Folder Name</Text>
            <TextInput
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Enter name"
              style={styles.input}
            />

            <Text style={styles.subLabel}>
              What kind of projects will this folder have?
            </Text>

            <View style={styles.iconRow}>
              {[
                {
                  label: "Crochet",
                  icon: require("@/assets/images/crochet.png"),
                },
                { label: "Knit", icon: require("@/assets/images/knit.png") },
                {
                  label: "Sewing",
                  icon: require("@/assets/images/sewing.png"),
                },
                { label: "Misc.", icon: require("@/assets/images/misc.png") },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  style={[
                    styles.iconChoice,
                    selectedIcon === item.icon && styles.iconSelected,
                  ]}
                  onPress={() => setSelectedIcon(item.icon)}
                  accessible={true}
                  accessibilityHint={
                    "Selects " + item.label + " as Project Folder craft type."
                  }
                  accessibilityRole={"button"}
                  accessibilityState={
                    selectedIcon === item.icon
                      ? { selected: true }
                      : { selected: false }
                  }
                >
                  <Image
                    source={item.icon}
                    style={[
                      styles.choiceIcon,
                      {
                        tintColor:
                          selectedIcon === item.icon
                            ? colors.decorativeBackground
                            : colors.text,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.choiceText,
                      {
                        color:
                          selectedIcon === item.icon
                            ? colors.decorativeBackground
                            : colors.text,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View
              style={[
                styles.modalRow,
                {
                  alignSelf: editingFolder ? undefined : "flex-end",
                },
              ]}
            >
              {editingFolder && (
                <Pressable
                  onPress={deleteFolder}
                  accessible={true}
                  accessibilityHint={
                    "Deletes " + editingFolder.name + " project folder."
                  }
                  accessibilityRole={"button"}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.deleteText}>Delete folder</Text>
                </Pressable>
              )}
              <Pressable
                style={[
                  styles.createBtn,
                  { opacity: folderName.trim().length > 0 ? 1 : 0.4 },
                ]}
                onPress={editingFolder ? saveRename : createFolder}
                disabled={createOrSaving}
                accessible={true}
                accessibilityHint={"Creates a Project Folder"}
                accessibilityRole={"button"}
              >
                <Text
                  style={{
                    color: colors.antiText,
                  }}
                >
                  {createOrSaving
                    ? "Please Wait..."
                    : editingFolder
                    ? "Save"
                    : "Create →"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
