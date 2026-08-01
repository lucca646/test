import { apiFetch } from "./http";

/** POST — Revolut (one-shot) ou Stripe (mensuel) selon le billing. */
export async function apiCreateCheckoutSession(plan, billing = "once") {
  const data = await apiFetch("/api/payments/create-checkout-session", {
    method: "POST",
    body: JSON.stringify({ plan, billing }),
  });
  if (data.status !== "success") {
    throw new Error(data.message || "Impossible de préparer le paiement.");
  }
  return data;
}

/** POST — après retour checkout (success_url). */
export async function apiVerifyCheckoutSession(sessionOrOrderId = "", hint = "") {
  const id = String(sessionOrOrderId || "").trim();
  const body = {};
  if (hint === "revolut" || (!hint && id && !id.startsWith("cs_"))) {
    if (id) body.order_id = id;
  } else if (id) {
    body.session_id = id;
  }
  // Si pas d'id : le serveur lit la dernière commande / session stockée
  const data = await apiFetch("/api/payments/verify-session", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (data.status !== "success") {
    throw new Error(data.message || "Impossible de vérifier le paiement.");
  }
  return data;
}

/** GET — reçu / facture du paiement d'activation. */
export async function apiGetPurchaseReceipt() {
  const data = await apiFetch("/api/payments/purchase-receipt");
  if (data.status !== "success") {
    throw new Error(data.message || "Impossible de récupérer votre facture.");
  }
  return data.receipt;
}
