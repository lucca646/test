# DB : Users & Sessions

Schéma pertinent Auth / activation / Stripe. Base : `users.db` (SQLite, `coralt_web/db.py`).

## Sessions — pas de table SQL

Les sessions navigateur **ne sont pas** stockées en base.

| Concept | Implémentation |
|---------|----------------|
| Identité | Cookie signé Flask `coralt_session` |
| Payload | `session["user_email"]` |
| Durée | 14 jours |
| Module | `coralt_auth.py` |

Conséquence port iOS : sans cookie partagé, il faut un mécanisme token alternatif (hors schéma actuel).

---

## Table `users`

Création + migrations `ALTER` dynamiques (`init_db`).

### Colonnes auth / activation / Stripe

| Colonne | Type | Défaut | Rôle |
|---------|------|--------|------|
| `id` | INTEGER PK | auto | Identifiant |
| `name` | TEXT UNIQUE NOT NULL | — | Login alternatif + affichage |
| `email` | TEXT UNIQUE NOT NULL | — | Identité session (lower) |
| `phone` | TEXT NOT NULL | — | Obligatoire à l’inscription |
| `password_hash` | TEXT NOT NULL | — | Werkzeug hash |
| `plan` | INTEGER | 1 | 1 / 2 / 3 (défaut register sans code = **2**) |
| `account_activated` | INTEGER | 0 | Accès app post-paiement (migration initiale a forcé 1 historiquement sur existants) |
| `stripe_checkout_session_id` | TEXT | `''` | Dernière session Checkout |

### Autres colonnes (profil / produit — sérialisées dans `/me`)

| Colonne | Notes |
|---------|-------|
| `gsheet_url`, `cv_path`, `cv_json` | CV / sheet |
| `cv_analysis_status`, `cv_analysis_error` | Analyse CV |
| `competence_highlight`, `search_profile_json` | Compétences / onboarding |
| `search_domain`, `search_naf_codes`, `search_geo_zones` | Ciblage |
| `search_enabled`, `enrichment_enabled`, `search_queue_paused` | Flags queues |
| `search_analysis_limit` | Défaut 1000 |
| `send_mode`, `send_timeslot` | Envoi (timeslot global peut overrider côté API) |
| `mail_use_ai`, `mail_sending_enabled`, `mail_test_mode` | Mailing |
| `selected_template_id`, `selected_prompt_id` | Templates |
| `enrich_interval_seconds` | Enrichissement |

### Opérations par endpoint

| Endpoint | Lecture | Écriture |
|----------|---------|----------|
| register | — | INSERT (+ plan, activated=0) |
| login | SELECT * WHERE name OR email | — |
| me | SELECT * ; éventuel UPDATE competence | — |
| update | SELECT ; UPDATE champs profil | name/phone/password/skills |
| request-plan | SELECT ; UPDATE plan (non-admin) | `plan` |
| create-checkout | SELECT | `plan`, `stripe_checkout_session_id` |
| fulfill (verify/webhook) | SELECT | `plan`, `account_activated=1`, `stripe_checkout_session_id` |
| purchase-receipt | SELECT plan, activated, session_id | — |

---

## Table `signup_codes`

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | INTEGER PK | — |
| `code` | TEXT UNIQUE | Format `XXXX-XXXX` |
| `plan` | INTEGER CHECK (1,2,3) | Plan pré-attribué |
| `created_at` | TEXT | ISO UTC |
| `created_by_email` | TEXT | Admin créateur |
| `used_at` | TEXT NULL | Consommation |
| `used_by_user_id` | INTEGER FK → users | — |

**Résolution (`resolve_signup_code`) :**

1. Code vide + code non requis → plan **2**, pas d’id
2. Code = `REGISTRATION_INVITE_CODE` (env) → plan **1**
3. Sinon ligne `signup_codes` non utilisée → plan de la ligne
4. Sinon erreur

---

## Table `clientoauth` (référence Gmail)

Hors `db.py` init users (créée par le service email_sender). Utilisée pour :

- `gmail_connected` / `gmail_labels_ready` dans `serialize_user`
- `DELETE` sur disconnect-gmail

Colonnes typiques utilisées : `owner_email`, `scopes_json`, tokens (masqués côté admin).

---

## Tables liées non critiques pour le port auth

- `email_templates`, `email_prompts` — créés à l’inscription (template défaut)
- `blacklisted_emails`

---

## Seed dev

Si base vide **et** runtime dev : user démo `louis@combe.fr` / `password123`, plan 3, `account_activated=1`.

---

## Port iOS — mapping stockage

| Donnée serveur | Persistance iOS |
|----------------|-----------------|
| Session email (cookie) | SecureStore token **ou** cookie jar |
| Cache profil (`coralt_session_v2`) | AsyncStorage / UserDefaults — non trusté pour activation |
| `account_activated`, `plan` | Toujours resync via `/api/auth/me` au foreground |
| `stripe_checkout_session_id` | Côté serveur uniquement ; app garde `session_id` URL le temps du verify |

Pas besoin de répliquer SQLite users côté device.
