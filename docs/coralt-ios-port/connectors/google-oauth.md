# Connecteur — Google OAuth (Gmail + Sheets)

Vue d’ensemble des deux flux OAuth Google dans COR·ALT, pour le port iOS.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ App iOS /   │     │ Flask coralt_web │     │ email_sender│
│ Web         │────▶│ :80/443          │────▶│ :8020       │
└─────────────┘     └────────┬─────────┘     └──────┬──────┘
                             │                      │
                             │ setup Sheets         │ Gmail tokens
                             ▼                      ▼
                    secrets/google-         table clientoauth
                    company-oauth.json      (users.db)
                             │
                             ▼
                      gsheet_reader.py
```

Credentials client OAuth web partagés : `alternance_API/email_sender/credentials.json` (ou env `GOOGLE_OAUTH_CREDENTIALS_JSON` / `_FILE`).

## Flux A — Gmail (utilisateur)

| Élément | Valeur |
|---------|--------|
| Entrée app | `GET /api/auth/gmail?return_to=` |
| État | Signé `coralt_oauth_state` (email + return_to, 15 min) |
| Consent | Google → scopes gmail.send, gmail.modify, sheets.readonly, openid, userinfo |
| Callback | `/auth/callback` (Flask → :8020) |
| Persist | `clientoauth` PK `owner_email` |
| Retour UI | `?gmail=connected` sur `return_to` sanitisé |
| Déco | `POST /api/auth/disconnect-gmail` |

Doc détaillée : [`../features/gmail-oauth.md`](../features/gmail-oauth.md)

### iOS

- `AuthSession` / `WebBrowser.openAuthSessionAsync`
- Scheme : `coralt://` ou `coraia://` (enregistrer + **étendre** `sanitize_return_to` pour accepter ces schemes)
- Exemple redirect : `coralt://oauth/gmail?gmail=connected`
- SecureStore : token app uniquement
- Après retour : `POST /api/auth/me`

## Flux B — Sheets (admin entreprise)

| Élément | Valeur |
|---------|--------|
| Entrée | `GET /api/setup/google-sheets/start` |
| Auth | `require_admin_user` |
| État | Fichier pending + `secrets.token_urlsafe`, TTL 10 min |
| Scopes | `spreadsheets` + openid + email |
| Callback | `/api/setup/google-sheets/callback` |
| Persist | `secrets/google-company-oauth.json` |
| Consommation | `gsheet_reader` (priorité company → SA → user oauth) |

Doc : [`../features/google-sheets-oauth.md`](../features/google-sheets-oauth.md)

### iOS

- Pas dans le parcours utilisateur Paramètres
- Admin : rester web ou AuthSession dédié plus tard

## Sécurité commune

- Pas de PKCE aujourd’hui (échange code manuel avec `client_secret` **serveur**)
- `client_secret` ne quitte jamais le serveur
- CSRF : state signé (Gmail) ou fichier pending (Sheets)
- Callback Gmail vérifie session == owner de l’état

## Checklist port iOS Gmail

1. [ ] Session app valide avant start OAuth  
2. [ ] Deep link scheme dans Expo config  
3. [ ] Backend accepte `return_to` scheme natif  
4. [ ] AuthSession capture URL de retour  
5. [ ] Refresh `me` → flags `gmail_connected` / `gmail_labels_ready`  
6. [ ] Disconnect sans tokens Google locaux  
