import { apiFetch } from "./http";

/** POST /api/stripe/create-checkout-session — redirection Stripe Checkout. */
export async function apiCreateCheckoutSession(plan, billing = "once") {
  const data = await apiFetch("/api/stripe/create-checkout-session", {
    method: "POST",
    body: JSON.stringify({ plan, billing }),
  });
  if (data.status !== "success") {
    throw new Error(data.message || "Impossible de préparer le paiement.");
  }
  return data;
}

/** POST /api/stripe/verify-session — après retour Stripe (success_url). */
export async function apiVerifyCheckoutSession(sessionId) {
  const data = await apiFetch("/api/stripe/verify-session", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (data.status !== "success") {
    throw new Error(data.message || "Impossible de vérifier le paiement.");
  }
  return data;
}

/** GET /api/stripe/purchase-receipt — reçu / facture du paiement d'activation. */
export async function apiGetPurchaseReceipt() {
  const data = await apiFetch("/api/stripe/purchase-receipt");
  if (data.status !== "success") {
    throw new Error(data.message || "Impossible de récupérer votre facture.");
  }
  return data.receipt;
}
