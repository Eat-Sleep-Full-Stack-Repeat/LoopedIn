import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const Storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};
