import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "nexusops.access_token";

let inMemoryToken: string | null = null;

export const SessionService = {
  async getToken(): Promise<string | null> {
    if (inMemoryToken) return inMemoryToken;
    inMemoryToken =
      Platform.OS === "web"
        ? await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
        : await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return inMemoryToken;
  },

  async setToken(token: string): Promise<void> {
    inMemoryToken = token;
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
  },

  async clear(): Promise<void> {
    inMemoryToken = null;
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    }
  },
};
