import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";


export default function Index() {
  const router = useRouter();
  return (
     <GestureHandlerRootView style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>This will be the welcome screen!</Text>
      <TouchableOpacity onPress={() => router.push("/login")}
        style={{ marginTop: 20 }}>
        <Text>Login Page</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/ExampleSettings")}
        style={{ marginTop: 20 }}>
        <Text>Test Settings</Text>
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
}
