import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import BottomNavButton from "@/components/bottomNavBar";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";

type Folder = {
  id: string;
  name: string;
  count: number;
};

export default function MyStuffScreen() {
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] =
    React.useState<"all" | "inventory" | "wishlist">("all");

  const [folders, setFolders] = React.useState<Folder[]>([
    { id: "1", name: "Inventory", count: 3 },
    { id: "2", name: "Wishlist", count: 0 },
  ]);

  const [editingFolder, setEditingFolder] = React.useState<Folder | null>(null);
  const [newName, setNewName] = React.useState("");

  const toggleFilter = () => {
    if (filter === "all") setFilter("inventory");
    else if (filter === "inventory") setFilter("wishlist");
    else setFilter("all");
  };

  const openEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setNewName(folder.name);
  };

  const saveRename = () => {
    if (!editingFolder || !newName.trim()) return;

    setFolders((prev) =>
      prev.map((f) =>
        f.id === editingFolder.id ? { ...f, name: newName } : f
      )
    );

    setEditingFolder(null);
  };

  const deleteFolder = () => {
    if (!editingFolder) return;

    if (editingFolder.count > 0) {
      Alert.alert("Cannot Delete", "You can only delete empty folders.");
      return;
    }

    setFolders((prev) =>
      prev.filter((f) => f.id !== editingFolder.id)
    );

    setEditingFolder(null);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        My Stuff
      </Text>

      {/* Search */}
      <View
        style={[
          styles.searchBar,
          {
            borderColor: colors.topBackground,
            backgroundColor: colors.boxBackground,
          },
        ]}
      >
        <Feather name="search" size={16} color={colors.settingsText} />
        <TextInput
          placeholder="Search inventory or wishlist"
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.text }]}
          placeholderTextColor={colors.settingsText}
          underlineColorAndroid="transparent"
        />
        <Pressable style={{ marginLeft: "auto" }} onPress={toggleFilter}>
          <Feather
            name="sliders"
            size={18}
            color={
              filter === "all"
                ? colors.settingsText
                : colors.decorativeBackground
            }
          />
        </Pressable>
      </View>

      <Text style={[styles.filterLabel, { color: colors.settingsText }]}>
        {filter === "all"
          ? "Searching: Inventory + Wishlist"
          : filter === "inventory"
          ? "Searching: Inventory only"
          : "Searching: Wishlist only"}
      </Text>

      {/* Folder Cards */}
      {folders.map((folder) => (
        <View
          key={folder.id}
          style={[
            styles.card,
            {
              backgroundColor: colors.boxBackground,
              borderColor: colors.topBackground,
            },
          ]}
        >
          <Pressable
            style={styles.menuButton}
            onPress={() => openEdit(folder)}
          >
            <Feather
              name="more-vertical"
              size={20}
              color={colors.settingsText}
            />
          </Pressable>

          <Feather
            name={folder.name === "Inventory" ? "archive" : "shopping-cart"}
            size={36}
            color={colors.text}
          />

          <Text style={[styles.cardText, { color: colors.text }]}>
            {folder.name}
          </Text>
          <Text style={[styles.countText, { color: colors.settingsText }]}>
            {folder.count} projects
          </Text>
        </View>
      ))}

      {/* Edit Modal */}
      <Modal visible={!!editingFolder} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modal,
              { backgroundColor: colors.boxBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Folder
            </Text>

            <TextInput
              value={newName}
              onChangeText={setNewName}
              style={[
                styles.input,
                {
                  backgroundColor: colors.topBackground,
                  color: colors.text,
                },
              ]}
              placeholder="Folder name"
              placeholderTextColor={colors.settingsText}
            />

            <View style={styles.modalRow}>
              <Pressable
                style={[
                  styles.cancelBtn,
                  { backgroundColor: colors.topBackground },
                ]}
                onPress={() => setEditingFolder(null)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.decorativeBackground },
                ]}
                onPress={saveRename}
              >
                <Text style={{ color: colors.decorativeText }}>Save</Text>
              </Pressable>
            </View>

            <Pressable onPress={deleteFolder}>
              <Text style={[styles.deleteText]}>
                Delete Folder
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BottomNavButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  searchBar: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 5,
  },
  card: {
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
    borderWidth: 1,
  },
  menuButton: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  cardText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  countText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
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
  },
  saveBtn: {
    padding: 10,
    borderRadius: 12,
    width: "45%",
    alignItems: "center",
  },
  deleteText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "600",
  },
});