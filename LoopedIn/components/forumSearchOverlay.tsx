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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import ForumPostView from "@/components/forumPost";

type ForumPost = {
  id: number;
  title: string;
  username: string;
  content: string;
  filterTags: string[];
  datePosted: Date;
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

  const fade = useRef(new Animated.Value(0)).current;   // backdrop opacity
  const slide = useRef(new Animated.Value(0)).current;  // 0 hidden 1 shown
  const screenH = Dimensions.get("window").height;

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

  // 15 dummy posts, change later for backend integration
  const demoPosts: ForumPost[] = useMemo(() => {
    const tags = [["Crochet"], ["Knit"], ["Crochet", "Knit"], ["Embroidery"], ["Weaving"]];
    const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
    const titles = [
      "Cozy Winter Scarf",
      "Beginner Granny Squares",
      "Double Knit Tips",
      "Flower Motif Tutorial",
      "Textured Beanie Pattern",
      "Colorwork Tricks",
      "Blocking 101",
      "Lace Chart Basics",
      "Chunky Blanket Guide",
      "Top-Down Sweater Plan",
      "Fringe Finishing",
      "Cable Stitch Practice",
      "Warm Mittens Build",
      "Shawl Shape Ideas",
      "Basket Weave How-To",
    ];

    return Array.from({ length: 15 }).map((_, i) => ({
      id: i + 1,
      title: titles[i % titles.length],
      username: names[i % names.length],
      content: "content for demo search results.",
      filterTags: tags[i % tags.length],
      datePosted: new Date(Date.now() - i * 86400000),
    }));
  }, []);

  const handleSearch = () => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    let filtered: ForumPost[] = [];
    if (searchType === "user") {
      filtered = demoPosts.filter((p) => p.username.toLowerCase().includes(q));
    } else if (searchType === "tag") {
      filtered = demoPosts.filter((p) =>
        p.filterTags.some((t) => t.toLowerCase().includes(q))
      );
    } else {
      filtered = demoPosts.filter((p) => p.title.toLowerCase().includes(q));
    }

    setResults(filtered); // Can use setResults(filtered.slice(0, x)); to limit to x cards per search
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
        <View style={[styles.card, { backgroundColor: colors.topBackground }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={{ padding: 6 }}>
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
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <Pressable onPress={handleSearch} style={styles.iconButton}>
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
                    // re-run search when switching filter
                    if (query.trim()) {
                      const q = query.trim().toLowerCase();
                      let filtered: ForumPost[] = [];
                      if (type === "user") {
                        filtered = demoPosts.filter((p) =>
                          p.username.toLowerCase().includes(q)
                        );
                      } else if (type === "tag") {
                        filtered = demoPosts.filter((p) =>
                          p.filterTags.some((t) => t.toLowerCase().includes(q))
                        );
                      } else {
                        filtered = demoPosts.filter((p) =>
                          p.title.toLowerCase().includes(q)
                        );
                      }
                      setResults(filtered.slice(0, 5));
                    }
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
            keyExtractor={(item) => item.id.toString()}
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
