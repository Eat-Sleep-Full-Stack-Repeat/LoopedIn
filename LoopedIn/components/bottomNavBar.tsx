import { router } from "expo-router";
import { View, StyleSheet, Text, Image, Pressable } from "react-native";
import {  useSafeAreaInsets } from "react-native-safe-area-context";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/Styles/colors";

const handleProfilePress = () => {
  router.replace("/userProfile");
};

const handleForumPress = () => {
  router.replace("/forumFeed");
};

const handleProjectTrackerPress = () => {
  //FIXME: route project tracket to correct screen
  router.replace("/");
}

const BottomNavButton = () => {
  const {currentTheme} = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      flexDirection: "row",
      flexWrap: "nowrap",
      justifyContent: "space-evenly",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.topBackground,
      width: "90%",
      padding: 10,
      backgroundColor: colors.background,
      alignSelf: "center",
      borderRadius: 50,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
  });

  return (
    <View style={[styles.container, {bottom: insets.bottom}]}>
      <Pressable onPress={handleProfilePress}>
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* put the profile icon stuff here */}
          <MaterialCommunityIcons name="account-circle-outline" size={40} color={colors.text}/>
          {/* <Image
            source={require("@/assets/images/icons8-cat-profile-50.png")}
          /> */}
          <Text style={{ color: colors.text }}> profile </Text>
        </View>
      </Pressable>

      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* put profile tracking stuff here */}
        <Pressable onPress={handleProjectTrackerPress}>
          <MaterialCommunityIcons name="notebook" size={40} color={colors.text}/>
          <Text style={{ color: colors.text }}> tracker </Text>
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* put the explore icon stuff here */}
        <MaterialCommunityIcons name="home" size={40} color={colors.text}/>
        <Text style={{ color: colors.text }}> explore </Text>
      </View>
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* put the forums stuff here */}
        <Pressable onPress={handleForumPress}>
          <MaterialCommunityIcons name="forum-outline" size={40} color={colors.text}/>
          <Text style={{ color: colors.text }}> forums </Text>
        </Pressable>
      </View>
    </View>
  );
};


export default BottomNavButton;
