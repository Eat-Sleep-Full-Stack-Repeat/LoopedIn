import {
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  useWindowDimensions,
  Pressable,
} from "react-native";
import React, {
  useLayoutEffect,
  useEffect,
  useState,
} from "react";
import BottomNavButton from "@/components/bottomNavBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// FIXME: delete the following line when backend set up
import craftIcons from "@/components/craftIcons";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import { Storage } from "../../utils/storage";
import API_URL from "@/utils/config";
import { Feather } from "@expo/vector-icons";


type User = {
  userName: string;
  userBio: string | "";
  avatarUrl?: string | null;
  followers?: number | 0;
  following?: number | 0;
  posts?: any[];
  tags?: any[];
};


function getThumbnailSource(item: any): any | null {
  if (!item) return null;

  // handle post objects from /api/profile
  if (item.previewUrl) {
    return { uri: item.previewUrl };
  }
  if (item.preview_url) {
    return { uri: item.preview_url };
  }

  if (typeof item === "string") return { uri: item };
  if (item.uri || item.url || item.imageUrl) {
    return { uri: item.uri || item.url || item.imageUrl };
  }

  if (Array.isArray(item) && item.length > 0) {
    const first = item[0];
    if (typeof first === "string") return { uri: first };
    if (first?.uri || first?.url || first?.imageUrl) {
      return { uri: first.uri || first.url || first.imageUrl };
    }
    return first;
  }

  const photosArray =
    item.photos || item.images || item.pics || item.postPics || null;

  if (Array.isArray(photosArray) && photosArray.length > 0) {
    const first = photosArray[0];
    if (typeof first === "string") return { uri: first };
    if (first?.uri || first?.url || first?.imageUrl) {
      return { uri: first.uri || first.url || first.imageUrl };
    }
    return first;
  }

  return item;
}


