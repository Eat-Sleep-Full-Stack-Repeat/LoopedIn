import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNavButton from "@/components/bottomNavBar";
import { Feather } from "@expo/vector-icons";

/* ---------------- types ---------------- */
type Folder = {
  id: string;
  name: string;
  count: number;
  icon: any;
};

export default function FolderScreen() {
  const insets = useSafeAreaInsets();

  /* ---------------- state ---------------- */
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: "1",
      name: "Crochet",
      count: 12,
      icon: require("@/assets/images/crochet.png"),
    },
    {
      id: "2",
      name: "Knit",
      count: 6,
      icon: require("@/assets/images/knit.png"),
    },
    {
      id: "3",
      name: "Sewing",
      count: 2,
      icon: require("@/assets/images/sewing.png"),
    },
    {
      id: "4",
      name: "Miscellaneous",
      count: 0,
      icon: require("@/assets/images/misc.png"),
    },
  ]);

  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<any>(
    require("@/assets/images/misc.png")
  );

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

  /* ---------------- render ---------------- */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>My Folders</Text>

      {/* search */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color="#888" />
        <Text style={{ color: "#888" }}>Search folders</Text>
      </View>

      {/* folders */}
      <FlatList
        data={folders}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}
        renderItem={({ item }) => (
          <View style={styles.folderCard}>
            <Image source={item.icon} style={styles.icon} />
            <Text style={styles.folderName}>{item.name}</Text>
            <Text style={styles.count}>{item.count} projects</Text>

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
        )}
      />

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
