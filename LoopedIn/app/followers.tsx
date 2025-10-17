import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter,  useNavigation } from "expo-router";
import { useState, useLayoutEffect, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import { Storage } from "../utils/storage";
import API_URL from "@/utils/config";

// Define a type for a user
type User = {
  id: string;
  username: string;
  image: any; // You can refine this type if using React Native ImageSourcePropType
};

export default function FollowersScreen() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [followers, setFollowers] = useState<User[]>([]);

  useEffect(() => {
    //get followers
    const getFollowers = async () => {
      //obtain token
      const token = await Storage.getItem("token");

      console.log("getting followers")

      //obtain followers
      try {
        const response = await fetch(`${API_URL}/api/follow/get-followers`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        console.log("got followers")

        if (!response.ok) {
          alert("Error fetching followers. Try again later.");
          router.replace("/userProfile");
          return;
        }

        const data = await response.json();

        //if followers
        const format_followers = data.map((row: any) => ({
          id: row.fld_user_pk,
          username: row.fld_username,
          image: row.fld_profile_pic ?? require("@/assets/images/icons8-cat-profile-100.png")
        }))

        setFollowers(format_followers)

      }
      catch(error) {
        console.log("Error while fetching followers:", (error as Error).message);
        alert("Server error, please try again later.");
      }

    }

    getFollowers()

  }, [])

  const filteredFollowers = followers.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeFollower = (id: string) => {
    setFollowers(prev => prev.filter(f => f.id !== id));

    //get followed people for current user logged in
    const removeFollowerAPI = async () => {
      //obtain token
      const token = await Storage.getItem("token");

      console.log("remove follower")

      //obtain the followed dudes
      try {
        const response = await fetch(`${API_URL}/api/follow/remove-follower`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ followerID: parseInt(id) }),
        });


        if (!response.ok) {
          alert("Error while removing follower. Try again later.");
          router.replace("/userProfile");
          return;
        }

      }
      catch(error) {
        console.log("Error while removing follower:", (error as Error).message);
        alert("Server error, please try again later.");
      }

    }
    
    removeFollowerAPI()
  };


  const blockFollower = (id: string) => {
    setFollowers(prev => prev.filter(f => f.id !== id));

    const blockFollowerAPI = async () => {
      const token = await Storage.getItem("token");

      console.log("block follower")

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


        if (!response.ok) {
          alert("Error while blocking follower. Try again later.");
          router.replace("/userProfile");
          return;
        }
      }
      catch(error) {
        console.log("Error while blocking follower:", (error as Error).message);
        alert("Server error, please try again later.");
      }
    }
    blockFollowerAPI()
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
      maxWidth: 125,
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
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.username}>{item.username}</Text>
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

