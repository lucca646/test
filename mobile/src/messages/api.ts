import { MESSAGES_API_URL } from "../config";
import { getMessagesToken, setMessagesToken, clearMessagesSession } from "./session";

export class MessagesApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MessagesApiError";
    this.status = status;
  }
}

export type MessagesUser = {
  id: string;
  name?: string;
  role?: string;
};

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

type FetchOpts = {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
  auth?: boolean;
};

async function request<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { method = "GET", body, timeoutMs = 15000, auth = true } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getMessagesToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

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

export async function messagesLogin(
  login: string,
  password: string,
): Promise<{ user: MessagesUser }> {
  const data = await request<{ ok: boolean; user: MessagesUser; token: string; error?: string }>(
    "/api/auth/login",
    { method: "POST", body: { login, password }, auth: false },
  );
  if (!data.ok) throw new MessagesApiError(data.error || "Connexion refusée", 401);
  setMessagesToken(data.token);
  return { user: data.user };
}

export async function messagesMe(): Promise<MessagesUser | null> {
  if (!getMessagesToken()) return null;
  try {
    const data = await request<{ ok: boolean; authenticated: boolean; user: MessagesUser }>(
      "/api/auth/me",
    );
    return data.authenticated ? data.user : null;
  } catch (err) {
    if (err instanceof MessagesApiError && err.status === 401) {
      clearMessagesSession();
    }
    return null;
  }
}

export async function messagesLogout(): Promise<void> {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } catch {
    /* best-effort */
  }
  clearMessagesSession();
}

export async function listConversations(simId?: string): Promise<ConversationSummary[]> {
  const qs = simId ? `?sim=${encodeURIComponent(simId)}` : "";
  return request<ConversationSummary[]>(`/api/conversations${qs}`, { auth: false });
}

export async function getConversation(
  key: string,
  simId?: string,
): Promise<ConversationDetail> {
  const qs = simId ? `?sim=${encodeURIComponent(simId)}` : "";
  return request<ConversationDetail>(
    `/api/conversations/${encodeURIComponent(key)}${qs}`,
    { auth: false },
  );
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
