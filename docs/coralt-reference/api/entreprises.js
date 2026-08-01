import { apiFetch } from "./http";
import { normalizePhoneForStorage } from "../utils/phone";

/** Ajoute ou met à jour une entreprise (clé compte + dénomination). */
export async function createEntreprise({
  userEmail,
  entreprise,
  email = "",
  contact = "",
  ville = "",
  numero = "",
  site = "",
  status,
}) {
  const companyEmail = (email || "").trim();
  const phone = normalizePhoneForStorage(numero) || "";
  const hasContactChannel = Boolean(companyEmail && companyEmail.includes("@")) || Boolean(phone);
  const data = await apiFetch("/api/entreprises-db/rows", {
    method: "POST",
    body: JSON.stringify({
      user_email: userEmail,
      denomination: (entreprise || "").trim(),
      email_entreprise: companyEmail,
      contact: (contact || "").trim(),
      ville: (ville || "").trim(),
      numero: phone,
      site: (site || "").trim(),
      status: status ?? (hasContactChannel ? "OK" : ""),
    }),
  });
  return data.row;
}
