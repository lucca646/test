import { MESSAGES_API_TOKEN, MESSAGES_API_URL } from "../config";

export class MessagesApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MessagesApiError";
    this.status = status;
  }
}

export type ConversationLabel = {
  id: number;
  name: string;
  color?: string;
  description?: string;
};

export type ConversationSummary = {
  key: string;
  phone: string;
  name: string;
  last_message?: string | null;
  last_date?: string;
  last_direction: "in" | "out";
  unread_count: number;
  message_count?: number;
  labels?: ConversationLabel[];
  bot_enabled?: boolean;
  category?: string;
  sim_id?: string;
};

export type ConversationMessage = {
  index: string;
  id: string;
  phone: string;
  content: string;
  text: string;
  date: string;
  box: "sent" | "inbox";
  direction: "in" | "out";
  read_sim?: number;
  read_ui?: number;
  sim_id?: string | null;
  timestamp?: number;
  reaction?: string | null;
  /** "bot" (défaut si absent sur un envoi sortant) ou "ui" (envoi manuel). */
  sentBy?: "bot" | "ui" | null;
  /** Coût facturé (€) — messages sortants IA uniquement. */
  cost?: number | null;
  status: "envoye" | "lu" | "non_lu" | string;
};

export type ConversationDetail = {
  key: string;
  phone: string;
  name: string;
  sim_id?: string;
  category?: string;
  bot_enabled?: boolean;
  labels?: ConversationLabel[];
  linkedin_url?: string | null;
  email?: string | null;
  project_summary?: string | null;
  cal_rdv_at?: string | null;
  total_cost?: number | null;
  messages: ConversationMessage[];
};

export type SimStatus = {
  id: string;
  label: string;
  ownNumber?: string;
  connected: boolean;
  network?: string;
  signal?: string;
  simMsisdn?: string;
  error?: string;
  draftCount?: number;
};

/** Signalement SAV (bouton "Signaler le bot"). */
export const BOT_REPORT_REASONS = [
  "repetition",
  "no_context",
  "wrong_info",
  "tone",
  "timing",
  "other",
] as const;
export type BotReportReason = (typeof BOT_REPORT_REASONS)[number];
export const BOT_REPORT_REASON_LABELS: Record<BotReportReason, string> = {
  repetition: "Répète ou ignore l'historique",
  no_context: "Ne répond pas à la question",
  wrong_info: "Information incorrecte",
  tone: "Ton ou formulation inadaptée",
  timing: "Timing inapproprié (relance, délai)",
  other: "Autre problème",
};
export const BOT_REPORT_STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  triaged: "Règle proposée",
  in_progress: "En attente validation",
  resolved: "Jurisprudence ajoutée",
  wont_fix: "Non retenu",
};
export type BotReportSummary = {
  id: string;
  status: string;
  reason: BotReportReason;
  note?: string;
  createdAt: string;
};

export type TramChecklistItem = {
  step: number;
  code?: string;
  label: string;
  instruction: string;
  done: boolean;
  current: boolean;
};
export type TramPayload = {
  number: string;
  method?: string;
  progress: { step: number; note?: string; state?: string };
  checklist: TramChecklistItem[];
  doneCount: number;
  totalSteps: number;
};

export type RelaunchTemplate = { id: string; text: string; createdAt: string };

export type SimDraft = {
  index: string;
  phone: string;
  content: string;
  date: string;
  simId: string;
  contactName: string | null;
  contactNumber: string | null;
};

export type SimLimits = {
  simId: string;
  day: string;
  timezone: string;
  limits: { maxMessagesPerDay: number | null; maxNewConversationsPerDay: number | null };
  usage: { messagesSent: number; newConversations: number };
  remaining: { messages: number | null; newConversations: number | null };
  apiCostDay: number;
  apiCostLifetime: number;
};

export type LabelCatalogEntry = { name: string; color: string; description: string };

export type StatsDayRow = {
  day: string;
  inbound: number;
  outbound: number;
  outboundBot: number;
  outboundUi: number;
  cost: number;
  newContacts: number;
  newConversations: number;
  activeContacts: number;
};

