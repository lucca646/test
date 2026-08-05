import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { getSimLimits, listSims, type SimLimits, type SimStatus } from "./api";
import { useAppearance, type AppearanceMode } from "./AppearanceContext";
import { useCurrentUser } from "./CurrentUserContext";
import { Group, Row, Segmented, SectionHeader } from "../ui/Apple";
import { ThemePicker } from "../ui/ThemePicker";
import { MESSAGES_API_URL } from "../config";
import { TAB_BAR_CLEARANCE, useColors } from "../theme";
import { otaDebugLabel } from "../../lib/ota";
import { registerForPushNotifications } from "../notifications";

function limitsSubtitle(limits?: SimLimits): string | undefined {
  if (!limits) return undefined;
  const max = limits.limits.maxMessagesPerDay;
  const sent = limits.usage.messagesSent;
  return max != null ? `${sent}/${max} SMS aujourd'hui` : `${sent} SMS aujourd'hui`;
}

const APPEARANCE_OPTIONS: { id: AppearanceMode; label: string }[] = [
  { id: "system", label: "Système" },
  { id: "light", label: "Clair" },
  { id: "dark", label: "Sombre" },
];

export default function ParametresScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { mode, setMode, themeId, setThemeId } = useAppearance();
  const { user } = useCurrentUser();
  const [sims, setSims] = useState<SimStatus[]>([]);
  const [limitsBySim, setLimitsBySim] = useState<Record<string, SimLimits>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);

  const refreshNotifStatus = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotifEnabled(status === "granted");
    } catch {
      // ignore
    }
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const list = await listSims();
      setSims(list);
      setError(null);
      const entries = await Promise.all(
        list.filter((s) => s.connected).map(async (s) => {
          try {
            return [s.id, await getSimLimits(s.id)] as const;
          } catch {
            return null;
          }
        }),
      );
      setLimitsBySim(
        Object.fromEntries(entries.filter((e): e is [string, SimLimits] => e !== null)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      void refreshNotifStatus();
    }, [load, refreshNotifStatus]),
  );

  const onToggleNotif = async (next: boolean) => {
    if (!next) {
      Alert.alert(
        "Notifications",
        "Pour désactiver les notifications, va dans Réglages iOS → COR·ALT → Notifications.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Réglages", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    if (!user) return;
    setNotifBusy(true);
    try {
      await registerForPushNotifications(user.id);
    } finally {
      await refreshNotifStatus();
      setNotifBusy(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 8) + 4,
        paddingBottom: TAB_BAR_CLEARANCE + insets.bottom,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
      }
    >
      <Text style={[styles.largeTitle, { color: c.text }]}>Paramètres</Text>

      <SectionHeader title="SIMs" />
      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 12 }} />
      ) : error ? (
        <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
      ) : (
        <Group>
          {sims.length === 0 ? (
            <Row
              label="Aucune SIM"
              icon={{ name: "cellular-outline", backgroundColor: c.muted }}
              last
            />
          ) : (
            sims.map((sim, i) => (
              <Row
                key={sim.id}
                icon={{
                  name: "cellular-outline",
                  backgroundColor: sim.connected ? c.success : c.danger,
                }}
                label={sim.label}
                subtitle={
                  [sim.ownNumber, limitsSubtitle(limitsBySim[sim.id])].filter(Boolean).join(" · ") ||
                  undefined
                }
                value={sim.connected ? "Connectée" : "Hors ligne"}
                accentValue={sim.connected}
                last={i === sims.length - 1}
              />
            ))
          )}
        </Group>
      )}

      <SectionHeader title="Apparence" />
      <View style={styles.appearanceWrap}>
        <Segmented
          options={APPEARANCE_OPTIONS}
          value={mode}
          onChange={(id) => setMode(id as AppearanceMode)}
        />
      </View>

      <SectionHeader title="Thème" />
      <ThemePicker value={themeId} onChange={setThemeId} />

      <SectionHeader title="Notifications" />
      <Group>
        <Row
          label="Notifications push"
          subtitle={
            notifBusy
              ? "…"
              : notifEnabled
                ? "Message manuel entrant (bot désactivé)"
                : "Désactivées"
          }
          icon={{ name: "notifications", backgroundColor: notifEnabled ? c.success : c.danger }}
          switchValue={notifEnabled}
          onSwitchChange={onToggleNotif}
          switchDisabled={notifBusy}
          last
        />
      </Group>

      <SectionHeader title="Application" />
      <Group>
        <Row
          label="API Messages"
          icon={{ name: "globe-outline", backgroundColor: c.accent }}
          value={MESSAGES_API_URL.replace(/^https?:\/\//, "")}
        />
        <Row
          label="Build"
          icon={{ name: "construct-outline", backgroundColor: "#8e8e93" }}
          value={otaDebugLabel()}
          last
        />
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  largeTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  error: { marginHorizontal: 16, fontSize: 14 },
  appearanceWrap: { marginBottom: 6 },
});
