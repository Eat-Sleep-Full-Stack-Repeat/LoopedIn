import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import {
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

//variable to store the size of icons
const ICONSIZE = 26;

type IconProps = {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  size: number;
  label: string;
  hint: string;
};

//array of objects for the nav bar icons
const icons: Record<string, IconProps> = {
  userProfile: { name: "account", size: ICONSIZE + 2, label: "Profile", hint: "account page" },
  forumFeed: { name: "forum", size: ICONSIZE, label: "Forums", hint: "forum feed" },
  mystuff: { name: "bag-personal", size: ICONSIZE, label: "My Stuff", hint: "inventory and wishlist page" },
  explore: { name: "home", size: ICONSIZE + 3, label: "Explore", hint: "posts feed" },
  folderscreen: { name: "notebook", size: ICONSIZE, label: "Project Tracker", hint: "project folder page" },
  index: { name: "cake", size: ICONSIZE, label: "Dev Screen yippee", hint: "this will be deleted page" },
};

// Bottom tab bar style
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-evenly",
        paddingTop: 10,
        backgroundColor: colors.background,
        borderTopColor: colors.topBackground,
        borderTopWidth: 1,
        paddingHorizontal: 10,
        alignContent: "center",
        paddingBottom: insets.bottom,
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
            style={{ alignItems: "center", flex: 1 }}
            accessible={true}
            accessibilityLabel={icons[route.name].label}
            accessibilityHint={"Navigates to the " + icons[route.name].hint}
            accessibilityState={isFocused ? { selected: true } : { selected: false }}
            accessibilityRole={"menuitem"}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                // marginTop: 5,
                height: ICONSIZE + 15,
                width: ICONSIZE + 15,
              }}
            >
              {isFocused ? (
                <View
                  style={{
                    backgroundColor: colors.topBackground,
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                    borderRadius: ICONSIZE + 10,
                  }}
                ></View>
              ) : (
                <></>
              )}
              <MaterialCommunityIcons
                name={icons[route.name].name}
                size={icons[route.name].size}
                color={colors.text}
              />
            </View>
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
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
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

      {/* Link to the tracker screen */}
      <Tabs.Screen
        name="folderscreen"
        options={{
          title: "Tracker",
          tabBarAccessibilityLabel: "Project tracker page",
        }}
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

      {/* Link to the mystuff screen (inventory + wishlist) */}
      <Tabs.Screen
        name="mystuff"
        options={{ headerShown: false, animation: "none" }}
      />
    </Tabs>
  );
}
