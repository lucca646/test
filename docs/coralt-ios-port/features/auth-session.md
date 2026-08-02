# Feature : Auth & Session

Session COR·ALT côté web = **cookie Flask signé**, pas de table `sessions` SQL. Le client cache un profil dans `localStorage`.

## Modèle de session (serveur)

| Élément | Valeur |
|---------|--------|
| Cookie | `coralt_session` |
| Contenu | `session["user_email"]` (e-mail lower) |
| HttpOnly | `true` |
| SameSite | `Lax` |
| Secure | `true` en production |
| Path | `/` |
| Durée | 14 jours (`PERMANENT_SESSION_LIFETIME`) |
| Secret | `FLASK_SECRET_KEY` |
| Module | `coralt_auth.py` → `init_auth`, `set_session_user`, `clear_session_user` |

### Hook global API

`register_auth_hooks` : toute route `/api/*` exige une session **sauf** :

| Méthode | Path |
|---------|------|
| GET | `/api/config` |
| POST | `/api/auth/login` |
| POST | `/api/auth/register` |
| POST | `/api/auth/me` |
| POST | `/api/auth/logout` |
| POST | `/api/stripe/webhook` |

Sinon → `401` `{ status: "error", message: "Session expirée. Reconnectez-vous." }`.

Exception : `/api/entreprises-db*` — clé API `X-API-Key` / Bearer + email (hors périmètre iOS user classique).

## Client HTTP

`apiFetch` (`frontend/src/api/http.js`) :

- `credentials: "include"` (envoie le cookie)
- `Content-Type: application/json` (sauf FormData)
- Headers de trace analytics
- `ApiError` avec `status` + `payload`

## AuthContext

Fichier : `frontend/src/context/AuthContext.jsx`.

### Boot

1. Lit `coralt_session_v2` → user temporaire avec `account_activated: false`.
2. `POST /api/auth/me` → user réel ou `null`.
3. `authReady = true` (sinon render `null` — splash iOS recommandé).
4. `GET /api/config` → `coralt_app_config_v1`.

### Méthodes

| Méthode | Comportement |
|---------|--------------|
| `login(email, password)` | `apiLogin` → set user + identify PostHog |
| `register({ name, email, password, phone, invite_code })` | téléphone obligatoire |
| `logout()` | `apiLogout` + clear user (local même si réseau KO) |
| `refreshUser()` | `/me` ; clear si échec |
| `updateUser(patch)` | merge local (plan, activation, gsheet…) |

### Polling

- Config / timeslot : 15 s si connecté
- Profil / activation : 60 s + event `focus`

### Normalisation user

- `plan` ≥ 1 (défaut 1)
- `account_activated` = admin **ou** bool DB
- bools mail / timeslot coercés

## Rate limiting login / register

- Fenêtre 300 s, max 10 échecs / IP (`check_login_rate_limit` / `record_login_failure`)
- Réponse `429` : « Trop de tentatives… »

## Inscription — règles métier

| Règle | Source |
|-------|--------|
| Ouverture | `REGISTRATION_ENABLED` (prod fermé par défaut ; dev ouvert) |
| Code requis | `REGISTRATION_SIGNUP_CODE_REQUIRED=1` |
| Code legacy env | `REGISTRATION_INVITE_CODE` → plan 1 |
| Codes DB | table `signup_codes` (plan 1–3, usage unique) |
| Sans code (si non requis) | plan par défaut **2** |
| Mot de passe | ≥ 10 car., 1 lettre, 1 chiffre |
| Compte créé | `account_activated = 0` |
| Session | `set_session_user` immédiat après register/login |

## Admin

- E-mail = `ADMIN_EMAIL` (env)
- `is_admin` dans `serialize_user` ; activation forcée côté client

## Port iOS — Bearer vs cookie

| Approche | Recommandation |
|----------|----------------|
| **Court terme** | Cookie jar natif (WKWebView / cookie storage) + mêmes endpoints ; `credentials` équivalent |
| **Moyen terme** | Étendre l’API avec token Bearer (JWT / opaque) renvoyé au login/register ; header `Authorization: Bearer …` ; SecureStore pour le token |
| **À ne pas faire** | Envoyer `email` / `admin_email` dans le body pour s’authentifier — le serveur **ignore** ces champs pour la session utilisateur |

Deep links utiles :

- Retour auth app : `coralt://auth/callback` (si OAuth Gmail plus tard)
- Session expirée → écran login + clear SecureStore

Équivalents stockage :

| Web | iOS |
|-----|-----|
| Cookie `coralt_session` | Cookie jar **ou** Bearer SecureStore |
| `coralt_session_v2` | Cache profil (non secret) |
| `coralt_app_config_v1` | Cache config |

## Objet `user` (API)

Champs utiles au port auth/activation (liste complète dans `serialize_user`) :

- `id`, `name`, `email`, `phone`, `plan`
- `account_activated`, `is_admin`
- `gmail_connected`, `gmail_labels_ready`
- profil recherche / CV / mail (hors scope minimal auth)

Réponses login/register/me incluent souvent `app: { instance, instance_label }`.
