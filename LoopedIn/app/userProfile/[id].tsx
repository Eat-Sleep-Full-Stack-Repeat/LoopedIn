import {
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import React, {
  useLayoutEffect,
  useEffect,
  useState,
  useCallback,
} from "react";
import BottomNavButton from "@/components/bottomNavBar";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
// FIXME: delete the following line when backend set up
import craftIcons from "@/components/craftIcons";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";
import { Storage } from "../../utils/storage";
import API_URL from "@/utils/config";
import { Feather, Entypo } from "@expo/vector-icons";
import { jwtDecode } from "jwt-decode";


type User = {
  userID: string;
  userName: string;
  userBio: string | "";
  avatarUrl?: string | null;
  followers?: number | 0;
  following?: number | 0;
  posts?: any[];
  tags?: any[];
};

interface Payload {
  userID: string;
}


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
  // token to trigger reload when screen regains focus
  const [reloadToken, setReloadToken] = useState(0);

  const isTablet = width >= 768;
  const CONTENT_MAX = isTablet ? 720 : width;
  const NUM_COLUMNS = width >= 1024 ? 6 : width >= 820 ? 5 : width >= 600 ? 4 : 3;
  const AVATAR = isTablet ? 120 : 100;

  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { id } = useLocalSearchParams();

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [currentPosts, setPosts] = useState<any[]>([]);

  //if you are following user
  const [isFollowed, setIsFollowed] = useState(false)

  //if user is following you
  const [isUserFollowing, setIsUserFollowing] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<string>("")
  const [menuVisible, setMenuVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false)

  //blocking/unblocking loading state
  const [isBlocking, setIsBlocking] = useState(false)
  
  //tracking if the other user blocked current user
  const [isBlocked, setIsBlocked] = useState(false)

  //tracking if current user blocked other user
  const [isBlockedUser, setIsBlockedUser] = useState(false)

  //get rid of header
  useLayoutEffect(() => {
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);


  //call helper function to load user profile
  const fetchUser = async () => {
    if (!id) {
      return
    }

    const token = await Storage.getItem("token");

    if (!token) {
      alert("Token does not exist")
      router.replace("/")
      return
    }

    const decoded = jwtDecode<Payload>(token)
    setCurrentUser(decoded.userID)

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
        userID: data.userID,
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

  useEffect(() => {
    fetchUser();
  }, [reloadToken])

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchUser()
    setIsRefreshing(false)
  }, [reloadToken])

  useEffect(() => {
    if (otherUser?.userID) {
      fetchFollow()
      fetchBlock()
    }

  }, [otherUser])


  const fetchFollow = async () => {
    const otherUserID = otherUser?.userID

    if (otherUserID === null) {
      console.log("otheruserID is null")
      return
    }

    const token = await Storage.getItem("token")
    try {
      const response = await fetch(`${API_URL}/api/follow/check-if-follow/${otherUserID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      if (!response.ok) {
        alert("Failed to load follow status")
        return
      }

      const responseData = await response.json()

      setIsFollowed(responseData.followStatus)
      setIsUserFollowing(responseData.userFollowingStatus)

    }
    catch(error) {
      console.log("Error checking follow status:", error)
    }
  }

  //for fetching blocked status
  const fetchBlock = async () => {
    const otherUserID = otherUser?.userID

    if (otherUserID === null) {
      console.log("otheruserID is null")
      return
    }

    const token = await Storage.getItem("token")

    try {
      const response = await fetch(`${API_URL}/api/block/check-if-block/${otherUserID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        alert("Failed to recieve block status")
        return
      }

      const responseData = await response.json()

      //don't mix these up lol
      setIsBlocked(responseData.ifBlocked)
      setIsBlockedUser(responseData.ifUserBlocked)

    }
    catch(error) {
      console.log("Error checking block status:", error)
    }
  }

  const handleFollowPress = async () => {
    //so we prevent spam clicking
    if (isLoading) {
      return
    }

    const otherUserID = otherUser?.userID

    if (otherUserID === null) {
      console.log("otheruserID is null")
      return
    }

    setIsLoading(true)

    const original = isFollowed
    const originalFollowers = Number(otherUser?.followers ?? 0);
    setIsFollowed(!original)

    //unfollow route
    if (isFollowed) {
      try {
        const token = await Storage.getItem("token");

        const response = await fetch(`${API_URL}/api/follow/unfollow-user`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ followingID: otherUserID}),
        });

        if (!response.ok) {
          setIsFollowed(original)
          alert("Something went wrong when unfollowing this person. Try again later.")
          return
        }
      }
      catch(error) {
        console.log("Failed to unfollow user:", error)
      }
      finally {
        //success: state change yay
        setOtherUser(prev => prev ? { ...prev, followers: originalFollowers + (original ? -1 : 1) } : prev);
        setIsLoading(false)
      }
    }
    //follow route oooo
    else {
      try {
        const token = await Storage.getItem("token")

          const response = await fetch(`${API_URL}/api/follow/follow-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ otherUserID: otherUserID}),
        });

        if (!response.ok) {
          setIsFollowed(original)
          alert("Something went wrong when following this person. Try again later.")
          return
        }

      }
      catch(error) {
        console.log("Failed to follow user:", error)
      }
      finally {
        //success: state change yay
        setOtherUser(prev => prev ? { ...prev, followers: originalFollowers + (original ? -1 : 1) } : prev);
        setIsLoading(false)
      }
    }
  }

  const openMenu = () => {
    setMenuVisible(true);
  };

  //do block stuff
  const handleBlock = async () => {
    //prevent spam blocks
    if (isBlocking) {
      return
    }

    const otherUserID = otherUser?.userID

    if (otherUserID === null) {
      console.log("otheruserID is null")
      return
    }

    setIsBlocking(true)

    //is here so it aligns with our optimistic updates
    setMenuVisible(false)

    //og if current user blocked other user
    const original = isBlockedUser
    setIsBlockedUser(!original)

    const originalFollowed = isFollowed //keep track if you followed user
    const originalUserFollow = isUserFollowing //keep track if user is following you
    const originalUsersFollowerCnt = Number(otherUser?.followers ?? 0)
    const originalUsersFollowingCnt = Number(otherUser?.following ?? 0)


    //unblock route
    if (isBlockedUser) {
      const token = await Storage.getItem("token")

      try {
        const response = await fetch(`${API_URL}/api/block/block-user/${otherUserID}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          setIsBlockedUser(original)
          alert("Error while unblocking this user. Try again later.");
          return;
        }

      }
      catch(error) {
        console.log("Failed to unblock user:", error)
      }
      finally {
        //unblock complete
        setIsBlocking(false)
      }
    }

    //block route
    else {
      const token = await Storage.getItem("token")

      try {
        const response = await fetch(`${API_URL}/api/block/block-user/${otherUserID}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          setIsBlockedUser(original)
          alert("Error while unblocking this user. Try again later.");
          return;
        }

      }
      catch(error) {
        console.log("Failed to block user:", error)
      }
      finally {
        //if we followed them, update UI to unfollow 
        if (originalFollowed) {
          setOtherUser(prev => prev ? { ...prev, followers: originalUsersFollowerCnt + (originalFollowed ? -1 : 1) } : prev);
        }

        //if user was following us, they will now unfollow us in UI
        if (originalUserFollow) {
          setOtherUser(prev => prev ? { ...prev, following: originalUsersFollowingCnt + (originalUserFollow ? -1 : 1) } : prev);
        }

        //block complete
        setIsBlocking(false)
      }
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setReloadToken((t) => t + 1);
    });

    return unsubscribe;
  }, [navigation]);


  //userdata from backend yee
  const router = useRouter();
  const userData = otherUser;

  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    backFab: {
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
    isFollowedBtn: {
      backgroundColor: colors.decorativeBackground,
    },
    isFollowedText: {
      fontSize: 14,
      color: colors.decorativeText,
    },
    followText: {
      fontSize: 14, 
      color: colors.text,
    },
    isBlockedBtn: {
      backgroundColor: colors.blockedBackground
    },
    isBlockedText: {
      fontSize: 14,
      color: colors.blockedText,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    menuContainer: {
      width: 180,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    menuOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
    },
    menuText: {
      fontSize: 16,
    },
    activityIndicatorDiv: {
      position: "absolute",
      top: insets.top + 10,
      backgroundColor: colors.topBackground,
      alignItems: "center",
      zIndex: 10,
    }
  });
  

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={{flexDirection: "row", justifyContent: "space-between", paddingTop: 10}}>
        <View style={styles.headerArrowDiv}>
          <Pressable style={styles.backFab} onPress={() => router.back()}>
            <Feather name="chevron-left" size={22} color={colors.text} />
          </Pressable>
        </View>
        {currentUser !== "" && currentUser !== userData?.userID ? (
        <View style={{zIndex: 10, marginHorizontal: 30, height: 40, justifyContent: "center"}}>
          <TouchableOpacity onPress={() => openMenu()}>
            <Entypo
              name="dots-three-vertical"
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>) : (<View></View>)}
      </View>

      <View style={[styles.renderHeaderStyle, {paddingTop: 10}]}>
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
                onPress={() => {
                  if (!userData?.userID) {
                    alert("Still fetching userdata... try again later")
                    return
                  }
                  router.push({
                  pathname: "/followers/[id]",
                  params: {id: userData?.userID}})}}
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
                onPress={() => {
                  if (!userData?.userID) {
                    alert("Still fetching userdata... try again later")
                    return
                  }
                  router.push({
                  pathname: "/following/[id]",
                  params: {id: userData?.userID}})}}
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
          {currentUser !== "" && currentUser !== userData?.userID ? (
          <View style={styles.contactContainer}>
            <Pressable disabled={isLoading || isBlocking || isBlocked || isBlockedUser} style={[styles.followContainer, isFollowed && styles.isFollowedBtn, 
              (isBlockedUser || isBlocked) && styles.isBlockedBtn]} 
              onPress={handleFollowPress}>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.text} />) :(
                <Text style={[styles.followText, isFollowed && styles.isFollowedText, (isBlockedUser || isBlocked) && styles.isBlockedText]}> 
                  {isFollowed ? "Followed" : "Follow"} </Text>
                )}
            </Pressable>
            <View style={[styles.followContainer, (isBlockedUser || isBlocked) && styles.isBlockedBtn]}>
              <Text style={[styles.followText, (isBlockedUser || isBlocked) && styles.isBlockedText]}> Message </Text>
            </View>
          </View>
          ) : (<View></View>)}
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
    <SafeAreaView style={[styles.container]}>
      <View style={styles.topBackground} />
      <View style={styles.bottomBackground} />
      <FlatList
        data={currentPosts}
        key={NUM_COLUMNS}
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

        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh}
          progressViewOffset={insets.top + 10}/>
        }
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

      <Modal
        transparent
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: colors.exploreCardBackground },
            ]}
          >
            {/*very good icon usage here*/}
            <TouchableOpacity disabled={isBlocking} onPress={handleBlock} style={styles.menuOption}>
              {isBlockedUser ? (
                <Feather name="smile" size={18} color={colors.text} />
              ) : (
                <Feather name="frown" size={18} color={colors.text} />
              )}
              <Text style={[styles.menuText, { color: colors.text }]}>{isBlockedUser ? "Unblock" : "Block"}</Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

