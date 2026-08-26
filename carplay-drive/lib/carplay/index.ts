/**
 * Point d'entrée sûr du module CarPlay.
 *
 * `react-native-carplay` est un module natif absent d'Expo Go, d'Android et du
 * web. On ne charge `./carPlayApp` (qui l'importe, et qui construit ses
 * templates dès l'évaluation du module) que si `RNCarPlay` est réellement lié —
 * sinon on ne fait rien, silencieusement.
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
