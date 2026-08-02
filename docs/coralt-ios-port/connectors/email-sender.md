# Connecteur — email_sender (Gmail)

Service : `alternance_API/email_sender/` (FastAPI + uvicorn)  
Déploiement : `deploy/email-sender.service` → `127.0.0.1:8020`  
Appelant : `mailing_send.py` (`EMAIL_SENDER_URL`, `EMAIL_SENDER_API_KEY`)

## Rôle

Micro-service d’**envoi Gmail** + **OAuth** tokens. L’app iOS / web **n’appelle jamais** `:8020` directement : tout passe par Flask `/api/plan3/sheet-prospects/send` (et auth Gmail via `/api/auth/gmail`).

## Ports & auth machine

| Élément | Valeur |
|---------|--------|
| Listen | `127.0.0.1:8020` (local only) |
| Header | `X-API-Key: <EMAIL_SENDER_API_KEY>` |
| DB tokens | table `clientoauth` dans `users.db` (SQLModel `ClientOAuth`) |

## Endpoints

### OAuth

| Route | Rôle |
|-------|------|
| `GET /auth/login?oauth_state=` | State signé Flask uniquement ; redirect Google |
| `GET /auth/callback` | Échange code → tokens → upsert `clientoauth` → redirect frontend |

Scopes : `gmail.send`, `gmail.modify`, `spreadsheets.readonly`, `openid`, `userinfo.email`, `userinfo.profile`.

### Envoi

`POST /send-email` (API key) — body Pydantic :

```json
{
  "owner_email": "user@…",
  "target_email": "dest@…",
  "subject": "…",
  "body": "…",
  "gmail_label": "alternance",
  "cv_attachment_base64": "…",
  "cv_attachment_filename": "CV NOM Prenom.pdf"
}
```

Comportement :

1. Charge credentials `clientoauth[owner_email]`
2. Refresh token si expiré
3. MIME multipart text/plain + PDF optionnel
4. `users.messages.send`
5. Crée/applique label Gmail (`gmail.modify` requis) — sinon 401 message reconnect

Réponse succès :

```json
{
  "success": true,
  "message_id": "…",
  "label_applied": "alternance",
  "cv_attached": true,
  "cv_filename": "…"
}
```

`mailing_send` **exige** `label_applied` si `GMAIL_SEND_LABEL` est défini (sinon HTTPError → 502 Flask).

## Chaîne d’appel complète (send)

```
iOS/Web
  → POST /api/plan3/sheet-prospects/send
  → mailing_send.send_prospect_mail
       · blacklist, prior sends, test mode, save mail DB
       · load_cv_pdf_attachment (users.cv_path)
       · POST http://127.0.0.1:8020/send-email
  → mark_prospect_sent_db (status=SENT)
```

Mode test (`apply_test_mode`) : cible `MAIL_TEST_EMAIL`, subject préfixé `[TEST · entreprise → orig]`, header dans le body.

## Worker auto

`mailing_worker` appelle la **même** `send_prospect_mail` (pas un autre connecteur). Pas d’endpoint iOS dédié — statut via `GET /api/plan3/mailing-status` + refresh prospects.

## Port iOS

- **Ne pas** exposer 8020 ni stocker `EMAIL_SENDER_API_KEY` dans l’app
- OAuth Gmail : AuthSession → `/api/auth/gmail` (voir `features/gmail-oauth.md`)
- Afficher erreurs métier remontées par Flask (Gmail non connecté, CV manquant, étiquette, service indisponible)
- Background send status = état des jobs `/send` + polling statut campagne
