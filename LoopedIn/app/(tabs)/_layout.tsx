import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs, router } from "expo-router";
import {
  Pressable,
  View,
  Text,
  Image,
  ImageSourcePropType,
} from "react-native";

//array of objects for the nav bar icons
const icons: Record<
  string,
  React.ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  userProfile: "account",
  forumFeed: "forum",
  myStuff: "bag-personal",
  explore: "home",
  tracker: "notebook",
  index: "cake",
};

// Bottom tab bar style
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: 20,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label = options.title;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              if (!isFocused) navigation.navigate(route.name);
            }}
            style={{ alignItems: "center" }}
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <MaterialCommunityIcons name={icons[route.name]} size={24} />
            <Text style={{ marginBottom: 20 }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: "none" }}
    >
      {/* Link to the developers screen */}
      <Tabs.Screen
        name="index"
        options={{ title: "Dev", tabBarAccessibilityLabel: "Development" }}
      />

      {/* Link to the profile screen */}
      <Tabs.Screen
        name="userProfile"
        options={{ title: "Profile", tabBarAccessibilityLabel: "Profile page" }}
      />

      {/* Link to the explore screen */}
      <Tabs.Screen
        name="explore"
        options={{ title: "Explore", tabBarAccessibilityLabel: "Explore page" }}
      />

      {/* Link to the Forum Feed screen */}
      <Tabs.Screen
        name="forumFeed"
        options={{
          title: "Forum",
          tabBarAccessibilityLabel: "Forum Feed page",
        }}
      />
    </Tabs>
  );
}