export type StatsPayload = {
  ok: boolean;
  from: string;
  to: string;
  sim: string | null;
  kpis: {
    peopleContacted: number;
    peopleReplied: number;
    newContacts: number;
    newConversations: number;
    activeContacts: number;
    inbound: number;
    outbound: number;
    outboundBot: number;
    outboundUi: number;
    replyRate: number | null;
    avgReplyLatencySec: number | null;
    rdvInPeriod: number;
    gagne: number;
    messagesPerContact: number | null;
  };
  volume: {
    inbound: number;
    outbound: number;
    outboundBot: number;
    outboundUi: number;
    outboundUnknown: number;
    hidden: number;
    series: StatsDayRow[];
  };
  costs: {
    total: number;
    avgPerPricedOutbound: number | null;
    costPerGagne: number | null;
  };
  funnel: {
    byCategory: Array<{ category: string; label: string; count: number }>;
    byLabel: Array<{ name: string; count: number }>;
  };
  conversion: {
    gagne: number;
    withCalRdv: number;
    rdvUpcoming: number;
    rdvPast: number;
    rdvInPeriod: number;
    rdvByDay: Array<{ day: string; count: number }>;
    rateVsContacted: number | null;
    costPerGagne: number | null;
  };
};

type FetchOpts = {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
};

/** État de connectivité — dérivé des échecs réseau (pas HTTP) sur `request()`. */
type ConnectivityListener = (online: boolean) => void;
let isOnline = true;
const connectivityListeners = new Set<ConnectivityListener>();
function setOnline(next: boolean) {
  if (isOnline === next) return;
  isOnline = next;
  connectivityListeners.forEach((l) => l(next));
}
export function getIsOnline(): boolean {
  return isOnline;
}
export function subscribeConnectivity(listener: ConnectivityListener): () => void {
  connectivityListeners.add(listener);
  return () => connectivityListeners.delete(listener);
}

