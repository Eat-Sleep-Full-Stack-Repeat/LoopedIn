import { useAppSize } from "@/Hooks/useSize";
import { Colors } from "@/Styles/colors";
import { useSize } from "@/context/SizeContext";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Pressable,
  useWindowDimensions,
  SafeAreaView,
  Platform,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from "react-native";
import {
GestureHandlerRootView,
Gesture,
GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
useSharedValue,
useAnimatedStyle,
withTiming,
withSpring,
runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SettingsOverlayProps = {
  visible: boolean;
  onClose: () => void;
  onAccessibility?: () => void;
  onAppearance?: () => void;
  onLogout?: () => void;
  onEditProfile: () => void;
  title?: string;
};

export default function SettingsOverlay({
  visible,
  onClose,
  onAccessibility,
  onAppearance,
  onLogout,
  onEditProfile,
  title = "Settings",
}: SettingsOverlayProps) {
const { width: screenW } = useWindowDimensions();
const panelW = Math.min(420, Math.max(320, Math.round(screenW * 0.85)));
const translateX = useSharedValue(panelW);

  const [currentScreen, setCurrentScreen] = useState<
    "main" | "account" | "accessibility"
  >("main");

  // Open / close animations
  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, { duration: 220 });
    } else {
      translateX.value = withTiming(panelW, { duration: 200 });
    }
  }, [visible, panelW, translateX]);

  // Shared close animation
  const animateClose = () => {
    translateX.value = withTiming(panelW, { duration: 200 }, () => {
      runOnJS(setCurrentScreen)("main");
      runOnJS(onClose)();
    });
  };

  const { currentTheme, toggleTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const isDark = currentTheme === "dark";
  
  const toggleAnim = useSharedValue(isDark ? 1 : 0);

useEffect(() => {
toggleAnim.value = withTiming(isDark ? 1 : 0, { duration: 200 });
}, [isDark]);

const toggleStyle = useAnimatedStyle(() => ({
transform: [{ translateX: toggleAnim.value * 24 + 2 }],
}));

  const backdropStyle = useAnimatedStyle(() => {
    const progress = 1 - translateX.value / panelW;
    return { opacity: 0.35 * progress };
  });

  const size = useAppSize();
  const { currentSize, toggleSize } = useSize();
  const isLarge = currentSize === "large";
  const toggleSizeAnim = useSharedValue(isLarge ? 1 : 0);
  useEffect(() => {
    toggleSizeAnim.value = withTiming(isLarge ? 1 : 0, { duration: 200 });
  }, [isLarge]);
  const toggleSizeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleSizeAnim.value * 24 + 2 }],
  }));
  const pan = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      const next = Math.min(panelW, Math.max(0, e.translationX));
      translateX.value = next;
    })
    .onEnd((e) => {
      const shouldClose = translateX.value > panelW * 0.33 || e.velocityX > 600;
      if (shouldClose) {
        runOnJS(animateClose)();
      } else {
        translateX.value = withSpring(0, { velocity: e.velocityX });
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  /* ---------- Helpers ---------- */
  function SectionHeader({ label }: { label: string }) {
    return <Text style={styles.sectionHeader}>{label}</Text>;
  }

  function Divider() {
    return <View style={styles.divider} />;
  }

  function MenuItem({
    label,
    onPress,
    destructive,
    regButton,
    showChevron,
  }: {
    label: string;
    onPress?: () => void;
    destructive?: boolean;
    regButton?: boolean;
    showChevron?: boolean;
  }) {
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.menuItem,
          pressed && onPress ? styles.menuItemPressed : null,
          destructive && styles.logOutButton,
          regButton && styles.regButton,
          !onPress && styles.menuItemDisabled,
        ]}
        accessible={true}
        accessibilityHint={`Double tap to ${label}`}
        accessibilityRole={"button"}
      >
        <Text
          style={[
            styles.menuItemText,
            destructive && styles.menuItemTextDestructive,
            regButton && styles.regButtonText,
          ]}
        >
          {label}
        </Text>
        {showChevron ? <Text style={styles.menuItemChevron}>›</Text> : null}
      </Pressable>
    );
  }

  // Function for the main settings UI
  function MainSettings() {
    return (
      <>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text
            style={styles.headerTitle}
            accessible={true}
            accessibilityRole={"header"}
          >
            {title}
          </Text>
          <Pressable
            onPress={animateClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessible={true}
            accessibilityLabel={"Close"}
            accessibilityHint={"Double tap to close settings."}
            accessibilityRole={"button"}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.hairline} />

        {/* Scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          <SectionHeader label="App" />
          <MenuItem
            label="Accessibility"
            onPress={() => setCurrentScreen("accessibility")}
            showChevron
          />
          <Divider />
          <MenuItem
            label="Account"
            onPress={() => setCurrentScreen("account")}
            showChevron
          />
        </ScrollView>
      </>
    );
  }

  // Function for the accessibility settings UI
  function AccessibilitySettings() {
    return (
      <>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              flex: 1,
              marginRight: 12,
              alignItems: "flex-start",
            }}
          >
            <TouchableOpacity
              onPress={() => setCurrentScreen("main")}
              accessible={true}
              accessibilityLabel={"Go Back"}
              accessibilityHint={"Navigates back to the previous page."}
              accessibilityRole={"button"}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.headerTitle,
                {
                  justifyContent: "center",
                  alignItems: "center",
                  flexWrap: "wrap",
                  flexShrink: 1,
                },
              ]}
              accessible={true}
              accessibilityRole={"header"}
            >
              Accessibility Settings
            </Text>
          </View>
          <Pressable
            onPress={animateClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessible={true}
            accessibilityLabel={"Close"}
            accessibilityHint={"Double tap to close settings."}
            accessibilityRole={"button"}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.hairline} />

        {/* Scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          <Pressable
            onPress={toggleSize}
            style={styles.menuItem}
            accessible={true}
            accessibilityRole="switch"
            accessibilityState={{ checked: isLarge }}
            accessibilityLabel="Large Font mode"
          >
            <Text style={styles.menuItemText}>Large Font Mode</Text>

            <View
              style={{
                width: 50,
                height: 28,
                borderRadius: 20,
                backgroundColor: isLarge
                  ? colors.decorativeBackground
                  : colors.disabledButton,
                justifyContent: "center",
              }}
            >
              <Animated.View
                style={[
                  {
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.text,
                    position: "absolute",
                  },
                  toggleSizeStyle,
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            onPress={toggleTheme}
            style={styles.menuItem}
            accessible={true}
            accessibilityRole="switch"
            accessibilityState={{ checked: isDark }}
            accessibilityLabel="Dark mode"
          >
            <Text style={styles.menuItemText}>Dark Mode</Text>

            <View
              style={{
                width: 50,
                height: 28,
                borderRadius: 20,
                backgroundColor: isDark
                  ? colors.decorativeBackground
                  : colors.disabledButton,
                justifyContent: "center",
              }}
            >
              <Animated.View
                style={[
                  {
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.text,
                    position: "absolute",
                  },
                  toggleStyle,
                ]}
              />
            </View>
          </Pressable>
        </ScrollView>
      </>
    );
  }

  // Function for the account info
  function AccountSettings() {
    return (
      <>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setCurrentScreen("main")}
              accessible={true}
              accessibilityLabel={"Go Back"}
              accessibilityHint={"Navigates back to the previous page."}
              accessibilityRole={"button"}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.headerTitle,
                { justifyContent: "center", alignItems: "center" },
              ]}
              accessible={true}
              accessibilityRole={"header"}
            >
              Account Settings
            </Text>
          </View>
          <Pressable
            onPress={animateClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessible={true}
            accessibilityLabel={"Close"}
            accessibilityHint={"Double tap to close settings."}
            accessibilityRole={"button"}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.hairline} />

        {/* Scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          <MenuItem label="Edit Profile" regButton onPress={onEditProfile} />
          <MenuItem label="Log Out" destructive onPress={onLogout} />
        </ScrollView>
      </>
    );
  }

  /* ---------- Styles ---------- */
  const styles = StyleSheet.create({
    flex: { flex: 1 },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "black",
    },
    panel: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.topBackground,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
      overflow: "hidden",
      paddingTop: insets.top,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingHorizontal: 23,
    },
    headerTitle: {
      fontSize: size.font.largeTitleText,
      fontWeight: size.weight.title,
      color: colors.text,
      position: "relative",
    },
    closeBtn: {
      width: size.iconSize + 16,
      height: size.iconSize + 16,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 50,
      backgroundColor: colors.secondaryButton,
    },
    closeBtnText: {
      fontSize: size.font.button,
      fontWeight: size.weight.title,
      color: colors.secondaryText,
    },
    hairline: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: "rgba(0, 0, 0, 0)",
      marginBottom: 8,
    },
    scrollContent: { paddingVertical: 8, paddingRight: 8 },
    sectionHeader: {
      marginTop: 18,
      marginBottom: 6,
      paddingHorizontal: 23,
      fontSize: size.font.headline,
      fontWeight: size.weight.headline,
      color: colors.settingsText,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    divider: {
      height: 1,
      backgroundColor: "rgba(0, 0, 0, 0)",
      marginLeft: 4,
      marginRight: 4,
    },
    menuItem: {
      minHeight: 48,
      paddingVertical: 12,
      paddingHorizontal: 23,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    menuItemPressed: { backgroundColor: "rgba(0,0,0,0.04)" },
    menuItemDisabled: { opacity: 0.6 },
    menuItemText: {
      fontSize: size.font.button,
      color: colors.settingsMenuText,
      fontWeight: size.weight.headline,
    },
    menuItemTextDestructive: {
      color: colors.cancel,
      fontWeight: size.weight.largeTitle,
      fontSize: size.font.button,
    },
    menuItemChevron: {
      fontSize: size.font.headline,
      color: colors.settingsMenuText,
      marginLeft: 12,
      lineHeight: 18,
    },
    backButton: {},
    backArrow: {
      fontSize: size.font.largeTitleText,
      color: colors.text,
    },
    logOutButton: {
      borderWidth: 1,
      borderColor: colors.cancel,
      marginHorizontal: 30,
      alignItems: "center",
      justifyContent: "center",
    },
    regButton: {
      marginHorizontal: 30,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondaryButton,
      marginBottom: 20,
    },
    regButtonText: {
      color: colors.secondaryText,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={() => {
        setCurrentScreen("main");
        onClose();
      }}
      statusBarTranslucent
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : undefined}
    >
      <GestureHandlerRootView style={styles.flex}>
        {/* Backdrop */}
        <AnimatedPressable
          onPress={animateClose}
          style={[styles.backdrop, backdropStyle]}
        />

        {/* Overlay panel */}
        <View style={styles.flex}>
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[styles.panel, { width: panelW }, panelStyle]}
            >
              <SafeAreaView style={styles.safeArea}>
                {currentScreen === "main" && <MainSettings />}
                {currentScreen === "account" && <AccountSettings />}
                {currentScreen === "accessibility" && <AccessibilitySettings />}
              </SafeAreaView>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

