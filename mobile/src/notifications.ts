import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { registerPushDevice } from "./messages/api";

/**
 * Notifications push (Expo Push / APNs) — le serveur (`push-notify.ts`) ne
 * notifie que sur un message entrant alors que le bot est désactivé sur ce
 * contact (réponse manuelle attendue) ; pas de notif sur chaque SMS traité
 * par le bot, pour éviter le spam. Cf. AGENTS.md / FEATURE_PARITY.md.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("messages", {
    name: "Messages",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });
}

function resolveProjectId(): string | null {
  return (
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

export type PushRegistrationResult =
  /** Token enregistré côté serveur. */
  | "granted"
  /** Permission refusée (ou déjà refusée avant — iOS ne réaffiche le prompt qu'une fois). */
  | "denied"
  /** Simulateur / émulateur — pas de push possible. */
  | "unsupported"
  /** Pas de `projectId` EAS (Expo Go). */
  | "no-project"
  /** Erreur réseau / API Expo — voir logs. */
  | "error";

/**
 * Demande la permission puis récupère le push token Expo et l'enregistre
 * côté serveur pour cet utilisateur. Ne throw jamais — retourne un statut
 * explicite pour permettre à l'appelant (ex. réglage dans Paramètres)
 * d'informer l'utilisateur (permission refusée → rediriger vers Réglages).
 */
export async function registerForPushNotifications(
  userId: string,
): Promise<PushRegistrationResult> {
  try {
    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted" && existing.canAskAgain !== false) {
      const requested = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      status = requested.status;
    }
    if (status !== "granted") return "denied";

    const projectId = resolveProjectId();
    if (!projectId) return "no-project";

    // Pas de `Constants.isDevice` fiable dans expo-constants récent (toujours
    // `undefined`, donc faussement truthy en négation) — on laisse l'appel
    // natif lever son erreur "physical device required" sur simulateur/
    // émulateur, capturée ci-dessous.
    let token: string | undefined;
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/physical device|simulator|emulator/i.test(msg)) return "unsupported";
      throw err;
    }
    if (!token) return "error";

    await registerPushDevice({ userId, token, platform: Platform.OS });
    return "granted";
  } catch {
    return "error";
  }
}
