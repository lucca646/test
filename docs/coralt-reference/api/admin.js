import { apiFetch } from "./http";

export async function fetchAdminUsers(adminEmail) {
  return apiFetch(`/api/admin/users?admin_email=${encodeURIComponent(adminEmail)}`);
}

export async function fetchAdminTable(tableName, adminEmail) {
  const data = await apiFetch(
    `/api/admin/table/${tableName}?admin_email=${encodeURIComponent(adminEmail)}`
  );
  return data.data || [];
}

export async function updateUserSearchEnabled(adminEmail, userId, searchEnabled) {
  return apiFetch(`/api/admin/users/${userId}/search-enabled`, {
    method: "PATCH",
    body: JSON.stringify({
      admin_email: adminEmail,
      search_enabled: searchEnabled,
    }),
  });
}

export async function updateUserEnrichmentEnabled(adminEmail, userId, enrichmentEnabled) {
  return apiFetch(`/api/admin/users/${userId}/enrichment-enabled`, {
    method: "PATCH",
    body: JSON.stringify({
      admin_email: adminEmail,
      enrichment_enabled: enrichmentEnabled,
    }),
  });
}

export async function updateAdminUser(adminEmail, userId, updates) {
  return apiFetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ admin_email: adminEmail, updates }),
  });
}

export async function deleteAdminUser(adminEmail, userId) {
  return apiFetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    body: JSON.stringify({ admin_email: adminEmail }),
  });
}

export async function fetchEnrichmentSettings(adminEmail) {
  return apiFetch(
    `/api/admin/enrichment-settings?admin_email=${encodeURIComponent(adminEmail)}`,
  );
}

export async function saveEnrichmentSettings(adminEmail, settings) {
  return apiFetch("/api/admin/enrichment-settings", {
    method: "PATCH",
    body: JSON.stringify({ admin_email: adminEmail, settings }),
  });
}

export async function fetchGlobalSendTimeslot(adminEmail) {
  return apiFetch(
    `/api/admin/send-timeslot?admin_email=${encodeURIComponent(adminEmail)}`,
  );
}

export async function saveGlobalSendTimeslot(adminEmail, { sendTimeslot, sendTimeslotEnabled } = {}) {
  const body = { admin_email: adminEmail };
  if (sendTimeslot !== undefined) body.send_timeslot = sendTimeslot;
  if (sendTimeslotEnabled !== undefined) body.send_timeslot_enabled = sendTimeslotEnabled;
  return apiFetch("/api/admin/send-timeslot", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchAdminServices(adminEmail) {
  return apiFetch(
    `/api/admin/services?admin_email=${encodeURIComponent(adminEmail)}`,
  );
}

export async function restartAdminService(adminEmail, serviceId) {
  return apiFetch(`/api/admin/services/${encodeURIComponent(serviceId)}/restart`, {
    method: "POST",
    body: JSON.stringify({ admin_email: adminEmail }),
  });
}

export async function setAdminServicePower(adminEmail, serviceId, enabled) {
  return apiFetch(`/api/admin/services/${encodeURIComponent(serviceId)}/power`, {
    method: "POST",
    body: JSON.stringify({ admin_email: adminEmail, enabled }),
  });
}

export async function fetchAdminSignupCodes(adminEmail) {
  const data = await apiFetch(
    `/api/admin/signup-codes?admin_email=${encodeURIComponent(adminEmail)}`,
  );
  return data.codes || [];
}

export async function createAdminSignupCode(adminEmail, plan) {
  const data = await apiFetch("/api/admin/signup-codes", {
    method: "POST",
    body: JSON.stringify({ admin_email: adminEmail, plan }),
  });
  return data.code;
}

export async function deleteAdminSignupCode(adminEmail, codeId) {
  return apiFetch(`/api/admin/signup-codes/${codeId}`, {
    method: "DELETE",
    body: JSON.stringify({ admin_email: adminEmail }),
  });
}
