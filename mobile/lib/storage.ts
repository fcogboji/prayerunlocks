import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const memory = new Map<string, string>();

function isSecureStoreAvailable() {
  return (
    Platform.OS !== "web" &&
    typeof SecureStore.getItemAsync === "function" &&
    typeof SecureStore.setItemAsync === "function"
  );
}

export async function getStoredItem(key: string): Promise<string | null> {
  if (isSecureStoreAvailable()) {
    return SecureStore.getItemAsync(key);
  }
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }
  return memory.get(key) ?? null;
}

export async function setStoredItem(key: string, value: string): Promise<void> {
  if (isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
    return;
  }
  memory.set(key, value);
}

export async function deleteStoredItem(key: string): Promise<void> {
  if (isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(key);
    return;
  }
  memory.delete(key);
}
