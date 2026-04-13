import { useAppSize } from "@/Hooks/useSize";
import { Colors } from "@/Styles/colors";
import { useSize } from "@/context/SizeContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Index() {
const { currentTheme } = useTheme();
const colors = Colors[currentTheme];
const router = useRouter();

const size = useAppSize();

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
<Text style={{ color: colors.text, fontSize: size.font.headline }}>
This will be the welcome screen
</Text>

{/* Navigation */}
<TouchableOpacity
onPress={() => router.push("/login")}
style={{ marginTop: 20 }}
>
<Text style={{ color: colors.text, fontSize: size.font.bodyText }}>Login Page</Text>
</TouchableOpacity>

<TouchableOpacity
onPress={() => router.push("/welcomePage")}
style={{ marginTop: 20 }}
>
<Text style={{ color: colors.text, fontSize: size.font.bodyText }}>Welcome Page</Text>
</TouchableOpacity>
</GestureHandlerRootView>
);
}
