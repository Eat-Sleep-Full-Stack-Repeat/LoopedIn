import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Index() {
const { currentTheme } = useTheme();
const colors = Colors[currentTheme];
const router = useRouter();

return (
<GestureHandlerRootView
style={{
flex: 1,
justifyContent: "center",
alignItems: "center",
backgroundColor: colors.background,
}}
>
{/* Title */}
<Text style={{ color: colors.text, fontSize: 18 }}>
This will be the welcome screen
</Text>

{/* Navigation */}
<TouchableOpacity
onPress={() => router.push("/login")}
style={{ marginTop: 20 }}
>
<Text style={{ color: colors.text }}>Login Page</Text>
</TouchableOpacity>

<TouchableOpacity
onPress={() => router.push("/welcomePage")}
style={{ marginTop: 20 }}
>
<Text style={{ color: colors.text }}>Welcome Page</Text>
</TouchableOpacity>
</GestureHandlerRootView>
);
}
