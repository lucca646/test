# API Auth & Stripe

Référence endpoints pour le port iOS. Base relative `/api` (même origine web ; en natif : URL absolue de l’instance).

Auth par défaut : cookie session `coralt_session` (sauf routes publiques listées).

---

## `GET /api/config`

| | |
|--|--|
| Auth | Public |
| Body / query | — |
| Réponse | Config publique (voir `public_app_config`) |

**Réponse (champs) :**

- `instance`, `instance_label`
- `registration_open` (bool)
- `registration_invite_required` / `registration_signup_code_required` (bool)
- `registration_legacy_invite_configured` (bool)
- `send_timeslot`, `send_timeslot_enabled`

**Tables :** lecture settings globaux (pas `users`).

**Erreurs :** aucune auth.

**Port iOS :** cache au boot ; pilote affichage code d’inscription.

---

## `POST /api/auth/register`

| | |
|--|--|
| Auth | Public |
| Body JSON | `name`, `email`, `password`, `phone`, `invite_code?` |
| Cookies out | Set-Cookie session |

**Prérequis :** inscriptions ouvertes ; password strength ; rate limit IP.

**Tables / colonnes :**

- `INSERT users` : `name`, `email`, `phone`, `password_hash`, `plan`, `account_activated=0`
- `signup_codes` : `used_at`, `used_by_user_id` si code DB
- éventuel template mail par défaut

**Réponse 200 :**

```json
{
  "status": "success",
  "user": { "...serialize_user" },
  "app": { "instance": "...", "instance_label": null },
  "default_template": {}
}
```

**Erreurs :**

| Status | Cas |
|--------|-----|
| 403 | Inscriptions fermées / code invalide ou requis |
| 400 | Champs manquants / MDP faible |
| 409 | Email ou name déjà pris |
| 429 | Rate limit |

---

## `POST /api/auth/login`

| | |
|--|--|
| Auth | Public |
| Body | `{ "login": "<email|name>", "password": "..." }` |

**Tables :** `SELECT users` ; check `clientoauth` pour `gmail_connected`.

**Réponse 200 :** `{ status, user, app }` + session cookie.

**Erreurs :** 400 champs ; 401 identifiants ; 429 rate limit.

---

## `POST /api/auth/logout`

| | |
|--|--|
| Auth | Public (session optionnelle) |
| Body | `{}` |
| Effet | `clear_session_user()` |

**Réponse :** `{ "status": "success" }`.

---

## `POST /api/auth/me`

| | |
|--|--|
| Auth | Public (sans session → `user: null`) |
| Body | `{}` |

**Tables :** `SELECT/UPDATE users` (sync competence) ; `clientoauth`.

**Réponse :**

- Avec session : `{ status: "success", user, app }`
- Sans session : `{ status: "success", user: null, app }`
- 404 si e-mail session orphelin

---

## `POST /api/auth/update`

| | |
|--|--|
| Auth | Session requise |
| Body | `email` (présent côté client mais **plan/email non modifiables**), `name?`, `phone?`, `password?` + `current_password?`, `competence_highlight?`, `skills_list?` |

**Tables :** `UPDATE users` (`name`, `phone`, `password_hash`, `competence_highlight`, `search_profile_json`).

**Erreurs :** 400 aucune modif / validation ; 401 MDP actuel ; 404 ; 409 name pris ; 500 skills.

**Prérequis plan :** aucun (profil).

---

## `POST /api/auth/request-plan`

| | |
|--|--|
| Auth | Session |
| Body | `{ "plan": 1\|2\|3 }` |

**Effet :**

- Non admin non activé : `UPDATE users.plan`
- Admin : pas de changement plan ; notification e-mail `[TEST]`
- Non admin déjà activé : 400

**Réponse :** `{ status, message, test, user }`.

**Erreurs :** 400 plan invalide / déjà activé ; 404 ; 500.

---

## `POST /api/auth/disconnect-gmail`

| | |
|--|--|
| Auth | Session |
| Tables | `DELETE FROM clientoauth WHERE owner_email = ?` |
| Réponse | `{ status, gmail_connected: false }` |

(Hors scope landing/activation strict, utile post-auth.)

---

## OAuth Gmail (référence, hors Stripe)

| Méthode | Path | Notes |
|---------|------|-------|
| GET | `/api/auth/gmail?return_to=` | Session requise → redirect Google |
| GET | `/auth/login`, `/auth/callback` | Proxies legacy → email_sender `:8020` |

Deep links iOS à prévoir si port Gmail.

---

## `POST /api/stripe/create-checkout-session`

| | |
|--|--|
| Auth | Session |
| Body | `{ "plan": 1\|2\|3, "billing": "once"\|"monthly" }` |
| Prérequis | Stripe enabled ; compte **non** activé |

**Tables :** `UPDATE users SET plan, stripe_checkout_session_id`.

**Réponse 200 :**

```json
{
  "status": "success",
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_..."
}
```

**Erreurs :** 503 Stripe off ; 401 ; 400 plan / déjà activé ; 404 ; 502 StripeError ; 500.

---

## `POST /api/stripe/verify-session`

| | |
|--|--|
| Auth | Session |
| Body | `{ "session_id": "cs_..." }` |

**Effet :** retrieve Stripe + `fulfill_checkout_session` si `paid` (active compte).

**Réponse :**

```json
{
  "status": "success",
  "payment_status": "paid",
  "fulfilled": true,
  "user": {}
}
```

**Erreurs :** 503 ; 401 ; 400 session manquante ; 403 session ≠ compte ; 404 ; 502 ; 500.

---

## `GET /api/stripe/purchase-receipt`

| | |
|--|--|
| Auth | Session |
| Query | — |

**Réponse :** `{ status, receipt }` ou `receipt: null` si pas de paiement.

Objet `receipt` : `plan`, `plan_title`, `billing`, `amount_cents`, `currency`, `paid_at`, `receipt_url`, `invoice_url`, `document_url`, `payment_status`, `stripe_mode`.

---

## `POST /api/stripe/webhook`

| | |
|--|--|
| Auth | Signature Stripe header `Stripe-Signature` (pas de session user) |
| Body | Payload brut Stripe |
| Effet | `checkout.session.completed` → fulfill |

**Réponse :** `{ "received": true }` ; 400 signature ; 503 secret manquant.

**Port iOS :** ne pas appeler depuis l’app.

---

## Headers / cookies récap

| Direction | Nom | Usage |
|-----------|-----|-------|
| Request | Cookie `coralt_session` | Auth API |
| Response | `Set-Cookie: coralt_session=…` | Login / register |
| Request | `Content-Type: application/json` | Bodies JSON |
| Request | `Stripe-Signature` | Webhook uniquement |
| Request | `X-API-Key` / Bearer | Uniquement entreprises-db (hors scope) |

---

## Matrice prérequis plan / activation

| Endpoint | Session | Compte non activé | Plan min |
|----------|---------|-------------------|----------|
| register / login / me / logout / config | — | — | — |
| update / request-plan | oui | request-plan : oui (sauf admin) | — |
| create-checkout | oui | **obligatoire** | — |
| verify-session | oui | (fulfill active) | — |
| purchase-receipt | oui | plutôt activé | — |
| webhook | signature | — | — |
