import { useAppSize } from "@/Hooks/useSize";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { Feather } from "@expo/vector-icons";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BottomFab = () => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768; //using 768 as a default break between phone and tablet

  const size = useAppSize();

  const styles = StyleSheet.create({
    floatingButton: {
      position: "absolute",
      right: 20,
      bottom: isLargeScreen ? 20 : insets.bottom - 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.decorativeBackground,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 5,
    },
  });

  return (
    <View style={styles.floatingButton}>
      <Feather name="plus" size={size.iconSize + 8} color={colors.antiText} />
    </View>
  );
};

export default BottomFab;
