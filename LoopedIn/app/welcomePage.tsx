import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WelcomePage (){
    const insets = useSafeAreaInsets();
    const { currentTheme } = useTheme();
    const colors = Colors[currentTheme];

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            alignContent: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
        },
        contentContainer: {
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 60,
        },
        welcomeText: {
            fontSize: 36,
            textAlign: "center",
            marginBottom: 50,
            color: colors.welcomeText,
        },
        buttons: {
            backgroundColor: colors.decorativeBackground,
            padding: 20,
            borderRadius: 20,
            width: "80%",
            alignItems: "center",
            marginBottom: 30,
        },
        buttonText: {
            fontSize: 20,
            color: colors.decorativeText,
        }
    
    });


    return(
        <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
            <View style={styles.contentContainer}>
                <Text style={styles.welcomeText}>Welcome to LoopedIn</Text>
                <Pressable style={styles.buttons} onPress={() => router.push("/signup")}>
                    <Text style={styles.buttonText}> Sign Up </Text>
                </Pressable>
                <Pressable style={styles.buttons} onPress={() => router.push("/login")}>
                    <Text style={styles.buttonText}> Login </Text>
                </Pressable>
            </View>
        </View>
    );
}

