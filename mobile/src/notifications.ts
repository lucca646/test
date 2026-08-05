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

/**
 * Demande la permission puis récupère le push token Expo et l'enregistre
 * côté serveur pour cet utilisateur. Best-effort total : simulateur iOS,
 * permission refusée, pas de projectId (Expo Go), pas de réseau… échouent
 * silencieusement sans jamais bloquer le reste de l'app.
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    if (!Constants.isDevice && Platform.OS === "ios") return; // simulateur iOS : pas de push possible

    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted" && existing.canAskAgain !== false) {
      const requested = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      status = requested.status;
    }
    if (status !== "granted") return;

    const projectId = resolveProjectId();
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return;

    await registerPushDevice({ userId, token, platform: Platform.OS });
  } catch {
    // best-effort — voir commentaire ci-dessus
  }
}
