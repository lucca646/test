import { Platform } from "react-native";
import * as Updates from "expo-updates";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * MAJ OTA — check rapide puis retry (anti-rollback silencieux côté UX).
 * Ne tourne pas en __DEV__ (Metro).
 */
export async function applyOtaUpdateIfAny(): Promise<void> {
  if (__DEV__ || Platform.OS === "web") return;
  if (!Updates.isEnabled) return;

  const tryOnce = async () => {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return false;
    const fetched = await Updates.fetchUpdateAsync();
    if (!fetched.isNew) return false;
    await Updates.reloadAsync();
    return true;
  };

  try {
    // 1er essai après paint court
    await sleep(800);
    if (await tryOnce()) return;

    // 2e essai (réseau lent / premier launch)
    await sleep(4000);
    await tryOnce();
  } catch {
    /* jamais planter le lancement pour une MAJ */
  }
}

/** Debug UI — confirme quel bundle OTA tourne. */
export function otaDebugLabel(): string {
  if (__DEV__) return "dev";
  try {
    const id = Updates.updateId;
    if (!id) return "embedded";
    return id.slice(0, 8);
  } catch {
    return "?";
  }
}
