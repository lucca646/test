import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "../src/auth/AuthContext";
import AuthGate from "../src/screens/AuthGate";
import { Banner, Button } from "../src/ui/Apple";
import { TAB_BAR_CLEARANCE, useColors } from "../src/theme";
import {
  greetingName,
  usePlanDuJour,
} from "../src/hooks/usePlanDuJour";

function AccueilScreen() {
  const { user, activated } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const plan = usePlanDuJour(user?.email);
  const prenom = greetingName(user?.name, user?.email);

  const go = (href: "/envois" | "/entreprises" | "/recherche", params?: { filter?: string }) => {
    Haptics.selectionAsync().catch(() => {});
    if (params?.filter) {
      router.push({ pathname: href, params });
    } else {
      router.push(href);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 8) + 8,
        paddingBottom: TAB_BAR_CLEARANCE + insets.bottom,
        paddingHorizontal: 20,
        gap: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={plan.loading}
          onRefresh={() => void plan.refresh()}
          tintColor={c.accent}
        />
      }
    >
      <View style={{ gap: 6 }}>
        <Text style={[styles.hello, { color: c.text }]}>
          Bonjour {prenom}
        </Text>
        <Text style={[styles.lead, { color: c.muted }]}>
          Voici ton plan pour avancer aujourd’hui.
        </Text>
      </View>

      {!activated ? (
        <Banner
          tone="info"
          title="Presque prêt"
          subtitle="Compose d’abord ta recherche — l’activation débloque les envois."
          onPress={() => go("/recherche")}
        />
      ) : null}

      {plan.error ? (
        <Banner
          tone="error"
          title="On n’a pas pu charger ton plan"
          subtitle="Toucher pour réessayer"
          onPress={() => void plan.refresh()}
        />
      ) : null}

      {plan.loading && !plan.error ? (
        <View style={[styles.nextCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : (
        <View
          style={[
            styles.nextCard,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text style={[styles.nextEyebrow, { color: c.accent }]}>
            {plan.next.title}
          </Text>
          <Text style={[styles.nextSubtitle, { color: c.text }]}>
            {plan.next.subtitle}
          </Text>
          <Button
            label={plan.next.cta}
            onPress={() => go(plan.next.href, plan.next.params)}
          />
        </View>
      )}

      <Text style={[styles.section, { color: c.muted }]}>Où tu en es</Text>
      <View style={styles.tiles}>
        <Pressable
          onPress={() => go("/entreprises", { filter: "contact" })}
          style={[styles.tile, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <Text style={[styles.tileValue, { color: c.text }]}>
            {plan.toContact}
          </Text>
          <Text style={[styles.tileLabel, { color: c.muted }]}>
            À contacter
          </Text>
        </Pressable>
        <Pressable
          onPress={() => go("/entreprises", { filter: "sent" })}
          style={[styles.tile, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <Text style={[styles.tileValue, { color: c.text }]}>{plan.sent}</Text>
          <Text style={[styles.tileLabel, { color: c.muted }]}>Envoyés</Text>
        </Pressable>
        <Pressable
          onPress={() => go("/envois")}
          style={[styles.tile, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <Text style={[styles.tileValue, { color: c.text }]}>
            {plan.deckReady}
          </Text>
          <Text style={[styles.tileLabel, { color: c.muted }]}>
            Prêtes à envoyer
          </Text>
        </Pressable>
      </View>

      {plan.queueLabel ? (
        <Pressable
          onPress={() => go("/recherche")}
          style={[
            styles.queueCard,
            { backgroundColor: c.bannerSuccessBg, borderColor: c.bannerSuccessBorder },
          ]}
        >
          <Text style={[styles.queueTitle, { color: c.success }]}>
            Ta recherche
          </Text>
          <Text style={[styles.queueSub, { color: c.text }]}>
            {plan.queueLabel}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => go("/recherche")}
        style={styles.secondary}
        hitSlop={8}
      >
        <Text style={{ color: c.accent, fontSize: 16, fontWeight: "600" }}>
          Ajuster ma recherche
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hello: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  lead: {
    fontSize: 16,
    lineHeight: 22,
  },
  nextCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 12,
    minHeight: 140,
    justifyContent: "center",
  },
  nextEyebrow: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  nextSubtitle: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  section: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 4,
  },
  tiles: {
    flexDirection: "row",
    gap: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 4,
    minHeight: 88,
  },
  tileValue: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  queueCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 4,
  },
  queueTitle: { fontSize: 13, fontWeight: "700" },
  queueSub: { fontSize: 15, lineHeight: 20 },
  secondary: {
    alignItems: "center",
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: "center",
  },
});

export default function AccueilScreenGate() {
  return (
    <AuthGate>
      <AccueilScreen />
    </AuthGate>
  );
}
