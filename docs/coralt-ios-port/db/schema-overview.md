# Schéma bases SQLite — vue d’ensemble

Chemins résolus via `coralt_paths.py` (`CORALT_DATA_DIR`, overrides `CORALT_*_DB`). Lecture seule sur l’instance prod.

## Fichiers

| Fichier | Variable / défaut | Rôle |
|---------|-------------------|------|
| `users.db` | `CORALT_USERS_DB` → `{DATA_DIR}/users.db` | Comptes, OAuth Gmail, files recherche, miroir Sheet, settings, codes |
| `entreprises.db` | `CORALT_ENTREPRISES_DB` | Prospects / fiches par `user_email` |
| `entreprises_globales.db` | `CORALT_GLOBAL_ENTREPRISES_DB` | Cache enrichi partagé (SIREN / dénomination+ville) |
| `coralt.db` | (legacy / placeholder) | **Vide (0 octet)** en prod et `data/` — ne pas s’y fier ; le vrai « coralt » applicatif est `users.db` via `coralt_web.db` |

Prod observée : bases à la racine projet (`/root/alternance/*.db`). Dev : souvent `data/dev/` via `.env.dev`.

## `users.db` — tables

| Table | Usage |
|-------|--------|
| `users` | Compte (plan, flags recherche/enrichissement/mailing, CV, Stripe, activation…) |
| `clientoauth` | Tokens OAuth Gmail/Sheets par `owner_email` |
| `email_templates` | Modèles sujet/corps par utilisateur |
| `email_prompts` | Trames IA mailing |
| `blacklisted_emails` | Liste noire d’adresses |
| `app_settings` | Clé/valeur (plages globales, délais workers…) |
| `enrichment_state` | État worker enrichissement par user |
| `search_campaigns` | Campagnes APE × zones |
| `search_queue_items` | Items file (FK campaign) |
| `search_request_cache` | Dédup requêtes webhook |
| `sheet_mirror_meta` / `sheet_prospect_rows` | Miroir Google Sheet |
| `signup_codes` | Codes invitation plan 1–3 |

Colonnes notables `users` : `plan`, `account_activated`, `search_enabled`, `enrichment_enabled`, `mail_sending_enabled`, `mail_test_mode`, `search_analysis_limit`, `gsheet_url`, `cv_json`, `send_mode`, `stripe_checkout_session_id`, …

Init / migrations colonnes : `coralt_web.db.init_db()` + modules `sheet_mirror_db`, `app_settings`, `search_queue`, bootstrap OAuth.

## `entreprises.db`

Une table `entreprises` :

- Clé logique : `UNIQUE (user_email, denomination)`
- Champs fiche : adresse, taille, secteur, site, email, message, numéro, status, SIREN, `mail_subject`, `contact`, `repondu`, `note_perso`, timestamps
- Index : `user_email`, `(user_email, status)`

API machine : blueprint `entreprises_db_bp` (`/api/entreprises-db/*`) + clé `ENTREPRISES_DB_API_KEY`.

## `entreprises_globales.db`

Table `entreprises_globales` :

- Dédup : index unique `(key_denomination, key_ville)` ; index SIREN si non vide
- Champs enrichis partagés + `hit_count`, `source_user_email`, `enriched_at`
- Admin : `POST /api/admin/global-entreprises/backfill`

## Bootstrap (`coralt_web/bootstrap.py`)

Au ready app :

1. `init_db()` (+ sheet mirror, app_settings, entreprises globales)
2. Blueprint entreprises-db
3. Migration OAuth éventuelle depuis ancien `clients.db`
4. Workers fond : enrichissement, search queue, mailing si `MAIL_WORKER_ENABLED`

## Port iOS

Le client ne parle qu’à l’API HTTP ; ne jamais ouvrir SQLite localement pour le sync métier. Schémas ci-dessus aident à comprendre payloads et quotas.
