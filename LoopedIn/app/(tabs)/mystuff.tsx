import React from "react";
import {useState, useEffect, useRef, useCallback} from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { Storage } from "../../utils/storage";
import API_URL from "@/utils/config";

type Folder = {
  id: string;
  name: string;
  count: number;
};

export default function MyStuffScreen() {
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();

  const [inventoryCount, setInventoryCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  //const [tokenOkay, setTokenOkay] = useState(false);
  const alreadyAlerted = useRef(false); //preventing double-alert in dev

  //token check + reload after navigtion
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const token = await Storage.getItem("token");
          if (!token) throw new Error("no token");

          await findNumItems(token);
        } catch (e) {
          if (!alreadyAlerted.current) {
            alreadyAlerted.current = true;
            alert("Access denied, please log in and try again.");
            router.replace("/");
          }
        }
      };

      loadData();
    }, [])
  );

  //for "# inventory/wishlist items" lines; endpoint in inventory.js
  const findNumItems = async (token: string) =>{
    try {
      const res = await fetch(
        `${API_URL}/api/get-num-items`,
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
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert(`Endpoint does not exist. Please try again later.`);
        }
        router.back();
        return;
      }

      else if (!res.ok) {
        if (!alreadyAlerted.current) {
          alreadyAlerted.current = true;
          alert("Whoops! Something went wrong... please try again later.");
        }
        router.back();
        return;
      }

      const data = await res.json();

      if(!data.empty){
        console.log("inputting data");
        setInventoryCount(data.iCount);
        setWishlistCount(data.wCount);
      }
    }
    catch(error) {
      console.log("Error when trying to fetch folder counts:", error)
    }
  }

  const folders: Folder[] = [
    { id: "1", name: "Inventory", count: inventoryCount },
    { id: "2", name: "Wishlist", count: wishlistCount },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 20 },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}
        accessible={true}
        accessibilityRole={"header"}      
      >My Stuff</Text>

      {/* Folder Cards */}
      {folders.map((folder) => (
        <Pressable
          key={folder.id}
          onPress={() => {
            if (folder.name === "Inventory") {
              router.push("/inventoryfolder");
              return;
            }

            if (folder.name === "Wishlist") {
              router.push("/wishlistfolder");
            }
          }}
          style={[
            styles.card,
            {
              backgroundColor: colors.boxBackground,
              borderColor: colors.topBackground,
            },
          ]}
          accessible={true}
          accessibilityHint={"Click to view all " + folder.name + " items."}
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
            {folder.count} {folder.name.toLowerCase()}{" "}
            {folder.count === 1 ? "item" : "items"}
          </Text>
        </Pressable>
      ))}
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
