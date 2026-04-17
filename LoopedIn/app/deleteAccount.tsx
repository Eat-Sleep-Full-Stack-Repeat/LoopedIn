import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";


import { useAppSize } from "@/Hooks/useSize";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";

export default function Login() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();

  const size = useAppSize();
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { backgroundColor: colors.exploreBackground }]}>
      <View>
        <Text style={[styles.textHeader, { color: colors.text, fontSize: size.font.largeTitleText}]}>
          Interested in deleting your account?
        </Text>

        <Text style={[styles.text, { color: colors.text, fontSize: size.font.bodyText, }]}>
          We're sorry to see you go! To finalize account deletion, please contact the LoopedIn team at loopedin.esfsr@gmail.com. Our community wishes you all the best with your ongoing craft journey!
        </Text>
      </View>

      <Pressable
        onPress={() => router.back()}
        accessible={true}
        accessibilityLabel={"Back button"}
        accessibilityHint={`Return to user profile page from delete account screen.`}
        accessibilityRole={"button"}
        style={[styles.button, { backgroundColor: colors.decorativeBackground, marginTop: 100 }]}
      >
        <Text style={[styles.buttonText, {color: colors.antiText, fontWeight: size.weight.title, fontSize: size.font.button,}]}>Go Back</Text>
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
  textHeader: {
    fontSize: 22,
    marginTop: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    marginTop: 20,
    marginLeft: 10,
    marginRight: 10,
    textAlign: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});