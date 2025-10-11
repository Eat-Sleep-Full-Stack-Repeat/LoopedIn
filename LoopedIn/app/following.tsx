import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

// User type
type User = {
  id: string;
  username: string;
  name: string;
  image: any;
};

export default function FollowingScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [following, setFollowing] = useState<User[]>([
    { id: "1", username: "makermax", name: "Emily Zhang", image: require("@/assets/images/icons8-cat-profile-100.png") },
    { id: "2", username: "designsbyrio", name: "Rio Martinez", image: require("@/assets/images/icons8-cat-profile-100.png") },
  ]);

  const filteredFollowing = following.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unfollow = (id: string) => {
    setFollowing(prev => prev.filter(f => f.id !== id));
  };

  const blockUser = (id: string) => {
    setFollowing(prev => prev.filter(f => f.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Following</Text>
      </View>

      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search following"
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#555"
      />

      {/* List */}
      <FlatList
        data={filteredFollowing}
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
                onPress={() => unfollow(item.id)}
              >
                <Text style={styles.buttonText}>Unfollow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#6C757D" }]}
                onPress={() => blockUser(item.id)}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    color: "#000",
  },
  headerText: {
    fontSize: 26,
    fontWeight: "600",
    color: "#000",
  },
  searchBar: {
    backgroundColor: "#D9D9D9",
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 45,
    marginBottom: 15,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#D9D9D9",
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
    color: "#000",
  },
  name: {
    fontSize: 14,
    color: "#555",
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