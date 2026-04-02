import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Entypo, Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Text, Pressable, FlatList, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
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
  const [projects, setProjects] = useState<FolderProject[]>([]);
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<FolderProject | null>(null);

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

  const openProjectMenu = (project: FolderProject) => {
    setSelectedProject(project);
    setMenuVisible(true);
  };

  const closeProjectMenu = () => {
    setMenuVisible(false);
    setSelectedProject(null);
  };

  const handleEditProject = () => {
    if (!selectedProject) return;
    router.push({
      pathname: "/editproject/[id]",
      params: { id: selectedProject.id.toString() },
    });
    closeProjectMenu();
  };

//delete project in triple-dot menu
  const handleDeleteProject = async () => {
    if (selectedProject !== null) {
      setMenuVisible(false);
      console.log(`Deleting post ID: ${selectedProject.id}`);
      // future delete logic here

      //check token
      const token = await Storage.getItem("token");

      //login check to reduce unnecessary fetches
      if (!token) {
        alert("Hold on there... you need to login first!")
        router.replace("/login")
        return
      }

      try {
        const response = await fetch(`${API_URL}/api/delete-project/${selectedProject.id}`,
          {
            method: "DELETE",
            headers : {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        )

        if (response.status === 403) {
          alert("Forbidden: You do not have permission to edit this post.")
          return
        }
        
        else if (response.status === 404) {
          alert("Cannot delete: project does not exist")
        }

        else if (!response.ok) {
          alert("Server error occured. Please try again later.")
          router.back()
          return
        }

        alert("Project successfully deleted!")

                  console.log("moving...");
        //for refreshing
        router.replace({
                    pathname: "/trackerFolder/[id]",
                    params: { id: folder.id } 
                  })

      }
      catch(error) {
        alert("Server error. Please try again later.")
        console.log("Error editing project:", error)
      }
    }
  };


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
    menuAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
    },
    menuActionText: {
      fontSize: 16,
    },
    deleteText: {
      color: colors.warning,
    },
    cancelBtn: {
      marginTop: 10,
      padding: 8,
      backgroundColor: colors.blockedBackground,
      borderRadius: 12,
      width: "100%",
      alignItems: "center",
    },
  });

  return (
    <View style={styles.container}>
      {/* Back Button + Search Bar Icon */}
      <View style={styles.headerBox}>
        <Pressable style={styles.backButton} onPress={() => router.back()}
          accessible={true}
          accessibilityLabel={"Go Back"}
          accessibilityHint={"Navigates back to the previous page."}
          accessibilityRole={"button"}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View/>
      </View>

      {/*Folder Name title*/}
      <View style={styles.folderName}
          accessible={true}
          accessibilityHint={"Project folder name."}
          accessibilityRole={"header"}>
        <Text style={styles.titleText}>{folder?.name}</Text>
      </View>

      {/* Filter options -> not started, in progress, completed */}
      <View style={styles.projectFiltersBar}>
        <Pressable onPress={() => updateFilters("Not Started")}
            accessible={true}
            accessibilityHint={filter.includes("Not Started") ? "Double tap to remove the Not Started filter."
              : "Double tap to filter for projects that are Not Started."
            }
            accessibilityRole={"button"}
            accessibilityState={filter.includes("Not Started") ? {checked: true} : {checked:false}}
          >
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

        <Pressable onPress={() => updateFilters("In Progress")}
            accessible={true}
            accessibilityHint={filter.includes("In Progress") ? "Double tap to remove the In Progress filter."
              : "Double tap to filter for projects that are In Progress."
            }
            accessibilityRole={"button"}
            accessibilityState={filter.includes("In Progress") ? {checked: true} : {checked:false}}>
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

        <Pressable onPress={() => updateFilters("Completed")}
          accessible={true}
          accessibilityHint={filter.includes("Completed") ? "Double tap to remove the Completed filter."
            : "Double tap to filter for projects that are Completed."
          }
          accessibilityRole={"button"}
          accessibilityState={filter.includes("Completed") ? {checked: true} : {checked:false}}>
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
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                }}
              >
                <Pressable
                  onPress={() =>
                  router.push({
                    pathname: "/singleProject/[id]",
                    params: { id: item.id.toString() },
                  })
                }
                accessible={true}
                accessibilityLabel={"Project title: " + item.title + ". " + item.status}
                accessibilityHint={"Double tap to view this project."}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    flex: 1,
                    paddingRight: 12,
                    height: "100%"
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
                </Pressable>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    openProjectMenu(item);
                  }}
                  accessible={true}
                  accessibilityLabel={"Project Menu"}
                  accessibilityHint={"Double tap to edit or delete this project"}
                  accessibilityRole={"button"}
                >
                  <Entypo
                    name="dots-three-vertical"
                    size={20}
                    color={colors.text}
                  />
                </Pressable>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
          contentContainerStyle={{
            paddingTop: 16,
            paddingHorizontal: 30,
            flexGrow: 1,
          }}
          ListEmptyComponent={() => {
            if (loading) {
              return <ActivityIndicator size="small" color={colors.text} />;
            } else if (projects?.length === 0) {
              return (
                <View style={{ paddingVertical: 10 }}>
                  <Text
                    style={{
                      color: colors.settingsText,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {" "}
                    No projects here...{" "}
                  </Text>
                </View>
              );
            }
          }}
          ListFooterComponentStyle={{ alignItems: "center", marginTop: 15 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      </GestureHandlerRootView>

      <Pressable
        style={[styles.floatingButton, { bottom: insets.bottom + 10 }]}
        onPress={() => router.push("/newproject")}
          accessible={true}
          accessibilityLabel={"Create Project"}
          accessibilityHint={"Navigates to the create project screen. Double tap to create a project."}
          accessibilityRole={"button"}
      >
        <Feather name="plus" size={28} color={colors.decorativeText} />
      </Pressable>

      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={closeProjectMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={closeProjectMenu}
          accessible={false}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: colors.exploreCardBackground },
            ]}
          >
            <TouchableOpacity onPress={handleEditProject} style={styles.menuAction}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Edit"
              accessibilityHint="Double tap to edit this project">
              <Feather name="edit" size={18} color={colors.text} />
              <Text style={[styles.menuActionText, { color: colors.text }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeleteProject} style={styles.menuAction}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Delete"
              accessibilityHint="Double tap to delete this project">
              <Feather name="trash-2" size={18} color={colors.warning} />
              <Text style={[styles.menuActionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMenuVisible(false)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              accessibilityHint="Double tap to exit project menu"
              style={styles.cancelBtn}
            >
              <Text style={[styles.menuActionText, { color: colors.text}]}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
