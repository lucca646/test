/**
 * Client HTTP — même base relative /api que la V1 (proxy Vite → Flask).
 */
import { traceHeaders } from "../utils/logger";
import { featureFromApiPath } from "../analytics/features";
import { trackFeature } from "../analytics/track";
import {
  reportApiError,
  ERROR_TYPE,
} from "../analytics/posthogClient";

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch(path, options = {}) {
  const { timeoutMs, ...fetchOptions } = options;
  const controller = timeoutMs ? new AbortController() : null;
  const timer =
    controller &&
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  const method = (fetchOptions.method || "GET").toUpperCase();
  const apiCtx = { api_path: path, http_method: method };

  let res;
  try {
    res = await fetch(path, {
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...traceHeaders(),
        ...fetchOptions.headers,
      },
      ...fetchOptions,
      signal: controller?.signal,
    });
  } catch (err) {
    if (timer) clearTimeout(timer);
    if (err?.name === "AbortError") {
      const timeoutErr = new Error(
        `Délai dépassé (${Math.round(timeoutMs / 1000)} s). Réessayez dans un instant.`,
      );
      reportApiError(timeoutErr, {
        ...apiCtx,
        error_type: ERROR_TYPE.API_TIMEOUT,
        aborted: true,
      });
      throw timeoutErr;
    }
    reportApiError(err, { ...apiCtx, error_type: ERROR_TYPE.API_NETWORK });
    throw err;
  }
  if (timer) clearTimeout(timer);

  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    if (!res.ok) {
      const parseError = new Error(`Erreur serveur (${res.status})`);
      reportApiError(parseError, {
        ...apiCtx,
        http_status: res.status,
        error_type: ERROR_TYPE.API_PARSE,
      });
      throw parseError;
    }
    return { status: "success" };
  }

  if (!res.ok) {
    const fallback =
      res.status === 504
        ? "L'analyse prend trop de temps (timeout serveur). Réessayez — le délai proxy a été augmenté."
        : res.status === 502 || res.status === 503
          ? "L'analyse a été interrompue (délai dépassé). Réessayez dans un instant."
          : `Erreur serveur (${res.status})`;
    const silentAuthProbe = path.startsWith("/api/auth/me") && res.status === 401;
    if (!silentAuthProbe) {
      const apiFeature = featureFromApiPath(path);
      trackFeature(apiFeature, "request_error", {
        api_path: path,
        http_status: res.status,
        error_message: data?.message || fallback,
      });
    }
    const apiErr = new ApiError(data?.message || fallback, res.status, data);
    reportApiError(apiErr, { ...apiCtx, http_status: res.status });
    throw apiErr;
  }

  if (method !== "GET" || path.includes("/auth/")) {
    trackFeature(featureFromApiPath(path), "request", {
      api_path: path,
      http_method: method,
      http_status: res.status,
    });
  }

  return data;
}
