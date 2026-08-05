import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { registerForPushNotifications } from "../notifications";
import { useCurrentUser } from "./CurrentUserContext";

/**
 * Composant sans rendu — enregistre le push token pour l'utilisateur courant
 * (une fois par sélection d'identité) et ouvre le fil concerné quand on tape
 * sur une notification. Monté une seule fois à la racine de l'app.
 */
export default function PushNotificationsBridge() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const registeredForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || registeredForRef.current === user.id) return;
    registeredForRef.current = user.id;
    void registerForPushNotifications(user.id);
  }, [user]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const key = response.notification.request.content.data?.key as string | undefined;
      if (key) router.push(`/thread/${key}`);
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
