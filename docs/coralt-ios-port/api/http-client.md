# Client HTTP front

Source : `frontend/src/api/http.js`.

## Rôle

Couche unique pour les appels `/api/*` (proxy Vite → Flask en dev ; même origine en prod nginx).

## `apiFetch(path, options)`

| Comportement | Détail |
|--------------|--------|
| Credentials | `credentials: "include"` — cookie session `coralt_session` |
| Headers | `Content-Type: application/json` sauf `FormData` ; headers de trace (`traceHeaders`) ; fusion `options.headers` |
| Timeout | Optionnel `timeoutMs` → `AbortController` ; message FR + `ERROR_TYPE.API_TIMEOUT` |
| Parsing | `res.json()` ; corps non-JSON + `ok` → `{ status: "success" }` |
| Erreurs | Classe `ApiError(message, status, payload)` ; messages 502/503/504 contextualisés |
| Analytics | `reportApiError` / `trackFeature` (sauf sonde silencieuse `GET /api/auth/me` en 401) |
| Tracking succès | Non-GET ou chemins `/auth/` → `trackFeature(..., "request")` |

## Auth web actuelle

- Login → session Flask cookie HttpOnly (`SESSION_COOKIE_NAME=coralt_session`, SameSite=Lax, Secure en prod).
- Pas de header Bearer sur les routes app utilisateur.

## Auth déjà Bearer / clé API (serveur)

Sur `/api/entreprises-db/*` : `X-API-Key` **ou** `Authorization: Bearer <clé>` + paramètre `email` / `user_email` (`coralt_auth.require_entreprises_db_account_email`). Variable : `ENTREPRISES_DB_API_KEY`.

## Cible port iOS (Coraia Glass)

1. Remplacer `credentials: "include"` par stockage sécurisé du token.
2. Envoyer `Authorization: Bearer <access_token>` sur chaque `apiFetch` (ou équivalent natif).
3. Conserver paths relatifs `/api/...` derrière la même base URL (`CORALT_BASE_URL` / cal.coraia.eu).
4. Mapper `ApiError.status` pour UX (401 → re-login, 403 → plan/gate, 504 → retry recherche).
5. Timeouts : aligner sur analyses longues (nginx `proxy_read_timeout 300s` ; front peut passer `timeoutMs`).

## Notes

- Ne pas logger secrets / tokens dans PostHog.
- Probe `/api/auth/me` : rester silencieux sur 401 pour le boot session.
