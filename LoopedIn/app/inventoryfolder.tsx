import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type InventoryItem = {
  id: string;
  name: string;
  itemCount: number;
  category: string;
};

export default function SingleFolderScreen() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItemName, setEditedItemName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = items.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch = query.length === 0 || item.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
    if (selectedCategory === "All") {
      return [...result].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
    }
    return result;
  }, [items, searchQuery, selectedCategory]);

  const handleAddItem = () => {
    const trimmed = newItemName.trim();
    if (trimmed.length === 0) {
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: trimmed,
        itemCount: 0,
        category: selectedCategory === "All" ? "Etc" : selectedCategory,
      },
    ]);

    setNewItemName("");
    setIsAddingItem(false);
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed.length === 0 || trimmed.toLowerCase() === "all") {
      return;
    }

    const existingCategory = categories.find(
      (category) => category.toLowerCase() === trimmed.toLowerCase()
    );
    if (existingCategory) {
      setSelectedCategory(existingCategory);
      setNewCategoryName("");
      setIsAddingCategory(false);
      return;
    }

    setCategories((prev) => [...prev, trimmed]);
    setSelectedCategory(trimmed);
    setNewCategoryName("");
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    setCategories((prev) => prev.filter((category) => category !== categoryToDelete));
    setItems((prev) =>
      prev.map((item) =>
        item.category === categoryToDelete ? { ...item, category: "Etc" } : item
      )
    );
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory("All");
    }
    if (editingCategory === categoryToDelete) {
      setEditingCategory(null);
      setEditedCategoryName("");
    }
  };

  const handleRenameCategory = (oldCategoryName: string) => {
    const trimmed = editedCategoryName.trim();
    if (trimmed.length === 0 || trimmed.toLowerCase() === "all") {
      return;
    }

    const duplicateCategory = categories.find(
      (category) =>
        category.toLowerCase() === trimmed.toLowerCase() &&
        category.toLowerCase() !== oldCategoryName.toLowerCase()
    );
    if (duplicateCategory) {
      return;
    }

    setCategories((prev) =>
      prev.map((category) => (category === oldCategoryName ? trimmed : category))
    );
    setItems((prev) =>
      prev.map((item) =>
        item.category === oldCategoryName ? { ...item, category: trimmed } : item
      )
    );
    if (selectedCategory === oldCategoryName) {
      setSelectedCategory(trimmed);
    }
    setEditingCategory(null);
    setEditedCategoryName("");
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    if (editingItemId === itemId) {
      setEditingItemId(null);
      setEditedItemName("");
    }
  };

  const handleRenameItem = (itemId: string) => {
    const trimmed = editedItemName.trim();
    if (trimmed.length === 0) {
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, name: trimmed } : item))
    );
    setEditingItemId(null);
    setEditedItemName("");
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 8 },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerSide}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.text }]}>Inventory</Text>
        </View>
        <View style={styles.headerSide}>
          <Pressable
            style={styles.headerActionButton}
            onPress={() => {
              setIsCategoryEditMode((prev) => {
                const next = !prev;
                if (!next) {
                  setEditingCategory(null);
                  setEditedCategoryName("");
                  setEditingItemId(null);
                  setEditedItemName("");
                }
                return next;
              });
              setIsAddingCategory(false);
              setIsAddingItem(false);
            }}
          >
            <Feather
              name={isCategoryEditMode ? "check" : "grid"}
              size={18}
              color={colors.text}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <Pressable
            style={[
              styles.categoryTab,
              {
                backgroundColor:
                  selectedCategory === "All"
                    ? colors.decorativeBackground
                    : colors.boxBackground,
                borderColor: colors.topBackground,
              },
            ]}
            onPress={() => setSelectedCategory("All")}
          >
            <Text
              style={[
                styles.categoryTabText,
                {
                  color:
                    selectedCategory === "All" ? colors.decorativeText : colors.text,
                },
              ]}
            >
              All
            </Text>
          </Pressable>

          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            if (editingCategory === category) {
              return (
                <TextInput
                  key={`${category}-edit`}
                  value={editedCategoryName}
                  onChangeText={setEditedCategoryName}
                  placeholder="Rename"
                  placeholderTextColor={colors.settingsText}
                  style={[
                    styles.renameCategoryInput,
                    { borderColor: colors.topBackground, color: colors.text },
                  ]}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={() => handleRenameCategory(category)}
                  onBlur={() => {
                    setEditingCategory(null);
                    setEditedCategoryName("");
                  }}
                  autoFocus
                />
              );
            }

            return (
              <Pressable
                key={category}
                style={[
                  styles.categoryTab,
                  {
                    backgroundColor: isSelected
                      ? colors.decorativeBackground
                      : colors.boxBackground,
                    borderColor: colors.topBackground,
                  },
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                }}
                onLongPress={() => {
                  if (!isCategoryEditMode) {
                    return;
                  }
                  setEditingCategory(category);
                  setEditedCategoryName(category);
                }}
              >
                <View style={styles.categoryTabContent}>
                  <Text
                    style={[
                      styles.categoryTabText,
                      { color: isSelected ? colors.decorativeText : colors.text },
                    ]}
                  >
                    {category}
                  </Text>
                  {isCategoryEditMode && (
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        handleDeleteCategory(category);
                      }}
                      hitSlop={6}
                      style={styles.categoryDeleteButton}
                    >
                      <Feather
                        name="x"
                        size={12}
                        color={isSelected ? colors.decorativeText : colors.text}
                      />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })}

          {isAddingCategory && (
            <TextInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Category"
              placeholderTextColor={colors.settingsText}
              style={[
                styles.newCategoryInput,
                { borderColor: colors.topBackground, color: colors.text },
              ]}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAddCategory}
              onBlur={() => {
                if (newCategoryName.trim().length === 0) {
                  setIsAddingCategory(false);
                }
              }}
              autoFocus
            />
          )}

          <Pressable
            style={[
              styles.categoryTab,
              {
                backgroundColor: colors.boxBackground,
                borderColor: colors.topBackground,
              },
            ]}
            onPress={() => {
              if (isCategoryEditMode) {
                return;
              }
              setIsAddingCategory(true);
            }}
          >
            <Feather name="plus" size={14} color={colors.text} />
          </Pressable>
        </ScrollView>

        <View style={[styles.searchBar, { borderColor: colors.topBackground }]}>
          <Feather name="search" size={16} color={colors.settingsText} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items"
            placeholderTextColor={colors.settingsText}
            style={[styles.searchInput, { color: colors.text }]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
              <Feather name="x" size={16} color={colors.settingsText} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          isAddingItem ? (
            <TextInput
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Item name"
              placeholderTextColor={colors.settingsText}
              style={[styles.addItemInput, { borderColor: colors.topBackground, color: colors.text }]}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleAddItem}
              onBlur={() => {
                if (newItemName.trim().length === 0) {
                  setIsAddingItem(false);
                }
              }}
              autoFocus
            />
          ) : null
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.itemCard,
              {
                backgroundColor:
                  index % 2 === 0 ? colors.boxBackground : colors.topBackground,
                borderColor: colors.topBackground,
              },
            ]}
          >
            <View style={styles.itemRow}>
              <Pressable
                style={styles.itemTextBlock}
                onPress={() => {
                  if (!isCategoryEditMode) {
                    return;
                  }
                  setEditingItemId(item.id);
                  setEditedItemName(item.name);
                }}
              >
                {editingItemId === item.id ? (
                  <TextInput
                    value={editedItemName}
                    onChangeText={setEditedItemName}
                    placeholder="Rename item"
                    placeholderTextColor={colors.settingsText}
                    style={[
                      styles.renameItemInput,
                      {
                        borderColor: colors.exploreBorder,
                        backgroundColor:
                          index % 2 === 0 ? colors.boxBackground : colors.topBackground,
                        color: colors.text,
                      },
                    ]}
                    autoCorrect={false}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={() => handleRenameItem(item.id)}
                    onBlur={() => {
                      setEditingItemId(null);
                      setEditedItemName("");
                    }}
                    autoFocus
                  />
                ) : (
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                )}
                <Text style={[styles.itemMeta, { color: colors.settingsText }]}>
                  {item.itemCount} items
                </Text>
              </Pressable>
              {isCategoryEditMode ? (
                <Pressable
                  onPress={() => handleDeleteItem(item.id)}
                  hitSlop={8}
                  style={styles.itemDeleteButton}
                >
                  <Feather name="x" size={16} color={colors.text} />
                </Pressable>
              ) : (
                <Feather
                  name="more-vertical"
                  size={18}
                  color={colors.settingsText}
                  style={styles.cardMenuIcon}
                />
              )}
            </View>
          </View>
        )}
      />

      {!isCategoryEditMode && (
        <Pressable
          style={[
            styles.fab,
            {
              backgroundColor: colors.decorativeBackground,
              bottom: insets.bottom + 24,
            },
          ]}
          onPress={() => setIsAddingItem(true)}
        >
          <Feather name="plus" size={24} color={colors.decorativeText} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 24,
  },
  headerSide: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    paddingRight: 8,
    paddingVertical: 2,
  },
  headerActionButton: {
    paddingVertical: 2,
    paddingLeft: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  filterSection: {
    gap: 20,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 0,
    alignItems: "center",
  },
  newCategoryInput: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 110,
  },
  categoryTab: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    minHeight: 34,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryDeleteButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  renameCategoryInput: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 120,
  },
  categoryTabText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: true,
  },
  searchBar: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  listContent: {
    gap: 10,
  },
  addItemInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  itemCard: {
    width: "100%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemTextBlock: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 8,
  },
  renameItemInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  itemDeleteButton: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMenuIcon: {
    width: 18,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
