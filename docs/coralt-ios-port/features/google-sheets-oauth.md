# Feature — Google Sheets OAuth (compte entreprise)

Sources : `coralt_web/routes/setup.py`, `gsheet_oauth_setup.py`, `gsheet_reader.py`

## Objectif

OAuth **one-shot admin** pour le compte Google **entreprise** (lecture/écriture Sheets des tableaux prospects). Distinct du Gmail utilisateur.

| | Gmail utilisateur | Sheets entreprise |
|--|-------------------|-------------------|
| Qui | chaque user | admin seulement |
| Callback | `/auth/callback` (via :8020) | `/api/setup/google-sheets/callback` |
| Stockage | table `clientoauth` | fichier `secrets/google-company-oauth.json` |
| Usage | envoi mails | lecture/écriture Sheets (`gsheet_reader`) |

## Flux

```
Admin authentifié
  → GET /api/setup/google-sheets/start[?go=1]
  → start_oauth_flow → auth Google (scopes spreadsheets + openid + email)
  → pending state dans secrets/google-company-oauth-pending.json (TTL 600 s)
  → GET /api/setup/google-sheets/callback?code&state
  → complete_oauth_flow → secrets/google-company-oauth.json
  → page HTML succès → lien /mailing
```

### Routes

| Route | Auth | Réponse |
|-------|------|---------|
| `GET /api/setup/google-sheets/start` | `require_admin_user` | JSON `{ auth_url, redirect_uri, open }` ou redirect si `go=1` |
| `GET /api/setup/google-sheets/callback` | admin session | HTML succès / erreur |

### Scopes

```
https://www.googleapis.com/auth/spreadsheets
openid
https://www.googleapis.com/auth/userinfo.email
```

`prompt=consent` + `access_type=offline` pour obtenir un `refresh_token`. Sans refresh_token → erreur explicite (révoquer sur myaccount.google.com).

### Credentials

- Client web : `alternance_API/email_sender/credentials.json` (section `web`)
- Redirect : env `GOOGLE_SHEETS_REDIRECT_URI` ou `{scheme}://{host}/api/setup/google-sheets/callback`
- Token fichier : `secrets/google-company-oauth.json` `{ refresh_token, token, account_email }`
- Alt : env `GOOGLE_COMPANY_REFRESH_TOKEN`

## Lecture Sheets (`gsheet_reader`)

Ordre de résolution credentials (`_resolve_sheets_credentials`) :

1. **Compte entreprise** OAuth (`google-company-oauth.json` / env) — recommandé
2. **Service account** `secrets/google-service-account.json`
3. **OAuth user** `clientoauth` si scopes Sheets présents

Chaque user a `users.gsheet_url` ; `extract_sheet_id` parse l’ID. Mapping colonnes via `COL_ALIASES` ; statut n8n via `STATUS_MAP`.

## Port iOS

- **Hors MVP utilisateur** : flux admin / ops, pas l’app grand public
- Si un jour un écran admin mobile : même AuthSession + scheme, `return_to` admin ; sinon rester web
- L’app iOS consomme les données prospects via API COR·ALT (entreprises / mailing), pas Google Sheets directement
- Ne jamais embarquer `client_secret` ni `google-company-oauth.json` dans le binaire

## Différence importante pour le port

Le bouton « Google » dans Paramètres = **Gmail** (`/api/auth/gmail`).  
Sheets OAuth = setup serveur admin (`/api/setup/google-sheets/…`). Ne pas confondre dans l’UI iOS.
