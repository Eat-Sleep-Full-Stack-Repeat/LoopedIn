import { Text, View } from "react-native";
import BottomNavButton from "@/components/bottomNavBar";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>This will be the welcome screen!</Text>
      <BottomNavButton/>
    </View>
  );
}
