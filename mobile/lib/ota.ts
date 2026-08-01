import { Platform } from "react-native";
import * as Updates from "expo-updates";

/**
 * Récupère et applique un EAS Update dès le lancement (sans rebuild).
 * Ignoré en __DEV__ / Expo Go.
 */
export async function applyOtaUpdateIfAny(): Promise<void> {
  if (__DEV__ || Platform.OS === "web") return;
  if (!Updates.isEnabled) return;

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch {
    /* réseau / update non applicable — ignore */
  }
}
