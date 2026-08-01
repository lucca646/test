#!/usr/bin/env node
/**
 * Bridge session COR·ALT pour Expo Go.
 *
 * Problème : React Native ne peut pas lire ni renvoyer de façon fiable
 * les cookies HttpOnly (Set-Cookie invisible ; header Cookie souvent strippé).
 *
 * Ce bridge :
 * 1. Login/register → lit Set-Cookie serveur → renvoie session_cookie en JSON
 * 2. Proxy /bridge/proxy/* → injecte Cookie depuis X-Coralt-Session
 *
 * Port: CORALT_BRIDGE_PORT (défaut 8791)
 * API:  CORALT_API_URL (défaut https://cal.coraia.eu)
 */
import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.CORALT_BRIDGE_PORT || 8791);
const API = (process.env.CORALT_API_URL || "https://cal.coraia.eu").replace(
  /\/$/,
  "",
);

function extractSessionCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const raw = Array.isArray(setCookieHeader)
    ? setCookieHeader.join(",")
    : String(setCookieHeader);
  const m = raw.match(/coralt_session=[^;]+/i);
  return m ? m[0] : null;
}

function normalizeCookie(raw) {
  const v = String(raw || "").trim();
  if (!v) return "";
  return v.startsWith("coralt_session=") ? v : `coralt_session=${v}`;
}

async function forwardAuth(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie");

  const session_cookie = extractSessionCookie(setCookie);
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = { status: "error", message: `Réponse non-JSON (${res.status})` };
  }

  return {
    httpStatus: res.status,
    payload: {
      ...data,
      session_cookie: session_cookie || undefined,
      bridge: true,
    },
  };
}

async function proxyApi(req, pathWithQuery, cookieHeader) {
  const method = (req.method || "GET").toUpperCase();
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const rawBody = Buffer.concat(chunks);

  const headers = {
    Accept: req.headers.accept || "application/json",
  };
  const ct = req.headers["content-type"];
  if (ct) headers["Content-Type"] = ct;
  if (cookieHeader) headers.Cookie = cookieHeader;

  const init = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.body = rawBody.length ? rawBody : undefined;
  }

  const upstream = await fetch(`${API}${pathWithQuery}`, init);
  const buf = Buffer.from(await upstream.arrayBuffer());
  const setCookie =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : upstream.headers.get("set-cookie");
  const session_cookie = extractSessionCookie(setCookie);

  const outHeaders = {
    "Content-Type":
      upstream.headers.get("content-type") || "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Cookie, X-Coralt-Session",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  };
  if (session_cookie) {
    outHeaders["X-Coralt-Session"] = session_cookie;
  }

  return { status: upstream.status, headers: outHeaders, body: buf };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Cookie, X-Coralt-Session",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  });
  res.end(body);
}

function corsPreflight(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Cookie, X-Coralt-Session",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "86400",
  });
  res.end();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    corsPreflight(res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/bridge/health") {
    sendJson(res, 200, { ok: true, api: API });
    return;
  }

  try {
    if (req.method === "POST" && url.pathname === "/bridge/login") {
      const body = await readBody(req);
      const out = await forwardAuth("/api/auth/login", body);
      sendJson(res, out.httpStatus, out.payload);
      return;
    }
    if (req.method === "POST" && url.pathname === "/bridge/register") {
      const body = await readBody(req);
      const out = await forwardAuth("/api/auth/register", body);
      sendJson(res, out.httpStatus, out.payload);
      return;
    }

    // Proxy authentifié : /bridge/proxy/api/...
    if (url.pathname.startsWith("/bridge/proxy/")) {
      const apiPath = url.pathname.slice("/bridge/proxy".length); // /api/...
      const pathWithQuery = apiPath + url.search;
      const rawSession =
        req.headers["x-coralt-session"] ||
        req.headers.cookie ||
        "";
      const cookieHeader = normalizeCookie(rawSession);
      const out = await proxyApi(req, pathWithQuery, cookieHeader);
      res.writeHead(out.status, out.headers);
      res.end(out.body);
      return;
    }

    sendJson(res, 404, { status: "error", message: "Not found" });
  } catch (e) {
    sendJson(res, 500, {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[coralt-bridge] http://0.0.0.0:${PORT} → ${API}`);
});
