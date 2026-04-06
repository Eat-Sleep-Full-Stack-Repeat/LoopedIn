import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import React, { useEffect } from "react";
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
title?: string;
};

export default function SettingsOverlay({
visible,
onClose,
onAccessibility,
onAppearance,
onLogout,
title = "Settings",
}: SettingsOverlayProps) {
const { width: screenW } = useWindowDimensions();
const panelW = Math.min(420, Math.max(320, Math.round(screenW * 0.85)));
const translateX = useSharedValue(panelW);

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

useEffect(() => {
if (visible) {
translateX.value = withTiming(0, { duration: 220 });
} else {
translateX.value = withTiming(panelW, { duration: 200 });
}
}, [visible]);

const animateClose = () => {
translateX.value = withTiming(panelW, { duration: 200 }, () => {
runOnJS(onClose)();
});
};

const pan = Gesture.Pan()
.maxPointers(1)
.activeOffsetX([-12, 12])
.failOffsetY([-8, 8])
.onUpdate((e) => {
const next = Math.min(panelW, Math.max(0, e.translationX));
translateX.value = next;
})
.onEnd((e) => {
const shouldClose =
translateX.value > panelW * 0.33 || e.velocityX > 600;
if (shouldClose) {
runOnJS(animateClose)();
} else {
translateX.value = withSpring(0, { velocity: e.velocityX });
}
});

const panelStyle = useAnimatedStyle(() => ({
transform: [{ translateX: translateX.value }],
}));

const backdropStyle = useAnimatedStyle(() => {
const progress = 1 - translateX.value / panelW;
return { opacity: 0.35 * progress };
});

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
<Text style={styles.menuItemChevron}>›</Text>
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
backgroundColor: colors.topBackground,
borderTopLeftRadius: 16,
borderBottomLeftRadius: 16,
paddingTop: insets.top,
},
safeArea: {
flex: 1,
paddingHorizontal: 16,
paddingTop: 16,
},
headerRow: {
flexDirection: "row",
justifyContent: "space-between",
alignItems: "center",
paddingHorizontal: 23,
},
headerTitle: {
fontSize: 20,
fontWeight: "700",
color: colors.text,
},
closeBtn: {
width: 36,
height: 36,
alignItems: "center",
justifyContent: "center",
},
closeBtnText: { fontSize: 18, color: colors.text },
sectionHeader: {
marginTop: 18,
marginBottom: 6,
paddingHorizontal: 23,
fontSize: 12,
fontWeight: "700",
color: colors.settingsText,
},
menuItem: {
minHeight: 48,
paddingHorizontal: 23,
flexDirection: "row",
justifyContent: "space-between",
alignItems: "center",
},
menuItemPressed: { backgroundColor: "rgba(0,0,0,0.04)" },
menuItemDisabled: { opacity: 0.6 },
menuItemText: {
fontSize: 16,
color: colors.settingsMenuText,
},
menuItemTextDestructive: {
color: colors.warning,
},
menuItemChevron: {
fontSize: 18,
color: colors.settingsMenuText,
},
divider: {
height: 1,
},
});

return (
<Modal visible={visible} transparent>
<GestureHandlerRootView style={styles.flex}>
<AnimatedPressable
onPress={animateClose}
style={[styles.backdrop, backdropStyle]}
/>

<GestureDetector gesture={pan}>
<Animated.View
style={[styles.panel, { width: panelW }, panelStyle]}
>
<SafeAreaView style={styles.safeArea}>
<View style={styles.headerRow}>
<Text style={styles.headerTitle}>{title}</Text>
<Pressable onPress={animateClose}>
<Text style={styles.closeBtnText}>✕</Text>
</Pressable>
</View>

<ScrollView>
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

<SectionHeader label=" " />
<MenuItem label="Log Out" destructive onPress={onLogout} />
</ScrollView>
</SafeAreaView>
</Animated.View>
</GestureDetector>
</GestureHandlerRootView>
</Modal>
);
}

