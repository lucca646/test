/** Plans proposés avant activation du compte. */
import { coerceBool } from "./bool";

export const BILLING_ONCE = "once";
export const BILLING_MONTHLY = "monthly";

export const ACTIVATION_PLANS = [
  {
    id: 1,
    title: "Essentiel",
    subtitle: "Trouvez les entreprises qui vous correspondent",
    priceEur: 60,
    priceEurMonthly: 20,
  },
  {
    id: 2,
    title: "Avancé",
    subtitle: "Récupérez leurs coordonnées",
    priceEur: 80,
    priceEurMonthly: 35,
  },
  {
    id: 3,
    title: "Complet",
    subtitle: "Candidatez en quelques gestes",
    priceEur: 90,
    priceEurMonthly: 40,
    highlight: true,
  },
];

/** Toutes les fonctionnalités — minPlan = premier plan qui l'inclut. */
export const PLAN_COMPARISON_ROWS = [
  {
    id: "search",
    label: "Recherche par secteur d'activité et zone géographique",
    minPlan: 1,
  },
  {
    id: "list",
    label: "Liste des entreprises qui correspondent à votre ciblage",
    minPlan: 1,
  },
  {
    id: "address",
    label: "Nom et adresse de chaque entreprise",
    minPlan: 1,
  },
  {
    id: "contact",
    label: "E-mail et numéro de téléphone de chaque entreprise",
    minPlan: 2,
  },
  {
    id: "company",
    label: "Informations sur l'entreprise (activité, taille, site web…)",
    minPlan: 2,
  },
  {
    id: "mail",
    label: "E-mail de candidature rédigé automatiquement à partir de votre CV et de chaque fiche",
    minPlan: 3,
  },
  {
    id: "swipe",
    label: "Envoyez votre candidature en un swipe",
    minPlan: 3,
  },
];

export function normalizeBillingInterval(value) {
  return value === BILLING_MONTHLY ? BILLING_MONTHLY : BILLING_ONCE;
}

export function getPlanPriceEur(plan, billing = BILLING_ONCE) {
  if (!plan) return 0;
  return normalizeBillingInterval(billing) === BILLING_MONTHLY
    ? plan.priceEurMonthly
    : plan.priceEur;
}

export function formatPlanPrice(priceEur) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(priceEur);
}

export function formatPlanPriceNote(billing = BILLING_ONCE) {
  return normalizeBillingInterval(billing) === BILLING_MONTHLY
    ? "/ mois"
    : "paiement unique";
}

export function getPlanById(planId) {
  return ACTIVATION_PLANS.find((p) => p.id === planId) ?? null;
}

export function isPlanFeatureIncluded(planId, row) {
  return planId >= row.minPlan;
}

export function isAccountActivated(user) {
  if (!user) return false;
  if (user.is_admin) return true;
  return coerceBool(user.account_activated, false);
}
