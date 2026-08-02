# DB — OAuth Gmail & CV

Bases : SQLite `USERS_DB` (`coralt_web/db.py`, `bootstrap.py`).  
Lecture seule documentaire — ne pas migrer depuis le port iOS.

## Table `clientoauth`

Créée / migrée dans `coralt_web/bootstrap.py` (`continue_oauth_migration`).  
Peut être alimentée depuis l’ancien `alternance_API/email_sender/clients.db`.

| Colonne | Type | Rôle |
|---------|------|------|
| `owner_email` | VARCHAR PK | E-mail compte COR·ALT (pas forcément = adresse Gmail OAuth) |
| `token` | VARCHAR | Access token |
| `refresh_token` | VARCHAR | Refresh |
| `token_uri` | VARCHAR | Ex. `https://oauth2.googleapis.com/token` |
| `client_id` | VARCHAR | Client OAuth web |
| `client_secret` | VARCHAR | Secret serveur |
| `scopes_json` | VARCHAR | JSON array des scopes accordés |

### Usage

- Présence row → `gmail_connected: true`
- `gmail.modify` dans `scopes_json` → `gmail_labels_ready: true`
- Delete : `POST /api/auth/disconnect-gmail`
- Fallback Sheets user : `gsheet_reader._oauth_credentials` si scopes Sheets

**iOS** : jamais lire/écrire cette table côté client ; uniquement via API.

---

## Table `users` — colonnes CV / profil / skills

Schéma de base + `ALTER` dynamiques (`init_db`).

### CV

| Colonne | Défaut | Rôle |
|---------|--------|------|
| `cv_path` | `''` | Nom fichier relatif sous `uploads/cvs/` |
| `cv_json` | `''` | JSON texte extrait LLM |
| `cv_analysis_status` | `''` | `pending` / `running` / `done` / `error` / vide |
| `cv_analysis_error` | `''` | Message court (≤ 500) |

Fichier réel : `{DATA_DIR}/uploads/cvs/{cv_path}`.

### Compétences / mailing liés

| Colonne | Rôle |
|---------|------|
| `competence_highlight` | Phrase / liste skills pour mails |
| `search_profile_json` | Profil recherche ; `onboarding.skills_list` (tags) |
| `mail_use_ai` | Mode rédaction IA |
| `selected_prompt_id` | Trame générée post-CV |
| `selected_template_id` | Modèle fixe |
| `gsheet_url` | URL Sheet prospects (compte entreprise) |

### Identité (Paramètres)

| Colonne | Notes |
|---------|-------|
| `name` | UNIQUE |
| `email` | UNIQUE — non modifiable via update |
| `phone` | |
| `password_hash` | werkzeug |
| `plan` | 1 / 2 / 3 |
| `account_activated` | gate reçu / activation |

---

## Fichiers secrets (hors SQLite)

| Chemin | Contenu |
|--------|---------|
| `secrets/google-company-oauth.json` | Refresh token Sheets entreprise |
| `secrets/google-company-oauth-pending.json` | State OAuth en cours (éphémère) |
| `secrets/google-service-account.json` | Fallback SA Sheets |

Non accessibles depuis l’app iOS.

---

## Implications port iOS

| Donnée | Stockage device |
|--------|-----------------|
| Session / Bearer | **SecureStore** |
| Tokens Google | **aucun** (serveur) |
| `cv_json` résumé | cache UI optionnel (AsyncStorage), rechargé via `me` / status |
| PDF | document picker local temporaire → upload ; aperçu via API auth |
| Skills list | dans `user` / profil API, pas table dédiée |
