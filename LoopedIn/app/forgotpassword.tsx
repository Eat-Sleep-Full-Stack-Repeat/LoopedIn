import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useAppSize } from "@/Hooks/useSize";

export default function ForgotPassword() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const size = useAppSize();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.exploreBackground },
      ]}
      accessible={true}
      accessibilityLabel="Forgot password screen"
    >
      <View style={styles.inner} accessible={true}>
        
        {/* Header */}
        <Text
          style={[
            styles.textHeader,
            {
              color: colors.text,
              fontSize: size.font.welcomeText,
              fontWeight: size.weight.largeTitle,
            },
          ]}
          accessibilityRole="header"
        >
          Forgot your password?
        </Text>

        {/* Instruction text */}
        <Text
          style={[
            styles.text,
            {
              color: colors.text,
              fontSize: size.font.bodyText,
            },
          ]}
          accessibilityLabel="If you need to reset your password, please contact support by email at looped in dot E S F S R at gmail dot com."
        >
          If you need to reset your password, please contact{" "}
          
          {/* Email */}
          <Text
            style={{ fontWeight: "600" }}
            accessibilityRole="link"
            accessibilityLabel="looped in dot E S F S R at gmail dot com"
          >
            loopedin.esfsr@gmail.com
          </Text>{" "}
          
          for support.
        </Text>
      </View>

      {/* Go Back button (MATCHES LOGIN BUTTON) */}
      <Pressable
        onPress={() => router.back()}
        accessible={true}
        accessibilityLabel="Go back"
        accessibilityHint="Returns to the previous screen"
        accessibilityRole="button"
        style={[
          styles.button,
          {
            backgroundColor: colors.decorativeBackground,
            borderColor: colors.decorativeBackground,
          },
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color:  colors.antiText,
              fontSize: size.font.titleText,
              fontWeight: size.weight.title,
            },
          ]}
        >
          Go Back
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    width: "80%",
    alignItems: "center",
    marginBottom: 60,
  },
  textHeader: {
    marginBottom: 25,
    textAlign: "center",
  },
  text: {
    marginHorizontal: 10,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    width: "80%",
    height: 55,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});