import { Platform } from "react-native";
import Constants from "expo-constants";

const getApiUrl = () => {
  // Try Expo Go / LAN IP detection
  try {
    const debuggerHost =
      Constants.manifest2?.extra?.expoGo?.debuggerHost ??
      Constants.manifest?.debuggerHost ??
      Constants.expoConfig?.hostUri;

    if (debuggerHost) {
      const host = debuggerHost.split(":")[0];
      return `http://${host}:5000`; // your backend port
    }
  } catch (e) {
    console.warn("Unable to detect debuggerHost from Expo manifest:", e);
  }

  // Fallbacks for emulators/simulators
  if (Platform.OS === "android") return "http://10.0.2.2:5000";
  return "http://localhost:5000";
};

const API_URL = getApiUrl();
export default API_URL;
