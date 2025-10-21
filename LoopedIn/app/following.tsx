import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useState, useLayoutEffect, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import { Storage } from "../utils/storage";
import API_URL from "@/utils/config";

// User type
type User = {
  id: string;
  username: string;
  image: any;
};

export default function FollowingScreen() {
  const {currentTheme} = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [following, setFollowing] = useState<User[]>([]);


  useEffect(() => {
    //get followed people for current user logged in
    const getFollowing = async () => {
      //obtain token
      const token = await Storage.getItem("token");

      console.log("getting following")

      //obtain the followed dudes
      try {
        const response = await fetch(`${API_URL}/api/follow/get-following`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        console.log("got following")

        if (!response.ok) {
          alert("Error fetching users followed. Try again later.");
          router.replace("/userProfile");
          return;
        }

        const data = await response.json();

        //if following people
        const format_followers = data.map((row: any) => ({
          id: row.fld_user_pk ?? row.id,
          username: row.fld_username ?? row.username,
          image:
            typeof row.avatarUrl === "string" && /^https?:\/\//i.test(row.avatarUrl)
              ? { uri: row.avatarUrl }
              : require("@/assets/images/icons8-cat-profile-100.png"),
        }));

        setFollowing(format_followers)

      }
      catch(error) {
        console.log("Error while fetching followers:", (error as Error).message);
        alert("Server error, please try again later.");
      }

    }
    
    getFollowing()

  }, [])


  const filteredFollowing = following.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unfollow = (id: string) => {
    setFollowing(prev => prev.filter(f => f.id !== id));

    //get followed people for current user logged in
    const unfollowUserAPI = async () => {
      //obtain token
      const token = await Storage.getItem("token");

      console.log("unfollow user")

      //obtain the followed dudes
      try {
        const response = await fetch(`${API_URL}/api/follow/unfollow-user`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ followingID: parseInt(id) }),
        });


        if (!response.ok) {
          alert("Error while unfollowing. Try again later.");
          router.replace("/userProfile");
          return;
        }

      }
      catch(error) {
        console.log("Error while unfollowing:", (error as Error).message);
        alert("Server error, please try again later.");
      }

    }
    
    unfollowUserAPI()

  };

  const blockUser = (id: string) => {
    setFollowing(prev => prev.filter(f => f.id !== id));
    
    const blockFollowing = async () => {
      const token = await Storage.getItem("token");

      console.log("block following user")

      //block a follower of yours
      try {
        const response = await fetch(`${API_URL}/api/block/block-user/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        console.log("got following")

        if (!response.ok) {
          alert("Error while blocking user. Try again later.");
          router.replace("/userProfile");
          return;
        }
      }
      catch(error) {
        console.log("Error while blocking user:", (error as Error).message);
        alert("Server error, please try again later.");
      }
    }
    blockFollowing()
  };

  //to remove the auto-generated header... remove if we hate this!
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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
      gap: 5,
      backgroundColor: colors.topBackground,
      borderRadius: 20,
      padding: 12,
      marginVertical: 6,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexShrink: 1,
      flexGrow: 1,
      minWidth: 0,
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
      flexShrink: 1,
      minWidth: 0,
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
        <Text style={styles.headerText}>Following</Text>
      </View>

      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search following"
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={colors.text}
      />

      {/* List */}
      <FlatList
        data={filteredFollowing}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Image source={item.image} style={styles.avatar} />
              <View style={{flexShrink: 1, minWidth: 0}}>
                <Text  numberOfLines={1} ellipsizeMode="tail" style={styles.username}>{item.username}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, flexShrink: 0, alignItems: "center" }}>
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

