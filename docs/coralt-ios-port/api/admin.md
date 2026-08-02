# API Admin

> **Hors scope MVP iOS.** Blueprint Flask `admin_bp` (`coralt_web/routes/admin.py`) + client `frontend/src/api/admin.js` + orchestration services `admin_services.py`.

## Auth

- Toutes les routes ci-dessous appellent `require_admin_user()` :
  1. session `coralt_session` → email connecté ;
  2. email doit égaler `ADMIN_EMAIL` (sinon 403).
- Le front envoie aussi `admin_email` (query GET / corps JSON) ; ce n’est **pas** la source d’autorité.

## Client JS (`api/admin.js`)

Toutes les fonctions passent par `apiFetch` (`credentials: "include"`).

| Fonction | Méthode | Chemin |
|----------|---------|--------|
| `fetchAdminUsers` | GET | `/api/admin/users?admin_email=` |
| `fetchAdminTable` | GET | `/api/admin/table/:tableName?admin_email=` |
| `updateUserSearchEnabled` | PATCH | `/api/admin/users/:id/search-enabled` |
| `updateUserEnrichmentEnabled` | PATCH | `/api/admin/users/:id/enrichment-enabled` |
| `updateAdminUser` | PATCH | `/api/admin/users/:id` |
| `deleteAdminUser` | DELETE | `/api/admin/users/:id` |
| `fetchEnrichmentSettings` / `saveEnrichmentSettings` | GET / PATCH | `/api/admin/enrichment-settings` |
| `fetchGlobalSendTimeslot` / `saveGlobalSendTimeslot` | GET / PATCH | `/api/admin/send-timeslot` |
| `fetchAdminServices` | GET | `/api/admin/services` |
| `restartAdminService` | POST | `/api/admin/services/:id/restart` |
| `setAdminServicePower` | POST | `/api/admin/services/:id/power` |
| `fetchAdminSignupCodes` / `createAdminSignupCode` / `deleteAdminSignupCode` | GET / POST / DELETE | `/api/admin/signup-codes` |

## Routes serveur (inventaire)

| Méthode | Chemin | Rôle |
|---------|--------|------|
| GET | `/api/admin/users` | Liste utilisateurs enrichie (Gmail, templates, blacklist, quotas, état enrichissement) + `enrichment_daemon_running` |
| GET | `/api/admin/entreprises-db/overview` | Monitoring comptes entreprises + stats globales |
| POST | `/api/admin/global-entreprises/backfill` | Remplit `entreprises_globales` depuis les bases comptes (`batch_size`) |
| PATCH | `/api/admin/users/<id>/search-enabled` | Corps : `search_enabled` |
| PATCH | `/api/admin/users/<id>/enrichment-enabled` | Corps : `enrichment_enabled` |
| PATCH | `/api/admin/users/<id>` | Corps : `updates` (champs whitelist + `password` optionnel) |
| DELETE | `/api/admin/users/<id>` | Suppression compte + purge données liées (admin non supprimable) |
| GET/PATCH | `/api/admin/send-timeslot` | Plages globales `send_timeslot` / `send_timeslot_enabled` (`app_settings`) |
| GET/PATCH | `/api/admin/enrichment-settings` | Délais workers ; PATCH corps `settings` (objet clé→valeur) |
| GET | `/api/admin/services` | Statuts registry `admin_services` |
| POST | `/api/admin/services/<id>/restart` | Redémarrage |
| POST | `/api/admin/services/<id>/power` | Corps : `enabled` bool |
| GET | `/api/admin/table/<table_name>` | Tables whitelist : `users`, `email_templates`, `email_prompts`, `blacklisted_emails`, `clientoauth` (OAuth masqué) |
| GET/POST | `/api/admin/signup-codes` | Liste / création (`plan` 1\|2\|3) |
| DELETE | `/api/admin/signup-codes/<id>` | Suppression code non utilisé |

### Champs PATCH utilisateur autorisés

`name`, `email`, `phone`, `plan` (1–3), `gsheet_url`, `search_domain`, `send_mode` (`manual`\|`auto`), booléens (`mail_use_ai`, `search_enabled`, `enrichment_enabled`, `search_queue_paused`, `mail_test_mode`, `mail_sending_enabled`, `account_activated`), `enrich_interval_seconds` (≥ 10 ou null), `search_naf_codes`, `search_geo_zones`, `search_profile_json`, `cv_path`, `competence_highlight`, `search_analysis_limit`, `password` (≥ 6).

## Services admin (`admin_services.py`)

Registry pilotable depuis l’UI :

| id | kind | Description |
|----|------|-------------|
| `company-enrichment` | systemd | `company-enrichment.service` |
| `search-queue` | systemd | `search-queue.service` |
| `email-sender` | systemd | `email-sender.service` |
| `enrichment-thread` | thread | Worker intégré Flask |
| `search-queue-thread` | thread | File recherche intégrée |
| `mailing-thread` | thread | Worker mailing (`MAIL_WORKER_ENABLED`) |
| `frontend-build` | task | `npm run build` (pas d’interrupteur power) |

Redémarrage thread : ne tue jamais le PID webapp si le lock appartient au process courant.

## Port iOS

Hors MVP. Si un jour exposé : remplacer cookie session par **Authorization: Bearer** + contrôle rôle admin côté API.
