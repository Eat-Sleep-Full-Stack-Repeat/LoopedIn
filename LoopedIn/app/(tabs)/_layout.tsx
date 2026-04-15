import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Pressable, View } from "react-native";
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
  userProfile: {
    name: "account",
    size: ICONSIZE + 2,
    label: "Profile",
    hint: "account page",
  },
  forumFeed: {
    name: "forum",
    size: ICONSIZE,
    label: "Forums",
    hint: "forum feed",
  },
  mystuff: {
    name: "bag-personal",
    size: ICONSIZE,
    label: "My Stuff",
    hint: "inventory and wishlist page",
  },
  explore: {
    name: "home",
    size: ICONSIZE + 3,
    label: "Explore",
    hint: "posts feed",
  },
  folderscreen: {
    name: "notebook",
    size: ICONSIZE,
    label: "Project Tracker",
    hint: "project folder page",
  },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((route) => icons[route.name]);

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
      {visibleRoutes.map((route) => {
        const iconConfig = icons[route.name];
        if (!iconConfig) return null;

        const originalIndex = state.routes.findIndex((r) => r.key === route.key);
        const isFocused = state.index === originalIndex;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              if (!isFocused) navigation.navigate(route.name);
            }}
            style={{ alignItems: "center", flex: 1 }}
            accessible={true}
            accessibilityLabel={iconConfig.label}
            accessibilityHint={"Navigates to the " + iconConfig.hint}
            accessibilityState={isFocused ? { selected: true } : { selected: false }}
            accessibilityRole={"menuitem"}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
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
                />
              ) : null}

              <MaterialCommunityIcons
                name={iconConfig.name}
                size={iconConfig.size}
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
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="userProfile"
        options={{ title: "Profile", tabBarAccessibilityLabel: "Profile page" }}
      />

      <Tabs.Screen
        name="folderscreen"
        options={{
          title: "Tracker",
          tabBarAccessibilityLabel: "Project tracker page",
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{ title: "Explore", tabBarAccessibilityLabel: "Explore page" }}
      />

      <Tabs.Screen
        name="forumFeed"
        options={{
          title: "Forum",
          tabBarAccessibilityLabel: "Forum Feed page",
        }}
      />

      <Tabs.Screen
        name="mystuff"
        options={{ headerShown: false, animation: "none" }}
      />
    </Tabs>
  );
}