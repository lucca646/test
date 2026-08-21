/**
 * Point d'entrée sûr du prototype CarPlay.
 *
 * `react-native-carplay` est un module natif absent d'Expo Go et d'Android/Web.
 * On ne charge `./carPlayApp` (qui l'importe) QUE si le module natif `RNCarPlay`
 * est réellement lié — sinon on no-op silencieusement. Ainsi l'app continue de
 * tourner partout (Expo Go, Android, Web, dev-client sans CarPlay).
 */
import { NativeModules, Platform } from "react-native";

export function isCarPlaySupported(): boolean {
  return Platform.OS === "ios" && Boolean(NativeModules.RNCarPlay);
}

let started = false;

export function setupCarPlay(): void {
  if (started || !isCarPlaySupported()) return;
  started = true;
  try {
    // Require paresseux : jamais évalué quand le natif est absent.
    const mod = require("./carPlayApp") as typeof import("./carPlayApp");
    mod.registerCarPlay();
  } catch (err) {
    console.warn("[CarPlay] initialisation ignorée:", err);
  }
}
