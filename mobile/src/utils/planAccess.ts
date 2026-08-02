export const PLAN_MAILING_MIN = 3;
export const PLAN_ENVOIS_MIN = 3;

export type CoraltUser = {
  plan?: number | string;
  is_admin?: boolean;
  account_activated?: boolean | number | string;
  email?: string;
  name?: string;
  phone?: string;
  gmail_connected?: boolean;
  [key: string]: unknown;
};

export function userPlan(user: CoraltUser | null | undefined) {
  return Number(user?.plan) || 1;
}

export function hasMailingAccess(user: CoraltUser | null | undefined) {
  return userPlan(user) >= PLAN_MAILING_MIN;
}

export function hasEnvoisAccess(user: CoraltUser | null | undefined) {
  return userPlan(user) >= PLAN_ENVOIS_MIN;
}

/** Plan 1 : pas de barre d’onglets filtres (vue « Tout » seule). */
export function entreprisesHideFilterTabs(user: CoraltUser | null | undefined) {
  return userPlan(user) <= 1;
}

/** Onglet « Envoyé » à partir du plan 2. */
export function entreprisesHideSentTab(user: CoraltUser | null | undefined) {
  return userPlan(user) < 2;
}

/** Toggle manuel À contacter ↔ Envoyé (plan 2 seulement). */
export function entreprisesCanToggleContactStatus(
  user: CoraltUser | null | undefined,
) {
  return userPlan(user) === 2;
}

/** Contacts enrichis (email / tél) visibles plan ≥ 2. */
export function entreprisesShowContacts(user: CoraltUser | null | undefined) {
  return userPlan(user) >= 2;
}

/** Mail généré / envoyer depuis la fiche — plan ≥ 3. */
export function entreprisesShowMailActions(user: CoraltUser | null | undefined) {
  return hasMailingAccess(user);
}
