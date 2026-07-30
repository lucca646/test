/** Fonctionnalités mailing (onglet Mailing, CV, Gmail, actions mail). */
export const PLAN_MAILING_MIN = 3;

/** Onglet Envois (swipe rapide) — plan 3 uniquement. */
export const PLAN_ENVOIS_MIN = 3;

export function userPlan(user) {
  return Number(user?.plan) || 1;
}

export function hasMailingAccess(user) {
  return userPlan(user) >= PLAN_MAILING_MIN;
}

export function hasEnvoisAccess(user) {
  return userPlan(user) >= PLAN_ENVOIS_MIN;
}

/** CV + connexion Google (Paramètres, onboarding recherche). */
export function hasCvGmailSetup(user) {
  return hasMailingAccess(user);
}

/** Plan 1 : liste unique sans barre d'onglets (équivalent « Tout »). */
export function entreprisesHideFilterTabs(user) {
  return userPlan(user) <= 1;
}

/** Plan 1 uniquement : pas d'onglet « Envoyé ». Plan 2+ : suivi manuel ou mailing. */
export function entreprisesHideSentTab(user) {
  return userPlan(user) < 2;
}

/** Plan 2 : bascule manuelle À contacter ↔ Envoyé sur le badge statut. */
export function entreprisesCanToggleContactStatus(user) {
  return userPlan(user) === 2;
}

/** Objet / corps du message généré (plan 3 mailing) — pas le plan 2 manuel. */
export function entreprisesShowGeneratedMail(user) {
  return userPlan(user) >= PLAN_MAILING_MIN;
}

/** Onglet « À contacter » toujours visible (manuel et auto). */
export function entreprisesHideValidateTab() {
  return false;
}

/** Bouton « Vérifier » (rédaction / envoi mail) — plan 3 uniquement. */
export function entreprisesShowVerifyButton(user) {
  return hasMailingAccess(user);
}
