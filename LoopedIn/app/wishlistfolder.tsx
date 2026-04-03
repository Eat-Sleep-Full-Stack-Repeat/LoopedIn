import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import API_URL from "@/utils/config";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Storage } from "../utils/storage";

type WishlistItem = {
  id: string;
  name: string;
  itemCount: number;
  category: string;
};

type Folder = {
  id: string;
  name: string;
};

const initialCategories: Folder[] = [];

const initialItems: WishlistItem[] = [];

export default function WishlistFolderScreen() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [categories, setCategories] = useState<Folder[]>(initialCategories);
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
  const [editedItemCount, setEditedItemCount] = useState("");
  const isEditing = useRef(false);
  const secondTextInput = useRef<TextInput>(null);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = items.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        query.length === 0 || item.name.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    if (selectedCategory === "All") {
      return [...result];
    }

    return result;
  }, [items, searchQuery, selectedCategory]);

  const { id } = useLocalSearchParams();

  //token-related variables + states
  const [tokenOkay, setTokenOkay] = useState(false);
  const alreadyAlerted = useRef(false); //preventing double-alert in dev
  const [loading, setLoading] = useState(false);
  const [folderLoading, setFolderLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    fetchCategories();
    fetchItems();
  }, [tokenOkay]);

  useEffect(() => {
    if (!refreshing) return;

    const refreshNewData = async () => {
      try {
        console.log("getting items for this category:", selectedCategory);
        //await fetchData();
      } catch (e) {
        console.log("error when refreshing data", e);
      } finally {
        setRefreshing(false);
      }
    };

    refreshNewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  //category fetch handler
  const fetchCategories = async () => {
    if (!tokenOkay) {
      return;
    }
    //    if (folderLoading) { return };

    //    setFolderLoading(true);
    const token = await Storage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/get-w-folders`, {
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
          alert(`Folder does not exist. Please try again later.`);
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

      //map out all folders, or skip this step if there R none :P
      if (!data.empty) {
        const mappedFolders: Folder[] = data.feed.map((folder: any) => ({
          id: folder.fld_folder_pk,
          name: folder.fld_f_name,
        }));

        setCategories(mappedFolders);
      }
    } catch (error) {
      console.log("Error when trying to fetch folder data:", error);
    }
    // finally {
    //   setFolderLoading(false);
    // }
  };

  //items fetch handler
  const fetchItems = async () => {
    if (!tokenOkay) {
      return;
    }
    if (folderLoading) {
      return;
    }

    setFolderLoading(true);
    const token = await Storage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/get-w-items`, {
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
          alert(`Folder does not exist. Please try again later.`);
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

      //map out all items, or skip this step if there R none :P
      if (!data.empty) {
        const mappedItems: WishlistItem[] = data.feed.map((inv: any) => ({
          id: inv.fld_item_pk,
          name: inv.fld_item_name,
          itemCount: inv.fld_num_items,
          category: inv.fld_f_name,
        }));

        setItems(mappedItems);
      }
    } catch (error) {
      console.log("Error when trying to fetch folder data:", error);
    } finally {
      setFolderLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (trimmed.length === 0 || trimmed.toLowerCase() === "all") {
      return;
    }

    if (trimmed.length > 20) {
      alert("Name is too long! Please use 20 characters or less.");
      return;
    }

    const duplicateCategory = categories.find(
      (category) => category.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (duplicateCategory) {
      alert("Folder name taken. Please try a different name.");
      return;
    }

    const token = await Storage.getItem("token");
    const res = await fetch(`${API_URL}/api/new-w-folder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        name: trimmed,
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
    };

    setCategories((prev) => [...prev, mappedFolder]);
    setNewCategoryName("");
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const token = await Storage.getItem("token");
    const categoryObj = categories.find(
      (category) => category.name === categoryToDelete
    );

    //check if the folder is empty:
    const checkEmpty = items.find((item) => item.category === categoryToDelete);
    if (checkEmpty !== undefined) {
      alert("This category must be empty to delete");
      return;
    }

    if (!categoryObj) {
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/delete-w-folder/${categoryObj.id}`,
        {
          method: "DELETE",
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
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert(`Folder does not exist. Please try again later.`);
        }
        return;
      } else if (!res.ok) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Whoops! Something went wrong... please try again later.");
        }
        return;
      }

      setCategories((prev) =>
        prev.filter((category) => category.name !== categoryToDelete)
      );
      setItems((prev) =>
        prev.filter((item) => item.category !== categoryToDelete)
      );

      if (selectedCategory === categoryToDelete) {
        setSelectedCategory("All");
      }

      if (editingCategory === categoryObj.id) {
        setEditingCategory(null);
        setEditedCategoryName("");
      }
    } catch (error) {
      console.log("Error when trying to delete folder:", error);
    }
  };

  const handleRenameCategory = async (categoryId: string) => {
    const trimmed = editedCategoryName.trim();
    if (trimmed.length === 0 || trimmed.toLowerCase() === "all") {
      return;
    }

    if (trimmed.length > 20) {
      alert("Name is too long! Please use 20 characters or less.");
      return;
    }

    const previousCategory = categories.find(
      (category) => category.id === categoryId
    );
    if (!previousCategory) {
      return;
    }

    const duplicateCategory = categories.find(
      (category) =>
        category.name.toLowerCase() === trimmed.toLowerCase() &&
        category.id !== categoryId
    );

    if (duplicateCategory) {
      return;
    }

    const token = await Storage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/rename-w-folder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          folderId: categoryId,
          name: trimmed,
        }),
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
          alert(`Folder does not exist. Please try again later.`);
        }
        return;
      } else if (!res.ok) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Whoops! Something went wrong... please try again later.");
        }
        return;
      }

      setCategories((prev) =>
        prev.map((category) =>
          category.id === categoryId ? { ...category, name: trimmed } : category
        )
      );
      setItems((prev) =>
        prev.map((item) =>
          item.category === previousCategory.name
            ? { ...item, category: trimmed }
            : item
        )
      );

      if (selectedCategory === previousCategory.name) {
        setSelectedCategory(trimmed);
      }

      setEditingCategory(null);
      setEditedCategoryName("");
    } catch (error) {
      console.log("Error when trying to rename folder:", error);
    }
  };

  const handleAddItem = async () => {
    const trimmed = newItemName.trim();
    if (trimmed.length === 0) {
      return;
    }

    if (trimmed.length > 40) {
      alert("The name of the item must be less than 40 characters");
      return;
    }

    //Add item to the backend

    if (!isAddingItem) {
      //check if item is still being added -> should be true all the time
      console.log("User is no longer adding an item");
      return;
    }

    if (selectedCategory === "All") {
      alert("Item has category 'All' -> cannot add this item");
      return;
    }
    //Send item name and category to backend

    //token
    const token = await Storage.getItem("token");

    const newItem = {
      itemName: trimmed.trim(),
      itemCategory: selectedCategory.trim(),
    };

    try {
      const response = await fetch(`${API_URL}/api/add-wishlist-item`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newItem),
      });

      //Get success code
      if (!response.ok) {
        alert("Could not add item. Try again later");
        return;
      }

      const data = await response.json();

      setItems((prev) => [
        ...prev,
        {
          id: data.item.fld_item_pk,
          name: trimmed,
          itemCount: 0,
          category: selectedCategory === "All" ? "General" : selectedCategory,
        },
      ]);
    } catch (error) {
      console.log("Error adding wishlist item: ", error);
      alert("Could not add wishlist item. Please try again later.");
    } finally {
      setNewItemName("");
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const token = await Storage.getItem("token");

      const response = await fetch(`${API_URL}/api/delete-wishlist-item`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ itemID: itemId }),
      });

      if (!response.ok) {
        alert("Error while removing item. Try again later.");
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (e) {
      console.log("Error when deleting wishlist item: ", e);
      return;
    } finally {
      if (editingItemId === itemId) {
        setEditingItemId(null);
        setEditedItemName("");
      }
    }
  };

  const handleEditItem = async (item: WishlistItem) => {
    try {
      if (isEditing.current) {
        return;
      }
      isEditing.current = true;

      const itemId = item.id;
      let updateName = true;
      let updateCount = true;
      let regex = /^\d+$/;
      const token = await Storage.getItem("token");

      const trimmed = editedItemName.trim();
      if (trimmed.length === 0) {
        return;
      }

      if (trimmed.length > 40) {
        alert("Title of item must be less than 40 characters");
        return;
      }

      const newCount = editedItemCount.trim();

      if (!regex.test(newCount)) {
        //The entered quantity is not a digit
        alert("Please enter a whole number for quantity");
        return;
      }

      if (Number(newCount) > 999) {
        alert("Quantity must not exceed 999");
        return;
      }

      if (item.itemCount === Number(newCount)) {
        // Item count was not changed
        updateCount = false;
      }

      if (item.name === trimmed) {
        //The entered name is not new
        updateName = false;
      }

      if (!updateCount && !updateName) {
        console.log("Nothing to update!");
        return;
      }

      const response = await fetch(`${API_URL}/api/edit-wishlist-item`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemID: itemId,
          newName: trimmed,
          newCount: newCount,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        alert("Server error occured. Please try again later.");
        return;
      }

      setItems((prev) =>
        prev.map((updateItem) =>
          updateItem.id === itemId
            ? {
                ...updateItem,
                name: updateName ? trimmed : updateItem.name,
                itemCount: updateCount
                  ? Number(newCount)
                  : updateItem.itemCount,
              }
            : updateItem
        )
      );
    } catch (e) {
      alert("Unable to update item. Please try again later");
      return;
    } finally {
      setEditingItemId(null);
      setEditedItemName("");
      setEditedItemCount("");
      isEditing.current = false;
    }
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
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessible={true}
            accessibilityLabel={"Go Back"}
            accessibilityHint={"Navigates back to the previous page."}
            accessibilityRole={"button"}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text
            style={[styles.title, { color: colors.text }]}
            accessible={true}
            accessibilityRole={"header"}
          >
            Wishlist
          </Text>
        </View>
        <View style={styles.headerSide}>
          <Pressable
            style={styles.headerActionButton}
            onPress={() => {
              if (isCategoryEditMode && editingCategory) {
                handleRenameCategory(editingCategory);
              }

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
            accessible={true}
            accessibilityLabel={isCategoryEditMode ? "Stop editing" : "Edit"}
            accessibilityHint={
              isCategoryEditMode
                ? "Double tap to disable editing mode."
                : "Double tap to delete and edit wishlist categories and items."
            }
            accessibilityRole={"button"}
            accessibilityState={
              isCategoryEditMode ? { checked: true } : { checked: false }
            }
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
            accessible={true}
            accessibilityHint={
              selectedCategory === "All"
                ? "Shows all wishlist items."
                : "Double tap to show all wishlist items."
            }
            accessibilityRole={"tab"}
            accessibilityState={
              selectedCategory === "All"
                ? { checked: true }
                : { checked: false }
            }
          >
            <Text
              style={[
                styles.categoryTabText,
                {
                  color:
                    selectedCategory === "All"
                      ? colors.decorativeText
                      : colors.text,
                },
              ]}
            >
              All
            </Text>
          </Pressable>

          {categories.map((category) => {
            const isSelected = selectedCategory === category.name;

            if (editingCategory === category.id) {
              return (
                <TextInput
                  key={`${category.id}-edit`}
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
                  maxLength={20}
                  onSubmitEditing={() => handleRenameCategory(category.id)}
                  onBlur={() => handleRenameCategory(category.id)}
                  autoFocus
                />
              );
            }

            return (
              <View
                key={category.id}
                style={[
                  styles.categoryTab,
                  {
                    backgroundColor: isSelected
                      ? colors.decorativeBackground
                      : colors.boxBackground,
                    borderColor: colors.topBackground,
                  },
                ]}
              >
                <View style={styles.categoryTabContent}>
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      if (isCategoryEditMode) {
                        setEditingCategory(category.id);
                        setEditedCategoryName(category.name);
                        return;
                      }
                      setSelectedCategory(category.name);
                    }}
                    accessible={true}
                    accessibilityHint={
                      selectedCategory === category.name
                        ? "Shows wishlist items within the " +
                          category.name +
                          " category"
                        : "Double tap to show wishlist items within the " +
                          category.name +
                          " category"
                    }
                    accessibilityRole={"tab"}
                    accessibilityState={
                      selectedCategory === category.name
                        ? { checked: true }
                        : { checked: false }
                    }
                  >
                    <View
                      style={[
                        styles.editableCategoryBox,
                        {
                          borderWidth: isCategoryEditMode ? 1 : 0,
                          borderColor: colors.text,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryTabText,
                          {
                            color: isSelected
                              ? colors.decorativeText
                              : colors.text,
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </View>
                  </Pressable>
                  {isCategoryEditMode && (
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        handleDeleteCategory(category.name);
                      }}
                      hitSlop={6}
                      style={styles.categoryDeleteButton}
                      accessible={true}
                      accessibilityLabel={"Delete"}
                      accessibilityHint={
                        "Delete " +
                        category.name +
                        " category and its wishlist items"
                      }
                      accessibilityRole={"button"}
                    >
                      <Feather
                        name="x"
                        size={22}
                        color={isSelected ? colors.decorativeText : colors.text}
                      />
                    </Pressable>
                  )}
                </View>
              </View>
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
              maxLength={20}
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
            accessible={true}
            accessibilityLabel={"Add category"}
            accessibilityHint={"Add a craft category to hold wishlist items"}
            accessibilityRole={"button"}
          >
            <Feather name="plus" size={14} color={colors.text} />
          </Pressable>
        </ScrollView>

        <View style={[styles.searchBar, { borderColor: colors.topBackground }]}>
          <Feather
            name="search"
            size={16}
            color={colors.settingsText}
            accessible={false}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search wishlist"
            placeholderTextColor={colors.settingsText}
            style={[styles.searchInput, { color: colors.text }]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={10}
              accessible={true}
              accessibilityLabel={"Exit"}
              accessibilityHint={"Cancels and exits search"}
              accessibilityRole={"button"}
            >
              <Feather name="x" size={22} color={colors.settingsText} />
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
              style={[
                styles.addItemInput,
                { borderColor: colors.topBackground, color: colors.text },
              ]}
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyMessage, { color: colors.settingsText }]}>
              {selectedCategory === "All"
                ? "Welcome to your Wishlist! Create a folder and save items you want to grab later."
                : "Nothing here yet..."}
            </Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
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
                  setEditedItemCount(String(item.itemCount));
                }}
              >
                {editingItemId === item.id ? (
                  <View>
                    <TextInput
                      value={editedItemName}
                      onChangeText={setEditedItemName}
                      maxLength={40}
                      placeholder="Rename item"
                      placeholderTextColor={colors.settingsText}
                      style={[
                        styles.renameItemInput,
                        {
                          borderColor: colors.exploreBorder,
                          backgroundColor:
                            index % 2 === 0
                              ? colors.boxBackground
                              : colors.topBackground,
                          color: colors.text,
                        },
                      ]}
                      autoCorrect={false}
                      autoCapitalize="words"
                      returnKeyType="next"
                      onSubmitEditing={() => secondTextInput.current?.focus()}
                      blurOnSubmit={false}
                      autoFocus
                    />
                    <TextInput
                      ref={secondTextInput}
                      value={editedItemCount}
                      onChangeText={setEditedItemCount}
                      placeholder="Quantity"
                      maxLength={3}
                      placeholderTextColor={colors.settingsText}
                      style={[
                        styles.renameItemInput,
                        {
                          borderColor: colors.exploreBorder,
                          backgroundColor:
                            index % 2 === 0
                              ? colors.boxBackground
                              : colors.topBackground,
                          color: colors.text,
                        },
                      ]}
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={() => handleEditItem(item)}
                      onBlur={() => handleEditItem(item)}
                      blurOnSubmit={true}
                    />
                  </View>
                ) : (
                  <View>
                    <Text
                      style={[styles.itemName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.itemMeta, { color: colors.settingsText }]}
                    >
                      {item.itemCount} items
                    </Text>
                  </View>
                )}
              </Pressable>
              {isCategoryEditMode ? (
                <Pressable
                  onPress={() => handleDeleteItem(item.id)}
                  hitSlop={8}
                  style={styles.itemDeleteButton}
                  accessible={true}
                  accessibilityLabel={"Delete"}
                  accessibilityHint={
                    "Delete " + item.name + " category and its wishlist items"
                  }
                  accessibilityRole={"button"}
                >
                  <Feather name="x" size={22} color={colors.text} />
                </Pressable>
              ) : (
                <Feather
                  name="more-vertical"
                  size={18}
                  color={colors.settingsText}
                  style={styles.cardMenuIcon}
                  accessible={true}
                  accessibilityLabel={"Item Menu"}
                  accessiblilityHint={"Double tap to see more."}
                />
              )}
            </View>
          </View>
        )}
      />

      {!isCategoryEditMode && selectedCategory !== "All" && (
        <Pressable
          style={[
            styles.fab,
            {
              backgroundColor: colors.decorativeBackground,
              bottom: insets.bottom + 24,
            },
          ]}
          onPress={() => setIsAddingItem(true)}
          accessible={true}
          accessibilityLabel={"Add Wishlist Item"}
          accessibilityHint={
            "Double tap to add a wishlist item under " +
            selectedCategory +
            " category."
          }
          accessibilityRole={"button"}
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
  editableCategoryBox: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
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
  emptyState: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyMessage: {
    textAlign: "center",
  },
});