async function request<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { method = "GET", body, timeoutMs = 15000 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (MESSAGES_API_TOKEN) headers.Authorization = `Bearer ${MESSAGES_API_TOKEN}`;

  let res: Response;
  try {
    res = await fetch(`${MESSAGES_API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    setOnline(true);
  } catch (err) {
    clearTimeout(timer);
    setOnline(false);
    if (err instanceof Error && err.name === "AbortError") {
      throw new MessagesApiError("Délai dépassé.", 0);
    }
    throw new MessagesApiError(
      err instanceof Error ? err.message : String(err),
      0,
    );
  }
  clearTimeout(timer);

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) || `Erreur ${res.status}`;
    throw new MessagesApiError(msg, res.status);
  }

  return data as T;
}

export async function listConversations(simId?: string): Promise<ConversationSummary[]> {
  const qs = simId ? `?sim=${encodeURIComponent(simId)}` : "";
  return request<ConversationSummary[]>(`/api/conversations${qs}`);
}

export async function getConversation(
  key: string,
  simId?: string,
): Promise<ConversationDetail> {
  const qs = simId ? `?sim=${encodeURIComponent(simId)}` : "";
  return request<ConversationDetail>(`/api/conversations/${encodeURIComponent(key)}${qs}`);
}

export async function markConversationRead(key: string, simId?: string): Promise<void> {
  const qs = simId ? `?sim=${encodeURIComponent(simId)}` : "";
  await request(`/api/conversations/${encodeURIComponent(key)}/read${qs}`, {
    method: "POST",
  });
}

export async function sendMessageToContact(params: {
  number: string;
  text: string;
  simId?: string;
}): Promise<{ success: boolean }> {
  const qs = params.simId ? `?sim=${encodeURIComponent(params.simId)}` : "";
  return request(`/api/contacts/${encodeURIComponent(params.number)}/send${qs}`, {
    method: "POST",
    body: { text: params.text },
    timeoutMs: 30000,
  });
}

export async function setBotEnabled(
  number: string,
  enabled: boolean,
  simId?: string,
): Promise<{ enabled: boolean }> {
  const qs = simId ? `?sim=${encodeURIComponent(simId)}` : "";
  return request(`/api/contacts/${encodeURIComponent(number)}/bot${qs}`, {
    method: "POST",
    body: { enabled },
  });
}

export async function listSims(): Promise<SimStatus[]> {
  return request<SimStatus[]>("/api/sims");
}

export async function getStats(params?: {
  sim?: string;
  from?: string;
  to?: string;
}): Promise<StatsPayload> {
  const q = new URLSearchParams();
  if (params?.sim) q.set("sim", params.sim);
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  const qs = q.toString();
  return request<StatsPayload>(`/api/stats${qs ? `?${qs}` : ""}`);
}

/** Statut complet du contact (fiche) : catégorie, bot, LinkedIn, email, extras. */
export async function updateContactStatus(
  number: string,
  params: {
    displayName?: string;
    category?: string;
    projectSummary?: string;
    botEnabled?: boolean;
    linkedinUrl?: string;
    email?: string;
    extras?: string[];
  },
  simId?: string,
): Promise<{ success: boolean; category: string; botEnabled: boolean; labels: ConversationLabel[] }> {
  const qs = simId ? `?sim=${encodeURIComponent(simId)}` : "";
  return request(`/api/contacts/${encodeURIComponent(number)}/status${qs}`, {
    method: "POST",
    body: params,
  });
}

export async function deleteContact(number: string): Promise<{ success: boolean }> {
  return request(`/api/contacts/${encodeURIComponent(number)}`, { method: "DELETE" });
}

export async function createContact(params: {
  phone: string;
  displayName?: string;
  simId?: string;
  linkedinUrl?: string;
  email?: string;
  projectSummary?: string;
}): Promise<{ success: boolean; created: boolean; conversationKey: string; contact: Record<string, unknown> }> {
  return request(`/api/contacts`, { method: "POST", body: params });
}

export async function listLabelCatalog(): Promise<LabelCatalogEntry[]> {
  return request<LabelCatalogEntry[]>(`/api/labels`);
}

/** Progression trame commerciale PVMD-EA (n/6). */
export async function getTram(number: string): Promise<TramPayload> {
  return request<TramPayload>(`/api/contacts/${encodeURIComponent(number)}/tram`);
}

export async function submitBotReport(
  number: string,
  params: { reason: BotReportReason; note?: string },
  simId?: string,
): Promise<{ success: boolean; reportId: string; status: string; message: string }> {
  const qs = simId ? `?sim=${encodeURIComponent(simId)}` : "";
  return request(`/api/contacts/${encodeURIComponent(number)}/bot-report${qs}`, {
    method: "POST",
    body: params,
  });
}

export async function getActiveBotReport(
  number: string,
): Promise<{ active: boolean; report?: BotReportSummary }> {
  return request(`/api/contacts/${encodeURIComponent(number)}/bot-report/active`);
}

export async function listRelaunchTemplates(): Promise<RelaunchTemplate[]> {
  const data = await request<{ ok: boolean; templates: RelaunchTemplate[] }>(
    `/api/relaunch/templates`,
  );
  return data.templates;
}

export async function addRelaunchTemplate(text: string): Promise<RelaunchTemplate> {
  const data = await request<{ ok: boolean; template: RelaunchTemplate }>(
    `/api/relaunch/templates`,
    { method: "POST", body: { text } },
  );
  return data.template;
}

export async function deleteRelaunchTemplate(id: string): Promise<void> {
  await request(`/api/relaunch/templates/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function proofreadText(text: string): Promise<{ text: string; changed: boolean }> {
  return request(`/api/compose/proofread`, { method: "POST", body: { text }, timeoutMs: 20000 });
}

export async function listSimDrafts(simId: string): Promise<{ simId: string; count: number; drafts: SimDraft[] }> {
  return request(`/api/sims/${encodeURIComponent(simId)}/drafts`);
}

export async function resendDraft(
  simId: string,
  index: string,
): Promise<{ ok: boolean; sent: boolean }> {
  return request(`/api/sims/${encodeURIComponent(simId)}/drafts/${encodeURIComponent(index)}/resend`, {
    method: "POST",
    timeoutMs: 30000,
  });
}

export async function deleteDraft(simId: string, index: string): Promise<{ ok: boolean }> {
  return request(`/api/sims/${encodeURIComponent(simId)}/drafts/${encodeURIComponent(index)}`, {
    method: "DELETE",
  });
}

export async function getSimLimits(simId: string): Promise<SimLimits> {
  return request(`/api/sims/${encodeURIComponent(simId)}/limits`);
}

/**
 * Enregistre ce device pour les notifications push (Expo Push token) côté
 * serveur — `deviceId` = le token lui-même (stable par install, pas de
 * stockage persistant côté app pour l'instant). Best-effort, ne throw pas.
 */
export async function registerPushDevice(params: {
  userId: string;
  token: string;
  platform: string;
}): Promise<void> {
  await request(`/api/mobile/device`, {
    method: "POST",
    body: { userId: params.userId, deviceId: params.token, platform: params.platform, pushToken: params.token },
  });
}
