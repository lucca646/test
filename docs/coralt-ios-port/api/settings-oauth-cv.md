# API — Paramètres, OAuth, CV

Référence des endpoints pour le port iOS (session / Bearer requis sauf mention).

## Auth profil

### `POST /api/auth/me`

Rafraîchit le profil depuis la session.

- Body : `{}`
- Succès : `{ status: "success", user, app }`
- Sync `competence_highlight` depuis `search_profile_json` avant sérialisation
- `gmail_connected` = présence row `clientoauth`

### `POST /api/auth/update`

Met à jour nom, téléphone, mot de passe, compétences.

Body (champs optionnels sauf contrainte métier) :

| Champ | Type | Notes |
|-------|------|-------|
| `email` | string | ignoré pour l’identité (session) |
| `name` | string | requis si présent, non vide |
| `phone` | string | requis si présent, non vide |
| `password` | string | min 6 ; exige `current_password` |
| `current_password` | string | vérifié via `check_password_hash` |
| `competence_highlight` | string | texte libre |
| `skills_list` | `string[]` | merge profil + reformulation IA |

Réponse : `{ status: "success", user }`  
Erreurs : 400 (rien / validation), 401 (mdp actuel), 404, 409 (nom unique).

Client web : `apiUpdateProfile` (`frontend/src/api/auth.js`).

### `POST /api/auth/request-plan`

Hors settings stricts mais lié activation : `{ plan: 1|2|3 }` → notif + éventuel update plan.

---

## Gmail OAuth

### `GET /api/auth/gmail?return_to=`

- Auth session obligatoire
- Redirect 302 vers Google (via email_sender :8020)
- iOS : ouvrir dans AuthSession avec `return_to` deep link whiteliste

### `GET /auth/login`, `GET /auth/callback`

Proxies legacy / callback Flask → :8020.

### `POST /api/auth/disconnect-gmail`

```json
{ "email": "user@…" }
```

→ `{ status: "success", gmail_connected: false }`  
Identité = session (`require_user_email`), pas le body.

Client : `connectGmail`, `disconnectGmail`, `refreshGmailStatus` (`api/gmail.js`).

---

## Google Sheets (admin)

### `GET /api/setup/google-sheets/start`

- Admin only
- JSON ou redirect `?go=1`

### `GET /api/setup/google-sheets/callback`

- Échange code → fichier secrets
- HTML (pas JSON API mobile)

---

## Plan3 settings & CV

### `POST /api/plan3/settings`

Réglages mailing/recherche (pas le formulaire profil Paramètres) :

```json
{
  "send_mode": "manual|auto",
  "mail_test_mode": true,
  "search_domain": "",
  "search_naf_codes": [] | "…",
  "search_profile_json": {} | "…",
  "search_geo_zones": ""
}
```

→ `{ status, user }`

### `POST /api/plan3/mailing-compose`

`mail_use_ai`, `selected_template_id`, `selected_prompt_id`.

### CV

| Route | Méthode | Content-Type | Status typique |
|-------|---------|--------------|----------------|
| `/api/plan3/upload_cv` | POST | `multipart/form-data` (`cv`) | 202 |
| `/api/plan3/cv-analysis/status` | GET | — | 200 |
| `/api/plan3/analyze_cv` | POST | JSON `{ email }` | 202 |
| `/api/plan3/cv` | GET | — | PDF |
| `/api/plan3/delete_cv` | POST | JSON `{ email }` | 200 |

Client : `api/cv.js` — `uploadCv`, `watchCvAnalysis`, `analyzeCv`, `deleteCv`, `getCvViewUrl`.

---

## Objet `user` (extrait settings / OAuth / CV)

Champs utiles iOS (via `serialize_user`) :

```
id, name, email, phone, plan
cv_path, cv_json, competence_highlight
gmail_connected, gmail_labels_ready
account_activated, is_admin
search_profile_json, mail_use_ai, selected_prompt_id, …
```

## Auth mobile

Web : cookie `coralt_session` + cache `localStorage` `coralt_session_v2`.  
iOS : **SecureStore** pour token ; header `Authorization: Bearer` (extension backend) ou `Cookie` interim. Tous les endpoints ci-dessus exigent déjà une session serveur.
