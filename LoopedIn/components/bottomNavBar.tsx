import { Link, router } from "expo-router";
import { View, StyleSheet, Text, Image, Pressable } from "react-native";

const handleProfilePress = () => {
  router.push("/userProfile");
};

const BottomNavButton = () => {
  return (
    <View style={styles.container}>
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
        <Image
          source={require("@/assets/images/icons8-communication-50.png")}
        />
        <Text> forums </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 15,
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-evenly",
    alignItems: "center",
    borderTopWidth: 2,
    width: "100%",
    padding: 10,
  },
});

export default BottomNavButton;
