# Feature — Gmail OAuth

Sources : `frontend/src/api/gmail.js`, `GmailConnect.jsx`, `coralt_web/routes/auth.py`, `alternance_API/email_sender/api.py`, `coralt_oauth_state.py`

## Objectif

Relier le compte Google de l’utilisateur pour envoyer les candidatures via Gmail (scopes send + modify pour étiquette « alternance »). Tokens stockés côté serveur dans `clientoauth`, **pas** dans le client.

## Flux web actuel

```
App (session cookie)
  → GET /api/auth/gmail?return_to=<path|url>
  → Flask signe oauth_state (email + return_to)
  → Relais GET http://127.0.0.1:8020/auth/login?oauth_state=…
  → Redirect Google consent
  → Callback /auth/callback (Flask proxy → :8020)
  → email_sender échange code → tokens → INSERT/UPDATE clientoauth
  → Redirect frontend avec ?gmail=connected
```

### Front

- `connectGmail(returnTo)` : `window.location.href = /api/auth/gmail?return_to=…`
- Pendant onboarding (`/recherche`, `/console`) : marque pending via `onboardingResumeBridge`
- `disconnectGmail(email)` : `POST /api/auth/disconnect-gmail` `{ email }`
- Statut : `user.gmail_connected` + `user.gmail_labels_ready` (via `serialize_user` / `me`)

### Back Flask

| Route | Rôle |
|-------|------|
| `GET /api/auth/gmail` | Session requise ; signe state ; redirect Google via :8020 |
| `GET /auth/login` | Proxy legacy (même logique) |
| `GET /auth/callback` | Proxy vers :8020 ; refuse si session ≠ owner dans state |
| `POST /api/auth/disconnect-gmail` | `DELETE FROM clientoauth WHERE owner_email = ?` |

État signé (`coralt_oauth_state`) : salt `coralt-gmail-oauth-v1`, TTL 900 s, payload `{ email, return_to }`.

`return_to` sanitisé : chemins relatifs ou URL dont le host est dans `allowed_redirect_netlocs()` (localhost + `FRONTEND_URL` / `CORALT_BASE_URL`). Schemes `http`/`https` seulement aujourd’hui.

## Scopes Google (email_sender)

```
gmail.send
gmail.modify          ← requis pour étiquette « alternance »
spreadsheets.readonly
openid
userinfo.email
userinfo.profile
```

`gmail_labels_ready` = `gmail.modify` présent dans `clientoauth.scopes_json`. Sinon UI : « Reconnectez Google… ».

## Port iOS (AuthSession)

Remplacer `window.location` par **AuthSession** / `WebBrowser.openAuthSessionAsync`.

### Scheme

Proposer `coralt://` (doc Expo) ou `coraia://` — à enregistrer dans `app.json` / Info.plist et **whitelister côté serveur** dans `sanitize_return_to` / `allowed_redirect_netlocs` (aujourd’hui schemes http(s) only → **extension backend requise** pour deep link natif).

Pattern recommandé :

1. Construire `return_to = "coralt://oauth/gmail"` (ou `coraia://…`)
2. Ouvrir `https://dev.cal.coraia.eu/api/auth/gmail?return_to=…` dans AuthSession (session cookie / Bearer déjà établie — le start OAuth exige session)
3. À la fin, Google → callback serveur → redirect vers `return_to?gmail=connected`
4. AuthSession capture l’URL ; app appelle `POST /api/auth/me` pour rafraîchir `gmail_connected`

### SecureStore

- Stocker le **token session app** (Bearer / cookie) dans SecureStore
- **Ne pas** stocker les tokens Google côté device : ils restent en `clientoauth` serveur

### Points d’attention

- L’utilisateur doit être authentifié avant de lancer OAuth (sinon 401)
- Cookie de session web ≠ WebView iOS : privilégier Bearer + cookie header, ou WebView authentifiée
- Après disconnect : patch local `{ gmail_connected: false, gmail_labels_ready: false }`

## UI GmailConnect (à reproduire)

- Idle : bouton « Se connecter avec Google »
- Connected : e-mail + Vérifier + Déconnecter ; warning si `!gmail_labels_ready`
