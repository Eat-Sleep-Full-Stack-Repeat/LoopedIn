import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import ForumPostView from "@/components/forumPost";
import { Storage } from "../utils/storage";
import API_URL from "@/utils/config";

type ForumPost = {
  id: number;
  title: string;
  username: string;
  content: string;
  filterTags: string[];
  datePosted: string;
  userID: string,
};

type ForumSearchOverlayProps = {
  visible: boolean;
  onClose: () => void;
  forumData: ForumPost[]; 
};

export default function ForumSearchOverlay({ visible, onClose }: ForumSearchOverlayProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  const [searchType, setSearchType] = useState<"user" | "tag" | "title">("user");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ForumPost[]>([]);

  const fade = useRef(new Animated.Value(0)).current;   //backdrop opacity
  const slide = useRef(new Animated.Value(0)).current;  //0 hidden 1 shown
  const screenH = Dimensions.get("window").height;
  const isTablet = Dimensions.get("window").width >= 768;

  //for infinite scroll
  const limit = 10;
  const lastTimeStamp = useRef<string | null>(null);
  const lastPostID = useRef<number | null>(null);
  const loadingMore = useRef<true | false>(false);
  const hasMore = useRef(true);

  //change search results if new searchType filter selected
  useEffect(() => {
    lastTimeStamp.current = null;
    lastPostID.current = null;
    hasMore.current = true;
    setResults([]);

    if (query.trim()) {
      handleSearch(true);
    }
}, [searchType]);

  //refresh if query changes (don't put new stuff on top of old stuff)
  useEffect(() => {
  if (query.trim() === "") {
      //reset infinite scroll vars
      //console.log("------------SETTING ALL INFINITE SCROLL VARS TO NULL-------------")
      lastTimeStamp.current = null;
      lastPostID.current = null;
      hasMore.current = true;
      loadingMore.current = false;

      //clear everything
      setResults([]);
  }
}, [query]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 1, useNativeDriver: true, friction: 9, tension: 60 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fade, slide]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [screenH, 0],
  });

const handleSearch = async (fresh = false) => {
  if (!visible) return; //end a query if search overlay is closed

  //console.log("handling search", fresh? "(fresh)":"");

    if (fresh) {
      //reset infinite scroll vars
      //console.log("------------SETTING ALL INFINITE SCROLL VARS TO NULL-------------")
      lastTimeStamp.current = null;
      lastPostID.current = null;
      hasMore.current = true;
      loadingMore.current = false;

      //clear everything
      setResults([]);
    }

    //prevent spam
    if (loadingMore.current || !hasMore.current) {
      console.log("already loading - ignoring duplicate search request");
      return;
    }
    loadingMore.current = true;

    const token = await Storage.getItem("token");
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    //timestamps for infinite scroll
    const includeBefore = lastTimeStamp.current
    ? `&before=${lastTimeStamp.current}`
    : "";

  const includePostID = lastPostID.current
    ? `&postID=${lastPostID.current}`
    : "";


    //api call
    try {
    const response = await fetch(`${API_URL}/api/forum/search?limit=${limit}${includeBefore}${includePostID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: q,
        type: searchType,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();

    let tempArray: ForumPost[] = data.newFeed.map((row: any) => ({
      id: row.fld_post_pk,
      profilePic: row.fld_profile_pic,
      title: row.fld_header,
      username: row.fld_username,
      content: row.fld_body,
      datePosted: row.fld_timestamp,
      userID: row.fld_user_pk,
    }));

    //console.log("temp array populated");


     //filter to prevent duplicates
      setResults(prev => {
        const combined = [...prev, ...tempArray];
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });

      //obligatory updates
      hasMore.current = (data.hasMore);
      if (tempArray.length > 0) {
        lastTimeStamp.current = tempArray[tempArray.length - 1].datePosted;
        lastPostID.current = Number(tempArray[tempArray.length - 1].id);
      };

    } catch (err: any) {
      console.error(err);
    } finally {
      //even if fetching data fails, we will update loading more
      loadingMore.current = false;
    }
  
  };

  return (
    <KeyboardAvoidingView
      style={StyleSheet.absoluteFill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      pointerEvents={visible ? "auto" : "none"}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: colors.background + "EE", opacity: fade },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Sliding card */}
      <Animated.View
        style={[
          styles.cardWrap,
          { transform: [{ translateY }] },
        ]}
        pointerEvents="auto"
      >
        <View style={[styles.card,     {
      width: isTablet ? "100%" : "95%",
      maxWidth: isTablet ? 900 : undefined,
    }, { backgroundColor: colors.topBackground }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable   onPress={onClose}
                style={{ padding: 6 }}>
              <Feather name="x" size={26} color={colors.text} />
            </Pressable>
            <Text style={[styles.headerText, { color: colors.text }]}>Search</Text>
          </View>

          {/* Input row */}
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Type your search..."
              placeholderTextColor={colors.text + "99"}
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                  borderColor: colors.decorativeBackground,
                  backgroundColor: colors.background,
                },
              ]}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => handleSearch(true)}
              returnKeyType="search"
            />
            <Pressable onPress={() => handleSearch(true)} style={styles.iconButton}>
              <Feather name="search" size={22} color={colors.decorativeText} />
            </Pressable>
          </View>

          {/* Filter buttons (default: User) */}
          <View style={styles.filters}>
            {(["user", "tag", "title"] as const).map((type) => {
              const active = searchType === type;
             return (
                <Pressable
                  key={type}
                  onPress={() => {
                    setSearchType(type);
                    // if (query.trim()) handleSearch();
                  }}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: active
                        ? colors.decorativeBackground
                        : colors.boxBackground,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.decorativeText : colors.text,
                      fontWeight: "600",
                    }}
                  >
                    {type === "user" ? "User Name" : type === "tag" ? "Tag" : "Title"}
                 </Text>
               </Pressable>
               );
           })}
          </View>

          {/* Results */}
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            renderItem={({ item }) => (
              <View style={{ alignItems: "center", marginVertical: 8 }}>
                <ForumPostView postInfo={item} />
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ color: colors.text, textAlign: "center", marginTop: 20 }}>
                {query
                  ? "No results found."
                  : "Enter a search term and select a filter to begin."}
              </Text>
            }
            onEndReached={() => {
              if (!loadingMore.current && hasMore.current) {
                handleSearch(false);
              }
            }}
            onEndReachedThreshold={0.8}
            ListFooterComponent={() => {
              if (results.length > 0) {
                if (!hasMore.current) {
                  return <Text style={{ color: colors.text }}> No More Data To Load </Text>;
                } else {
                  return (
                    <ActivityIndicator size="small" color={colors.text} />
                  );
                }
              }
            }}
              contentContainerStyle={{
              paddingBottom: 120,
              backgroundColor: colors.topBackground,
              paddingHorizontal: 10,
            }}
              style={{
              width: "100%",
              alignSelf: "center",
              paddingRight: 12,
            }}
          />
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  cardWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 60,
    bottom: 0,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  card: {
    width: "95%",
    height: "88%",
    borderRadius: 25,
    padding: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  iconButton: {
    borderRadius: 10,
    padding: 8,
  },
  filters: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  filterButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
});
