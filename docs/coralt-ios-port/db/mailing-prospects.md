# DB — Prospects mailing & tables associées

Bases : `entreprises.db` (fiches) + `users.db` (templates, prompts, blacklist, flags, OAuth)  
Modules : `entreprises_db.py`, `coralt_web/db.py`, `mailing_send.py`, `gsheet_reader.py` (`STATUS_MAP`)

## Table `entreprises` (prospects)

Clé : `id` (aussi `row_index` côté API) · `UNIQUE (user_email, denomination)`

| Colonne DB | Champ UI prospect | Notes |
|------------|-------------------|--------|
| `denomination` | `entreprise` | |
| `email` | `email` | requis swipe |
| `mail_subject` | `mailSubject` | |
| `message` | `mailBody` | peut contenir sujet+corps legacy |
| `status` | `statut` / `statutSheet` | mapping ci-dessous |
| `contact` | `contact` | |
| `ville`, `numero`, `site` | `ville`, `numero`, `lien` | |
| `repondu` | `repondu` | `yes`/`no` |
| `note_perso` | `notePerso` | local |
| `updated_at` | `updated_at` | |

Conversion : `db_row_to_prospect_dict`.

### Mapping statut Sheet → UI

| STATUS brut | UI |
|-------------|-----|
| _(vide)_ | `pending` |
| `GO` | `in_progress` |
| `OK` | `validate` |
| `VALIDATED` / Validé | `validated` |
| `SENT` / Envoyé | `sent` |
| `NO CONTACT` | `no_contact` (sauf si email/tél → `validate`) |

Écritures mailing :

| Opération | Patch DB |
|-----------|----------|
| Save mail | `mail_subject`, `message` |
| Clear mail | subject/message vides + `status=NO CONTACT` |
| Mark sent | subject/message + `status=SENT` + `repondu=no` |

## Vue swipe (`list_swipe_prospects_for_user`)

1. Lignes avec email `@` + (subject+body **ou** body seul legacy) + status ≠ SENT  
2. Filtre `_prospect_is_swipe_ready`  
3. Slim keys : id, row_index, entreprise, email, ville, contact, statut, mailSubject/Body, …  
4. + stubs SENT (`id`, `entreprise`, `email`, `statut: sent`, mailSubject optionnel)

## Tables `users.db` mailing

### `email_templates` / `email_prompts`

Par `user_email` — CRUD plan3.

### `blacklisted_emails`

`id`, `user_email`, `email`  
Match envoi : égalité exacte **ou** entrée `@domaine` si target se termine par ce suffixe (`mailing_send.is_blacklisted`).

### `clientoauth`

Tokens Gmail (`owner_email` PK) — voir connecteur email-sender.

### Flags `users` utiles mailing

`plan`, `mail_use_ai`, `selected_template_id`, `selected_prompt_id`, `mail_sending_enabled`, `mail_test_mode`, `send_mode`, `send_timeslot`, `competence_highlight`, `cv_path`, `cv_json`, `gsheet_url`

## Anti-doublon

`find_prior_sends_to_email(user_email, target)` : mêmes email normalisé + `statut == sent` après mapping.

## Port iOS

- Modèle Swift/TS aligné sur l’objet prospect UI (pas les colonnes brutes)
- Cache local swipe = slim + stubs sent
- Ne pas écrire directement SQLite — uniquement via API plan3
- Blacklist : afficher chips comme MailingPage ; validation domaine `@…` côté UX
