/**
 * Session Messages (CRM SMS COR·ALT) — mémoire process, OTA-safe.
 *
 * Ce backend est distinct de l'API COR·ALT (cf. `src/api/session.ts`) :
 * Bearer token classique renvoyé par `/api/auth/login`, pas de cookie.
 */

let token: string | null = null;

export function getMessagesToken(): string | null {
  return token;
}

export function setMessagesToken(next: string | null): void {
  token = next;
}

export function clearMessagesSession(): void {
  token = null;
}
