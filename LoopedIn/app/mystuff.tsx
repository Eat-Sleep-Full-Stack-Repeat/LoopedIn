import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

  const folders: Folder[] = [
    { id: "1", name: "Inventory", count: 3 },
    { id: "2", name: "Wishlist", count: 0 },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 20 },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        My Stuff
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
          <Image
            source={
              folder.name === "Inventory"
                ? require("@/assets/images/inventory.png")
                : require("@/assets/images/wishlist.png")
            }
            style={styles.folderIcon}
          />

          <Text style={[styles.cardText, { color: colors.text }]}>
            {folder.name}
          </Text>

          <Text style={[styles.countText, { color: colors.settingsText }]}>
            {folder.count}{" "}
            {folder.name.toLowerCase()}{" "}
            {folder.count === 1 ? "item" : "items"}
          </Text>
        </View>
      ))}

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
    marginBottom: 30,
  },
  card: {
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
  },
  folderIcon: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 10,
  },
  cardText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
  },
  countText: {
    fontSize: 14,
    marginTop: 4,
  },
});
