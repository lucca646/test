import { Platform } from "react-native";
import * as Updates from "expo-updates";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * MAJ OTA sans build — version anti boucle de crash.
 * - attend que l’UI soit stable
 * - ne reload que si un update vraiment nouveau est téléchargé
 * - ignore toute erreur (réseau, rollback, etc.)
 */
export async function applyOtaUpdateIfAny(): Promise<void> {
  if (__DEV__ || Platform.OS === "web") return;
  if (!Updates.isEnabled) return;

  try {
    // Laisse l’écran s’afficher avant de toucher au reload
    await sleep(3000);

    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return;

    const fetched = await Updates.fetchUpdateAsync();
    if (!fetched.isNew) return;

    await Updates.reloadAsync();
  } catch {
    /* jamais planter le lancement pour une MAJ */
  }
}
