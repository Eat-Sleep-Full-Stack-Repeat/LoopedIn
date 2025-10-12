import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";

// Define a type for a user
type User = {
  id: string;
  username: string;
  name: string;
  image: any; // You can refine this type if using React Native ImageSourcePropType
  isFollowing: boolean;
};

export default function FollowersScreen() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [followers, setFollowers] = useState<User[]>([
    { id: "1", username: "catlover23", name: "Maya Chen", image: require("@/assets/images/icons8-cat-profile-100.png"), isFollowing: true },
    { id: "2", username: "craftqueen", name: "Aisha Rahman", image: require("@/assets/images/icons8-cat-profile-100.png"), isFollowing: false },
    { id: "3", username: "knitncozy", name: "Liam Torres", image: require("@/assets/images/icons8-cat-profile-100.png"), isFollowing: true },
  ]);

  const filteredFollowers = followers.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeFollower = (id: string) => {
    setFollowers(prev => prev.filter(f => f.id !== id));
  };

  const blockFollower = (id: string) => {
    setFollowers(prev => prev.filter(f => f.id !== id));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 60,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    backArrow: {
      fontSize: 28,
      marginRight: 15,
      color: colors.text,
    },
    headerText: {
      fontSize: 26,
      fontWeight: "600",
      color: colors.text,
    },
    searchBar: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.decorativeBackground,
      borderRadius: 25,
      paddingHorizontal: 20,
      height: 45,
      marginBottom: 15,
    },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.topBackground,
      borderRadius: 20,
      padding: 12,
      marginVertical: 6,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "#fff",
    },
    username: {
      fontWeight: "600",
      fontSize: 16,
      color: colors.text,
    },
    name: {
      fontSize: 14,
      color: colors.text,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Followers</Text>
      </View>

      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search followers"
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={colors.text}
      />

      {/* List */}
      <FlatList
        data={filteredFollowers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Image source={item.image} style={styles.avatar} />
              <View>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.name}>{item.name}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#D9534F" }]}
                onPress={() => removeFollower(item.id)}
              >
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#6C757D" }]}
                onPress={() => blockFollower(item.id)}
              >
                <Text style={styles.buttonText}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

