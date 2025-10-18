import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import BottomNavButton from "@/components/bottomNavBar";
import { useEffect, useState } from "react";
// FIXME remove the following import once backend is set up
import mockUser from "./mockData";
import ForumPostView from "@/components/forumPost";

/*
Ideas for backend implementation:
- Display saved posts from most newly saved -> oldest saved posts
- Display all other posts based on when they were posted
*/

type ForumPost = {
  id: number,
  title: string;
  username: string;
  content: string;
  filterTags: string[];
  datePosted: Date;
};

export default function ForumFeed() {
  // Constants and functions
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const [selectedFilter, setFilter] = useState<string>("All");
  //the following is used to only display 10 posts, and then change to an infinite scroll when user hits seee more
  const [seeMorePressed, setSeeMorePressed] = useState(false); 
  const [showFooter, setshowFooter] = useState(true);
  const [forumData, setForumData] = useState<ForumPost[]>([]);

  const userData = mockUser;
  const filters = ["All", "Crochet", "Knit"];

  useEffect(() => {
    // FIXME: need to fetch the initial 10 forum posts here
   setForumData(userData.forumPosts.slice(0, 10));
  }, [])

  const searchFunctionality = () => {
    // FIXME: handle searching the forums here
    console.log("Search pressed");
  };

  const handleFilterPress = () => {
    //FIXME: handle when user wants to filter forum by tags
    console.log("Tag filter pressed");
  };

  const handleSeeMorePress = (origin: string) => {
    //FIXME: handle when user wants to see all saved posts
    console.log("See more was pressed", origin)
    if (origin === "recent") {
      setSeeMorePressed(true);
      setshowFooter(false);
    }
  }

  useEffect(() => {
    console.log("Filter is now: ", selectedFilter);
    // FIXME add filter logic here!
  }, [selectedFilter]);


  //changes forum posts from only displaying 10 to an infinite scroll
  useEffect(() => {
    // FIXME: would need to update this to instead continuously load more data
    if (seeMorePressed) {
      setForumData(userData.forumPosts);
    }
  }, [seeMorePressed])



  // Styles will go here
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      flexDirection: "column",
      backgroundColor: colors.background,
      justifyContent: "center"
    },
    searchBar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginHorizontal: 20,
    },
    searchIcon: {
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    searchText: {
      color: colors.text,
    },
    title: {
      alignItems: "center",
      marginBottom: 20,
    },
    titleText: {
      color: colors.text,
      fontSize: 35,
      fontWeight: "bold",
    },
    refineHeader: {
      flexDirection: "column",
      marginHorizontal: 20,
    },
    refineHeaderText: {
      fontWeight: "bold",
      fontSize: 16,
      color: colors.text,
      marginBottom: 10,
    },
    craftFilter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: 10,
      marginBottom: 20,
    },
    craftTags: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 20,
    },
    buttonPressed: {
      backgroundColor: colors.decorativeBackground,
    },
    buttonNotPressed: {
      backgroundColor: colors.topBackground,
    },
    buttonBase: {
      padding: 10,
      borderRadius: 15,
    },
    savedPostsHeader: {
      flexDirection: "row",
      justifyContent: "space-between"
  },
    
  });

  const headerView = () => (
    <View>
      {/* Search icon section */}
      <View style={styles.searchBar}>
        <Pressable style={styles.searchIcon} onPress={searchFunctionality}>
          <Feather name="search" size={24} color={colors.text} />
          <Text style={styles.searchText}> Search </Text>
        </Pressable>
      </View>

      {/* Forum title */}
      <View style={styles.title}>
        <Text style={styles.titleText}> Forum </Text>
      </View>

      {/* Refine by craft section */}
      <View style={styles.refineHeader}>
        <Text style={styles.refineHeaderText}> Refine by craft </Text>
        <View style={styles.craftFilter}>
          {/* Craft tags */}
          <View style={styles.craftTags}>
            {filters.map((filterOption) => (
              <Pressable
                key={filterOption}
                onPress={() => setFilter(filterOption)}
                style={[
                  styles.buttonBase,
                  filterOption === selectedFilter
                    ? styles.buttonPressed
                    : styles.buttonNotPressed,
                ]}
              >
                <Text style={[filterOption === selectedFilter ? {color: colors.decorativeText} : {color: colors.text}]}>{filterOption}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Saved forum posts */}
      <View style={styles.refineHeader}>
        <View style={styles.savedPostsHeader}>
            <Text style={styles.refineHeaderText}> Saved Posts </Text>
            <Pressable onPress={() => handleSeeMorePress("saved")}> 
                <Text style={{color: colors.text}}>
                    See More {">"}
                </Text>
            </Pressable>
        </View>
      </View>
        <FlatList
          data={userData.savedForums.slice(0, 10)}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <ForumPostView postInfo={item}/>
          )}
          contentContainerStyle={{ gap: 15, marginBottom: 20, paddingHorizontal: 15 }}
        />

      {/* recent posts header - content is in flatlist below */}
      <View style={styles.refineHeader}>
        <View style={styles.savedPostsHeader}>
              <Text style={styles.refineHeaderText}>
                Recent Posts
              </Text>
        </View>
      </View>
    </View>

  );

  // Page view
  return (
    <View style={styles.container}>
      <FlatList
        // will only show 10 posts - user can then select "see more"
        data={forumData}
        renderItem={({ item }) => (
          <View style={{alignItems: "center", marginHorizontal: 20}}>
            <ForumPostView postInfo={item}/>
          </View>
        )}
        ListHeaderComponent={headerView}
        ItemSeparatorComponent={() => <View style={{height: 15}} />}
        ListFooterComponent={ showFooter ? (
        <View>
          <Pressable onPress={() => handleSeeMorePress("recent")}>
                <Text style={{color: colors.text}}>
                  See More {'>'}
                </Text>
              </Pressable>
        </View>) : null}
        ListFooterComponentStyle={{alignItems: "center", marginTop: 20}}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          backgroundColor: colors.background,
        }}
      />
      <BottomNavButton />
    </View>
  );
}
