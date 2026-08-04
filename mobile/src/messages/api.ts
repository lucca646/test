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
    rdvInPeriod: number;
    gagne: number;
    messagesPerContact: number | null;
  };
  costs: {
    total: number;
    avgPerPricedOutbound: number | null;
    costPerGagne: number | null;
  };
};

type FetchOpts = {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
};

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
  } catch (err) {
    clearTimeout(timer);
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
