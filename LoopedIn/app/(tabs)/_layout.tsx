import { useAppSize } from "@/Hooks/useSize";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Pressable, View, useWindowDimensions, Text } from "react-native";
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

// Bottom tab bar style
function CustomTabBar({
  state,
  descriptors,
  navigation,
  isLargeScreen,
}: BottomTabBarProps & { isLargeScreen: boolean }) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();

  const size = useAppSize();
  const visibleRoutes = state.routes.filter((route) => icons[route.name]);

  return (
    <View
      style={{
        flexDirection: isLargeScreen ? "column" : "row",
        justifyContent: isLargeScreen ? "flex-start" : "space-evenly",
        paddingTop: isLargeScreen ? insets.top + 30 : 10,
        backgroundColor: colors.topBackground,
        borderTopColor: colors.secondaryButton,
        borderTopWidth: isLargeScreen ? 0 : 1,
        borderRightWidth: isLargeScreen ? 1 : 0,
        borderRightColor: colors.secondaryButton,
        paddingHorizontal: 10,
        alignContent: "center",
        paddingBottom: isLargeScreen ? 12 : insets.bottom,
        width: isLargeScreen ? 260 : "100%",
      }}
    >
      {isLargeScreen ? (
        <Text
          style={{
            fontSize: size.font.largeTitleText,
            marginBottom: 25,
            fontWeight: "700",
            color: colors.decorativeBackground,
            marginLeft: 10,
          }}
        >
          LoopedIn
        </Text>
      ) : null}

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
            style={{
              alignItems: "center",
              flex: isLargeScreen ? 0 : 1,
              backgroundColor: isFocused
                ? colors.secondaryButton
                : "transparent",
              borderRadius: 15,
              justifyContent: isLargeScreen ? "flex-start" : "center",
              paddingHorizontal: 20,
            }}
            accessible={true}
            accessibilityLabel={iconConfig.label}
            accessibilityHint={"Navigates to the " + iconConfig.hint}
            accessibilityState={isFocused ? { selected: true } : { selected: false }}
            accessibilityRole={"menuitem"}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: isLargeScreen ? "flex-start" : "center",
                height: ICONSIZE + 15,
                width: isLargeScreen ? "100%" : ICONSIZE + 15,
                paddingHorizontal: isLargeScreen ? 10 : undefined,
                paddingVertical: isLargeScreen ? 5 : undefined,
                flexDirection: isLargeScreen ? "row" : "column",
                marginVertical: isLargeScreen ? 5 : undefined,
              }}
            >

              <MaterialCommunityIcons
                name={iconConfig.name}
                size={iconConfig.size}
                color={isFocused ? colors.decorativeBackground : colors.text}
              />

              {isLargeScreen ? (
                <Text
                  style={{
                    color: isFocused
                      ? colors.decorativeBackground
                      : colors.text,
                    paddingHorizontal: 10,
                    fontSize: size.font.button,
                    fontWeight: "500",
                  }}
                >
                  {icons[route.name].label}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768; //using 768 as a default break between phone and tablet
  return (
    <Tabs
      tabBar={(props) => (
        <CustomTabBar {...props} isLargeScreen={isLargeScreen} />
      )}
      screenOptions={{
        headerShown: false,
        animation: "none",
        tabBarPosition: isLargeScreen ? "left" : "bottom",
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