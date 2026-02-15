import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Entypo, Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Text, Pressable, FlatList, Modal, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Storage } from "../../utils/storage";
import API_URL from "@/utils/config";
import { GestureHandlerRootView, RefreshControl } from "react-native-gesture-handler";

type Folder = {
  id: string;
  name: string;
}

type FolderProject = {
  id: string;
  title: string;
  status: string;
};

export default function TrackerFolderView() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  // projects is the data used in the infinite scroll
  // TODO: update the initial sampleProjects to be empty
  const [projects, setProjects] = useState<FolderProject[]>();
  const [folder, setFolder] = useState<Folder>();

  // used to apply the filters for which projects to display
  // available filters: "Not Started", "In Progress", "Completed" -> cannot have all 3 (that is equal to no filter)
  const [filter, setFilter] = useState<string[]>([]);
  //for api usage only so we don't mess with the filter state
  let filterArray;

  //token-related variables + states
  const [tokenOkay, setTokenOkay] = useState(false);
  const alreadyAlerted = useRef(false); //preventing double-alert in dev
  const [loading, setLoading] = useState(false);
  const [folderLoading, setFolderLoading] = useState(false);

  //refresh
  const [refreshing, setRefreshing] = useState(false);


  /* ---------------- functionalities ---------------- */
  //check token before doing anything
  const checkTokenOkay = async () => {
    try{
      const token = await Storage.getItem("token");
      if (!token) {
        throw new Error("no token");
      }
      else{
        setTokenOkay(true);
      }
  }
    catch(e){
      if (!alreadyAlerted.current) {
        console.log(e)
        alreadyAlerted.current = true;
        alert("Access denied, please log in and try again.");
        router.replace("/");
      }
    }
  }

  useEffect(() => {
    checkTokenOkay();
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setProjects([]);
  };

  //with good token, load up data
  useEffect(() => {
    if (!tokenOkay) { return };
    //fetch data
    fetchFolder()
    fetchData();
  }, [tokenOkay]);

    useEffect(() => {
      if (!refreshing) return;
  
      const refreshNewData = async () => {
        try {
          await fetchData();
        } catch (e) {
          console.log("error when refreshing data", e);
        } finally {
          setRefreshing(false);
        }
      };
  
      refreshNewData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshing]);


  // Function declarations:

  // To update the filters list:
  const updateFilters = (filterName: string) => {
    if (!["Not Started", "In Progress", "Completed"].includes(filterName)) {
      console.log("Error when updating the filter list: Incorrect filter name");
    }

    if (filter.includes(filterName)) {
      // Means the filter was already selected, so de-select it
      const newFilter = filter.filter((item) => item !== filterName);
      setFilter(newFilter);
    } else {
      setFilter((prev) => [...prev, filterName]);
    }
  };

  //fetch folder-specific data on mount only -> can add things to dependency array to change this behavior
  //did this so we don't have to rerender folder data upon filter change
  useEffect(() => {
    if (!id) { return };
    fetchFolder();

  }, [id])

  useEffect(() => {
    fetchData();

  }, [filter])

  //folder fetch handler
  const fetchFolder = async () => {
    if (!tokenOkay) { return };
    if (folderLoading) { return };

    setFolderLoading(true);
    const token = await Storage.getItem("token");

    try {
      const res = await fetch(
        `${API_URL}/api/folder/${id}`,
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
          alert(`Folder does not exist. Please try again later.`);
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

      const responseData = await res.json();

      setFolder({
        id: Array.isArray(id) ? id[0] : id, //because it thinks id is an array
        name: responseData.folderName
      })
    }
    catch(error) {
      console.log("Error when trying to fetch project data:", error)
    }
    finally {
      setFolderLoading(false);
    }
  }



  //fetch project data
  const fetchData = async () => {
    if (!tokenOkay) { return };
    if (loading || folderLoading) { return };

    setLoading(true);

    const token = await Storage.getItem("token");

    filterArray = filter

    //if we have no filters, we fetch everything -> similar to if we have all 3 filters applied
    //will treat those conditions the exact same because regardless, we always need to fetch
    if (filterArray.length === 0) {
      filterArray = ["Not Started", "In Progress", "Completed"]
    }

    try {
      let status = ``;

      for (let i = 0; i < filterArray.length; i++) {
        let tempElement = filterArray[i].replace(/"/g, '');
        if (i == 0) {
          status = `status[]=${tempElement}`
        }
        else {
          status = status + `&status[]=${tempElement}`
        }
      }

    const res = await fetch(
      `${API_URL}/api/folder/${id}/project?${status}`,
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
      router.replace("/login");
      return;
    }

    //if for some reason, didn't set up the status filter correctly
    else if (res.status == 400) {
      if (!alreadyAlerted.current) {
        alreadyAlerted.current = true;
        alert("Something went wrong when filtering... please try again later.");
      }
      router.back();
      return;
    }

    else if (res.status == 404) {
      setProjects([])
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

    const responseData = await res.json();

    const format_projects = responseData.projects.map((row: any) => ({
      id: row.fld_project_pk,
      title: row.fld_p_name,
      status: row.fld_status,
    }))

    setProjects(format_projects);

    }
    catch(error) {
      console.log("Error when trying to fetch project data:", error)
    }
    finally {
      setLoading(false);
    }
  }


  const filterStyles = StyleSheet.create({
    default: {
      backgroundColor: colors.exploreCardBackground,
      borderWidth: 1,
      borderColor: colors.exploreCardBackground,
    },
    red: {
      backgroundColor:
        currentTheme === "light" ? "#FF746C" : colors.exploreCardBackground,
      borderWidth: 1,
      borderColor: "#FF2C2C",
    },
    yellow: {
      backgroundColor:
        currentTheme === "light" ? "#FFEE8C" : colors.exploreCardBackground,
      borderWidth: 1,
      borderColor: "#FFBF00",
    },
    green: {
      backgroundColor:
        currentTheme === "light" ? "#A3C585" : colors.exploreCardBackground,
      borderWidth: 1,
      borderColor: "green",
    },
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      backgroundColor: colors.background,
      flexDirection: "column",
    },
    backButton: {
      paddingRight: 8,
      paddingVertical: 6,
    },
    headerBox: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 30,
      alignItems: "center",
      alignContent: "center"
    },
    folderName: {
      paddingBottom: 16,
      alignItems: "center",
    },
    titleText: {
      color: colors.text,
      fontSize: 35,
      fontWeight: "bold",
    },
    projectFiltersBar: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 25,
      paddingBottom: 16,
    },
    projectFilterButton: {
      color: colors.text,
      backgroundColor: colors.exploreCardBackground,
      padding: 10,
      borderRadius: 14,
    },
    projectContainer: {
      backgroundColor: colors.exploreCardBackground,
      paddingHorizontal: 12,
      alignItems: "flex-start",
      borderRadius: 16,
      paddingVertical: 16,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
      flexDirection: "row",
    },
    statusDot: {
      height: 20,
      width: 20,
      borderRadius: 16,
      marginLeft: 5,
    },
    floatingButton: {
      position: "absolute",
      right: 30,
      width: 65,
      height: 65,
      borderRadius: 32,
      backgroundColor: colors.decorativeBackground,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 5,
    },
  });

  return (
    <View style={styles.container}>
      {/* Back Button + Search Bar Icon */}
      <View style={styles.headerBox}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color={colors.text} />
            </Pressable>
        <Feather name="search" size={24} color={colors.text} />
      </View>

      {/*Folder Name title*/}
      <View style={styles.folderName}>
        <Text style={styles.titleText}>{folder?.name}</Text>
      </View>

      {/* Filter options -> not started, in progress, completed */}
      <View style={styles.projectFiltersBar}>
        <Pressable onPress={() => updateFilters("Not Started")}>
          <Text
            style={[
              styles.projectFilterButton,
              filter.includes("Not Started")
                ? filterStyles.red
                : filterStyles.default,
            ]}
          >
            {" "}
            Not Started{" "}
          </Text>
        </Pressable>

        <Pressable onPress={() => updateFilters("In Progress")}>
          <Text
            style={[
              styles.projectFilterButton,
              filter.includes("In Progress")
                ? filterStyles.yellow
                : filterStyles.default,
            ]}
          >
            {" "}
            In Progress{" "}
          </Text>
        </Pressable>

        <Pressable onPress={() => updateFilters("Completed")}>
          <Text
            style={[
              styles.projectFilterButton,
              filter.includes("Completed")
                ? filterStyles.green
                : filterStyles.default,
            ]}
          >
            {" "}
            Completed{" "}
          </Text>
        </Pressable>
      </View>

      {/*refresh only where the projects live at */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Project info (Assuming an infinite scroll here?) */}
        <FlatList
          data={projects}
          renderItem={({ item }) => (
            <View style={styles.projectContainer}>
              <View
                style={{ justifyContent: "space-between", flexDirection: "row" }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    flex: 1,
                    paddingRight: 12,
                  }}
                >
                  <Text style={{ color: colors.text, flexShrink: 1 }}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.statusDot,
                      item.status == "Completed"
                        ? filterStyles.green
                        : item.status == "In Progress"
                        ? filterStyles.yellow
                        : filterStyles.red,
                    ]}
                  />
                </View>
                <Pressable>
                      <Entypo
                        name="dots-three-vertical"
                        size={20}
                        color={colors.text}
                      />
                    </Pressable>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
          contentContainerStyle={{
            paddingTop: 16,
            paddingHorizontal: 30,
            flexGrow: 1,
          }}
          ListEmptyComponent={() => {
            if (loading) {
              return <ActivityIndicator size="small" color={colors.text}/>
            }
            else if (projects?.length === 0) {
              return (
                <View style={{paddingVertical: 10}}>
                  <Text style={{color: colors.settingsText, fontWeight: "bold", textAlign: "center"}}> No projects here... </Text>
                </View>
              )
            }
          }}
          ListFooterComponentStyle={{ alignItems: "center", marginTop: 15 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}/>}
        />
      </GestureHandlerRootView>

      <Pressable
        style={[styles.floatingButton, { bottom: insets.bottom + 10}]}
        onPress={() => console.log("Will update to add a project!")}
      >
        <Feather name="plus" size={28} color={colors.decorativeText} />
      </Pressable>
    </View>
  );
}
