import { Link, router } from "expo-router";
import { View, StyleSheet, Text, Image, Pressable } from "react-native";
import { SafeAreaInsetsContext, useSafeAreaInsets } from "react-native-safe-area-context";

const handleProfilePress = () => {
  router.replace("/userProfile");
};

const handleForumPress = () => {
  // FIXME: route the forums button to the correct page - this is for testing
  router.replace("/");
}

const BottomNavButton = () => {
  const insets = useSafeAreaInsets();

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
          <Image
            source={require("@/assets/images/icons8-cat-profile-50.png")}
          />
          <Text> profile </Text>
        </View>
      </Pressable>

      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* put profile tracking stuff here */}
        <Image source={require("@/assets/images/icons8-journal-50.png")} />
        <Text> tracker </Text>
      </View>
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* put the explore icon stuff here */}
        <Image source={require("@/assets/images/icons8-exterior-50.png")} />
        <Text> explore </Text>
      </View>
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* put the forums stuff here */}
        <Pressable onPress={handleForumPress}>
          <Image
            source={require("@/assets/images/icons8-communication-50.png")}
          />
          <Text> forums </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-evenly",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0D5DD",
    width: "90%",
    padding: 10,
    backgroundColor: "#F8F2E5",
    alignSelf: "center",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default BottomNavButton;
