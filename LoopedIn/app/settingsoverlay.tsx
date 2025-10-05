import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Pressable,
  useWindowDimensions,
  SafeAreaView,
  Platform,
  AccessibilityInfo,
  findNodeHandle,
  Text,
  ScrollView,
  StyleSheet,
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SettingsOverlayProps = {
  visible: boolean;
  onClose: () => void;

  onEditProfile?: () => void;
  onAccessibility?: () => void;
  onAppearance?: () => void;
  onLogout?: () => void;

  title?: string;
};

export default function SettingsOverlay({
  visible,
  onClose,
  onEditProfile,
  onAccessibility,
  onAppearance,
  onLogout,
  title = "Settings",
}: SettingsOverlayProps) {
  const { width: screenW } = useWindowDimensions();
  const panelW = Math.min(420, Math.max(320, Math.round(screenW * 0.85)));

  // translateX: 0 = open, panelW = closed (off-screen)
  const translateX = useSharedValue(panelW);
  const firstFocusRef = useRef<View>(null);

  // Open/close side-effects
  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, { duration: 220 });
      setTimeout(() => {
        const node = findNodeHandle(firstFocusRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 250);
    } else {
      translateX.value = withTiming(panelW, { duration: 200 });
    }
  }, [visible, panelW, translateX]);

  // Shared close animation (used by swipe, backdrop, and x button)
  const animateClose = () => {
    translateX.value = withTiming(panelW, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  // Pan gesture with scroll-friendly thresholds
  const pan = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX([-12, 12]) // require horizontal move
    .failOffsetY([-8, 8])     // vertical scroll passes through
    .onUpdate((e) => {
      const next = Math.min(panelW, Math.max(0, e.translationX));
      translateX.value = next;
    })
    .onEnd((e) => {
      const shouldClose =
        translateX.value > panelW * 0.33 || e.velocityX > 600;
      if (shouldClose) {
        runOnJS(animateClose)(); // fade + slide + onClose
      } else {
        translateX.value = withSpring(0, { velocity: e.velocityX });
      }
    });

  // Panel slide style
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Backdrop fade style (0.35 when open, 0 when closed)
  const backdropStyle = useAnimatedStyle(() => {
    const progress = 1 - translateX.value / panelW; // 1 open → 0 closed
    return { opacity: 0.35 * progress };
  });

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : undefined}
    >
      <GestureHandlerRootView style={styles.flex}>
        {/* Animated backdrop (tap to close) */}
        <AnimatedPressable
          onPress={animateClose}
          style={[styles.backdrop, backdropStyle]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        {/* Touch shield + panel */}
        <Pressable style={styles.flex} accessible={false}>
          <GestureDetector gesture={pan}>
            <Animated.View
              accessibilityViewIsModal
              accessibilityRole="menu"
              style={[styles.panel, { width: panelW }, panelStyle]}
            >
              <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View ref={firstFocusRef} accessible style={styles.headerRow}>
                  <Text accessibilityRole="header" style={styles.headerTitle}>
                    {title}
                  </Text>
                  <Pressable
                    onPress={animateClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close settings"
                    hitSlop={12}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                {/* Divider */}
                <View style={styles.hairline} />

                {/* Scrollable menu */}
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator
                >
                  <SectionHeader label="Account" />
                  <MenuItem label="Edit Profile" onPress={onEditProfile} />
                  <Divider />

                  <SectionHeader label="App" />
                  <MenuItem
                    label="Accessibility"
                    onPress={onAccessibility}
                    showChevron
                  />
                  <Divider />
                  <MenuItem
                    label="Appearance"
                    onPress={onAppearance}
                    showChevron
                  />

                  <SectionHeader label=" " />
                  <MenuItem label="Log Out" destructive onPress={onLogout} />
                </ScrollView>
              </SafeAreaView>
            </Animated.View>
          </GestureDetector>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <Text accessibilityRole="header" style={styles.sectionHeader}>
      {label}
    </Text>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function MenuItem({
  label,
  onPress,
  destructive,
  showChevron,
}: {
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && onPress ? styles.menuItemPressed : null,
        !onPress && styles.menuItemDisabled,
      ]}
    >
      <Text
        style={[
          styles.menuItemText,
          destructive && styles.menuItemTextDestructive,
        ]}
      >
        {label}
      </Text>
      {showChevron ? (
        <Text style={styles.menuItemChevron} accessible={false}>
          ›
        </Text>
      ) : null}
    </Pressable>
  );
}

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
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
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
  headerTitle: { fontSize: 20, fontWeight: "700" },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  closeBtnText: { fontSize: 18, fontWeight: "700" },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginBottom: 8,
  },
  scrollContent: { paddingVertical: 8, paddingRight: 8 },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 6,
    paddingHorizontal: 23,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(0,0,0,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
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
  menuItemText: { fontSize: 16, color: "#111827", fontWeight: "500" },
  menuItemTextDestructive: { color: "#B91C1C", fontWeight: "700" },
  menuItemChevron: {
    fontSize: 18,
    color: "rgba(0,0,0,0.35)",
    marginLeft: 12,
    lineHeight: 18,
  },
});