export default function OtherUserProfile() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const CONTENT_MAX = isTablet ? 720 : width;
  const NUM_COLUMNS = width >= 1024 ? 6 : width >= 820 ? 5 : width >= 600 ? 4 : 3;
  const AVATAR = isTablet ? 120 : 100;

  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { id } = useLocalSearchParams();

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [currentPosts, setPosts] = useState<any[]>([]);

  //get rid of header
  useLayoutEffect(() => {
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);


  useEffect(() => {
    if (!id) {
      return;
    }

    fetchUser();
  }, [id])


  //call helper function to load user profile
  const fetchUser = async () => {
    const token = await Storage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/api/profile/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        alert("Error fetching this profile. Try again later.");
        router.back();
        return;
      }

      const data = await response.json();

      const new_user: User = {
        userName: data.userName ?? "User",
        userBio: data.userBio ?? "",
        avatarUrl: data.avatarUrl ?? null,
        followers: data.followers ?? 0,
        following: data.following ?? 0,
        posts: data.posts ?? [],
        tags: data.tags ?? [],
      };

      setOtherUser(new_user);
      setPosts(data.posts ?? [])

    }
    catch(error) {
      console.log("Error while fetching other user", (error as Error).message);
      alert("Server error, please try again later.");
    }
  }


  // FIXME: will need to call the userInfo from the backend when time
  const router = useRouter();
  const userData = otherUser;

  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    backFab: {
      position: "absolute",
      top: insets.top + 8,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.boxBackground,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },
    postTabs: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 40,
      marginBottom: 20,
      alignItems: "center",
    },
    postTabText: {
      backgroundColor: colors.decorativeBackground,
      padding: 10,
      borderRadius: 15,
    },
    topBackground: {
      backgroundColor: colors.topBackground,
      height: "50%",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: -1,
    },
    bottomBackground: {
      backgroundColor: colors.background,
      height: "50%",
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: -1,
    },
    headerContainer: {
      flexDirection: "column",
      flex: 1,
      backgroundColor: colors.topBackground,
    },
    headerArrowDiv: {
      backgroundColor: colors.topBackground,
      width: "100%",
      height: 50,
      marginHorizontal: 30,
    },
    renderHeaderStyle: {
      backgroundColor: colors.topBackground,
      flexDirection: "column",
      flex: 1,
      width: "100%",
      marginBottom: 30,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    countCircles: {
      backgroundColor: colors.decorativeBackground,
      width: 50,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 25,
    },
    countLabel: {
      fontSize: 14,
      color: colors.text,
      marginTop: 4,
    },
    bioContainer: {
      flexDirection: "column",
      marginHorizontal: 30,
      marginBottom: 20,
      marginTop: 10,
    },
    bioContentContainer: {
      backgroundColor: colors.boxBackground,
      padding: 10,
      borderRadius: 15,
    },
    tagsContainer: {
      flexDirection: "column",
      marginBottom: 30,
      marginHorizontal: 30,
    },
    tagsContentContainer: {
      backgroundColor: colors.boxBackground,
      padding: 10,
      borderRadius: 15,
      flexDirection: "row",
      gap: 30,
    },
    contactContainer: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      marginBottom: 30,
      alignItems: "center",
      marginHorizontal: 20,
    },
    followContainer: {
      backgroundColor: colors.boxBackground,
      paddingVertical: 10,
      paddingHorizontal: 40,
      borderRadius: 15,
    },
  });
  

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerArrowDiv}>
        <Pressable style={styles.backFab} onPress={() => router.back()}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </Pressable>
      </View>
      <View style={[styles.renderHeaderStyle, { paddingTop: insets.top + 20 }]}>
        <View style={{ flexDirection: "column" }}>
          {/* user info: pic, username, follower + friend count */}
          <View style={styles.userInfo}>
            <Image
              source={ userData?.avatarUrl ? {uri: userData.avatarUrl}
              : require("@/assets/images/icons8-cat-profile-100.png")}
              
              style={[{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }]}
            />
            <View>
              <Text style={{ fontSize: 20, color: colors.text }}>{userData?.userName ?? "User"}</Text>
              <View style={{ flexDirection: "row", gap: 20 }}>

              {/* Followers */}
              <Pressable
                style={{ flexDirection: "column", alignItems: "center" }}
                onPress={() => router.push("/followers")}
              >
                  <View style={styles.countCircles}>
                    <Text style={{ fontSize: 24, color: colors.decorativeText }}>
                      {userData?.followers ?? 0}
                    </Text>
                  </View>
                  <Text style={styles.countLabel}>Followers</Text>
              </Pressable>

              {/* Following */}
              <Pressable
                style={{ flexDirection: "column", alignItems: "center" }}
                onPress={() => router.push("/following")}
              >
                  <View style={styles.countCircles}>
                    <Text style={{ fontSize: 24, color: colors.decorativeText }}>
                      {userData?.following ?? 0}
                    </Text>
                  </View>
                   <Text style={styles.countLabel}>Following</Text>
              </Pressable>
              
              </View>
            </View>
          </View>

          {/* bio */}
          <View style={styles.bioContainer}>
            <Text style={{ fontSize: 14, color: colors.text }}> Bio </Text>
            <View style={styles.bioContentContainer}>
              <Text style={{ fontSize: 14, color: colors.text }}>{userData?.userBio?? ""}</Text>
            </View>
          </View>

          {/* craft tags */}
          {/*<View style={styles.tagsContainer}>
            <Text style={{ color: colors.text }}> Crafts </Text>
            <View style={styles.tagsContentContainer}>
              {userData.tags.map((item, index) => (
                <View
                  key={index}
                  style={{ flexDirection: "column", alignItems: "center" }}
                >
                  <Text style={{ color: colors.text }}>{item.craft}</Text>
                  <Image source={craftIcons[item.craft]} />
                  <Text style={{ color: colors.text }}>{item.skill}</Text>
                </View>
              ))}
            </View>
          </View>*/}

          {/* follow and message buttons */}
          <View style={styles.contactContainer}>
            <Pressable style={styles.followContainer}>
              <Text style={{ fontSize: 14, color: colors.text }}> Follow </Text>
            </Pressable>
            <View style={styles.followContainer}>
              <Text style={{ fontSize: 14, color: colors.text }}> Message </Text>
            </View>
          </View>
        </View>
      </View>

      {/* user's posts section */}
      <View style={styles.postTabs}>
        <View style={styles.postTabText}>
          <Text style={{ color: colors.decorativeText }}>{userData?.userName?? "User"}'s Posts</Text>
        </View>
      </View>
    </View>
  );



  const cardW = Math.min(CONTENT_MAX, width) / NUM_COLUMNS - 10;

  return (
    <View style={[styles.container]}>
      <View style={styles.topBackground} />
      <View style={styles.bottomBackground} />
      <FlatList
        data={currentPosts}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => {
          const thumbSource = getThumbnailSource(item);
          if (!thumbSource) return null;

          return (
            <Pressable onPress={() => router.back()}>
              <Image
                source={thumbSource}
                resizeMode="cover"
                style={{
                  width: cardW,
                  height: cardW * (16 / 9),
                  borderRadius: 20,
                  marginBottom: 8,
                }}
              />
            </Pressable>
          );
        }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          backgroundColor: colors.background,
        }}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginHorizontal: 10,
        }}
      />
      <BottomNavButton />
    </View>
  );
}

