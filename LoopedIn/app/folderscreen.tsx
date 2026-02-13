import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import BottomNavButton from "@/components/bottomNavBar";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import API_URL from "@/utils/config";
import { Storage } from "../utils/storage";
import { GestureHandlerRootView, RefreshControl } from "react-native-gesture-handler";

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
}

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
    icon: require("@/assets/images/misc.png")
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

  //folder ops
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<any>(
    require("@/assets/images/misc.png")
  );

  //folder info things
  const [noFolders, setNoFolders] = useState(false)

  
  /* ---------------- functionalities ---------------- */
  //check token before doing anything
  const checkTokenOkay = async () => {
    try{
      const token = await Storage.getItem("token");
      if (!token) {
        throw new Error("no token");
      }
      else{
        setTokenOkay(true);
      }
  }
    catch(e){
      if (!alreadyAlerted.current) {
        console.log(e)
        alreadyAlerted.current = true;
        alert("Access denied, please log in and try again.");
        router.replace("/");
      }
    }
  }

  useEffect(() => {
    checkTokenOkay();
  }, []);

  //with good token, load up data
  useEffect(() => {
    if (!tokenOkay) { return };
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
        await fetchData();
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
  const fetchData = async() => {
    if (!tokenOkay) { return };
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
      }

      else if (res.status == 404) {
        setNoFolders(true);
        return;
      }

      else if (!res.ok) {
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
          icon: craftOptions.find((option) => option.id === folder.fld_craft_type)?.icon,
        })
      );

      //double check the returned folders to make sure no duplicates are put into forumData
      let filteredArray: Folder[] = tempArray.filter(
        (folder) => !folders.some((checkFolder) => checkFolder.id === folder.id)
      );


      setFolders((prev) => [...prev, ...filteredArray]);
      hasMore.current = (responseData.hasMore);

      lastPostID.current = Number(tempArray[tempArray.length - 1].id);

    } 
    catch (e) {
      console.log("Error when trying to fetch folder data:", e);
    } 
    finally {
      // even if fetching data fails, we will update loading more
      loadingMore.current = false;
    }

  }


  /* ---------------- handlers ---------------- */
  const saveRename = () => {
    if (!editingFolder || !folderName.trim()) return;

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

  const deleteFolder = () => {
    if (!editingFolder) return;

    if (editingFolder.count > 0) {
      alert("You can only delete empty folders.");
      return;
    }

    setFolders((prev) => prev.filter((f) => f.id !== editingFolder.id));
    setEditingFolder(null);
  };

  const createFolder = () => {
    if (!folderName.trim()) return;

    setFolders((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: folderName,
        count: 0,
        icon: selectedIcon,
      },
    ]);

    setFolderName("");
    setCreateOpen(false);
  };

  /* ---------------- render component ---------------- */
  //need component to render folder items one by one
  const renderFolder = useCallback(
    ({ item }: { item: Folder }) => (
      <View style={styles.folderCard}>
        <Pressable 
          onPress={() => router.push({
            pathname: "/trackerFolder/[id]",
            params: {id: item.id}
          })}
          style={{alignItems: "center"}}
        >
          <Image source={item.icon} style={styles.icon} />
          <Text style={styles.folderName}>{item.name}</Text>
          <Text style={styles.count}>{item.count} projects</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setEditingFolder(item);
            setFolderName(item.name);
            setSelectedIcon(item.icon);
          }}
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>
    ),
    [
      router,
      styles,
    ]
  );


  /* ---------------- render ---------------- */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Text style={styles.title}>My Folders</Text>

        {/* search */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#888" />
          <Text style={{ color: "#888" }}>Search folders</Text>
        </View>

        {/* folders */}
        <FlatList
          data={folder}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}
          renderItem={renderFolder}
          onEndReached={fetchData}
          ListEmptyComponent={() => {
            if (loadingMore.current) {
              return <ActivityIndicator size="small" color={colors.text} />;
            }
            else if (noFolders) {
              return (
                <View style={{paddingVertical: 10}}>
                  <Text style={{color: colors.settingsText, fontWeight: "bold", textAlign: "center", lineHeight: 24}}> 
                    Nothing to see here... {"\n"} Create a project folder now! </Text>
                </View>
              )
            }
            else {
              return (
                <View style={{ paddingVertical: 40 }}>
                  <Text style={{ color: colors.settingsText, fontWeight: "bold", textAlign: "center" }}>
                    Loading...
                  </Text>
                </View>
              );
            }
          }}
          ListFooterComponent={() => {
            if (folder.length > 0) {
              if (!hasMore.current) {
                return (
                  <View style={{ paddingBottom: 150 }}>
                    <Text style={{ color: colors.text }}>No More Folders to Load</Text>
                  </View>
                );
              } 
              else {
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      </GestureHandlerRootView>

      {/* bottom nav */}
      <BottomNavButton />

      {/* FAB */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 100 }]}
        onPress={() => {
          setCreateOpen(true);
          setSelectedIcon(require("@/assets/images/misc.png"));
        }}
      >
        <Feather name="plus" size={26} color="#000" />
      </Pressable>

      {/* CREATE / EDIT MODAL */}
      {(createOpen || editingFolder) && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
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
                { label: "Crochet", icon: require("@/assets/images/crochet.png") },
                { label: "Knit", icon: require("@/assets/images/knit.png") },
                { label: "Sewing", icon: require("@/assets/images/sewing.png") },
                { label: "Misc.", icon: require("@/assets/images/misc.png") },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  style={[
                    styles.iconChoice,
                    selectedIcon === item.icon && styles.iconSelected,
                  ]}
                  onPress={() => setSelectedIcon(item.icon)}
                >
                  <Image source={item.icon} style={styles.choiceIcon} />
                  <Text style={styles.choiceText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setCreateOpen(false);
                  setEditingFolder(null);
                  setFolderName("");
                }}
              >
                <Text>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.createBtn}
                onPress={editingFolder ? saveRename : createFolder}
              >
                <Text style={{ color: "#fff" }}>
                  {editingFolder ? "Save" : "Create →"}
                </Text>
              </Pressable>
            </View>

            {editingFolder && (
              <Pressable onPress={deleteFolder}>
                <Text style={styles.deleteText}>Delete folder</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F2EA",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 15,
    marginTop: 18,
    color: "#111",
  },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  folderCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
  },
  icon: {
    width: 42,
    height: 42,
    marginBottom: 10,
  },
  folderName: {
    fontWeight: "600",
    fontSize: 14,
    color: "#111",
  },
  count: {
    fontSize: 12,
    color: "#777",
    marginBottom: 6,
  },
  editText: {
    color: "#7B61FF",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#C9B6F2",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    color: "#444",
  },
  subLabel: {
    fontSize: 13,
    marginBottom: 10,
    color: "#444",
  },
  input: {
    backgroundColor: "#EFEFEF",
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
    backgroundColor: "#E6DDF9",
  },
  choiceIcon: {
    width: 32,
    height: 32,
    marginBottom: 6,
  },
  choiceText: {
    fontSize: 11,
    color: "#333",
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cancelBtn: {
    padding: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    width: "45%",
    alignItems: "center",
  },
  createBtn: {
    padding: 10,
    backgroundColor: "#C9B6F2",
    borderRadius: 12,
    width: "45%",
    alignItems: "center",
  },
  deleteText: {
    color: "red",
    textAlign: "center",
    fontWeight: "600",
    marginTop: 10,
  },
});
