import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { fetchSheetProspects } from "../api/mailing";
import { apiSearchQueueStatus } from "../api/console";
import {
  isNoContactStatut,
  isSentStatut,
} from "../utils/prospectStatus";

export type NextActionKind = "envois" | "contact" | "recherche" | "idle";

export type PlanDuJour = {
  loading: boolean;
  error: string | null;
  toContact: number;
  sent: number;
  deckReady: number;
  queueRunning: boolean;
  queueLabel: string | null;
  next: {
    kind: NextActionKind;
    title: string;
    subtitle: string;
    cta: string;
    href: "/envois" | "/entreprises" | "/recherche";
    params?: { filter?: string };
  };
  refresh: () => Promise<void>;
};

function firstName(name?: string | null, email?: string | null) {
  const raw = (name || "").trim();
  if (raw) return raw.split(/\s+/)[0];
  const local = (email || "").split("@")[0];
  if (!local) return "toi";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function greetingName(name?: string | null, email?: string | null) {
  return firstName(name, email);
}

export function usePlanDuJour(email?: string | null): PlanDuJour {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toContact, setToContact] = useState(0);
  const [sent, setSent] = useState(0);
  const [deckReady, setDeckReady] = useState(0);
  const [queueRunning, setQueueRunning] = useState(false);
  const [queueLabel, setQueueLabel] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sheet, queue] = await Promise.all([
        fetchSheetProspects({ email: email || undefined, limit: 300 }),
        apiSearchQueueStatus(email || undefined).catch(() => null),
      ]);

      const rows = sheet.prospects || [];
      const contact = rows.filter(
        (r) => !isSentStatut(r.statut) && !isNoContactStatut(r.statut),
      ).length;
      const sentCount = rows.filter((r) => isSentStatut(r.statut)).length;
      setToContact(contact);
      setSent(sentCount);

      // Estimation file swipe : prospects à contacter avec mail
      const ready = rows.filter(
        (r) =>
          !isSentStatut(r.statut) &&
          !isNoContactStatut(r.statut) &&
          Boolean(r.mailSubject && r.mailBody),
      ).length;
      setDeckReady(ready);

      if (queue) {
        const done = Number(queue.done ?? queue.completed ?? 0);
        const total = Number(queue.total ?? queue.pending_total ?? 0);
        const running = Boolean(queue.running ?? queue.active);
        setQueueRunning(running);
        if (total > 0 || running) {
          setQueueLabel(
            running
              ? `Recherche en cours · ${done}/${total || "?"}`
              : `Dernière recherche · ${done}/${total || "?"}`,
          );
        } else {
          setQueueLabel(null);
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "On n’a pas pu charger ton plan. Tire pour réessayer.",
      );
    } finally {
      setLoading(false);
    }
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  let next: PlanDuJour["next"];
  if (deckReady > 0) {
    next = {
      kind: "envois",
      title: "Ton prochain pas",
      subtitle:
        deckReady === 1
          ? "1 entreprise est prête à recevoir ta candidature."
          : `${deckReady} entreprises attendent ton envoi.`,
      cta: "Envoyer maintenant",
      href: "/envois",
    };
  } else if (toContact > 0) {
    next = {
      kind: "contact",
      title: "Ton prochain pas",
      subtitle:
        toContact === 1
          ? "Il te reste 1 entreprise à contacter."
          : `Relance ta liste : ${toContact} à contacter.`,
      cta: "Voir ma liste",
      href: "/entreprises",
      params: { filter: "contact" },
    };
  } else if (!queueRunning) {
    next = {
      kind: "recherche",
      title: "Ton prochain pas",
      subtitle: "On te trouve des entreprises qui matchent ton profil.",
      cta: "Lancer une recherche",
      href: "/recherche",
    };
  } else {
    next = {
      kind: "idle",
      title: "Tout est en bonne voie",
      subtitle: "Ta recherche tourne. Reviens dès que de nouvelles entreprises arrivent.",
      cta: "Suivre ma recherche",
      href: "/recherche",
    };
  }

  return {
    loading,
    error,
    toContact,
    sent,
    deckReady,
    queueRunning,
    queueLabel,
    next,
    refresh,
  };
}
