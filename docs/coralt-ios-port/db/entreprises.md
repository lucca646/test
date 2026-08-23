# Bases SQLite — entreprises & tables liées

Lecture seule observée sur l’instance COR·ALT. Chemins via `coralt_paths` (`ENTREPRISES_DB`, `GLOBAL_ENTREPRISES_DB`, `USERS_DB`).

Voir aussi [`schema-overview.md`](schema-overview.md).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `entreprises.db` | Fiches prospects **par compte** (`user_email`) |
| `entreprises_globales.db` | Cache enrichi **partagé** (tous comptes) |
| `users.db` | Comptes, `enrichment_state`, miroir Sheet legacy, templates… |

## Table `entreprises` (`entreprises.db`)

```sql
CREATE TABLE entreprises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL COLLATE NOCASE,
  sheet_id TEXT DEFAULT '',
  denomination TEXT NOT NULL,
  ville TEXT DEFAULT '',
  taille TEXT DEFAULT '',
  adresse TEXT DEFAULT '',
  secteur TEXT DEFAULT '',
  info TEXT DEFAULT '',
  site TEXT DEFAULT '',
  email TEXT DEFAULT '',          -- email ENTREPRISE
  message TEXT DEFAULT '',        -- corps mail
  numero TEXT DEFAULT '',
  status TEXT DEFAULT '',         -- '' | GO | OK | SENT | NO CONTACT | VALIDATED | …
  ip TEXT DEFAULT '',
  date TEXT DEFAULT '',
  created_at TEXT NOT NULL,       -- ISO UTC …Z
  updated_at TEXT NOT NULL,
  repondu TEXT DEFAULT '',        -- '' | yes | no
  note_perso TEXT DEFAULT '',
  mail_subject TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  siren TEXT DEFAULT '',
  UNIQUE (user_email, denomination)
);
CREATE INDEX idx_entreprises_user ON entreprises (user_email);
CREATE INDEX idx_entreprises_user_status ON entreprises (user_email, status);
```

### Colonnes métier (alignement Sheet)

`ENTREPRISE_COLUMNS` : `sheet_id`, `denomination`, `ville`, `taille`, `adresse`, `secteur`, `info`, `site`, `email`, `message`, `numero`, `status`, `ip`, `date`.

Extras migrés : `repondu`, `note_perso`, `mail_subject`, `contact`, `siren`.

### Distribution status (prod, snapshot doc)

| `status` | Ordre de grandeur |
|----------|-------------------|
| `OK` | ~3000 |
| `NO CONTACT` | ~2000 |
| `SENT` | ~600 |
| `GO` | ~500 |
| `''` (pending) | ~400 |

### Listes / pagination serveur

| Fonction | Filtre | Limite défaut |
|----------|--------|---------------|
| `list_entreprises` | user | 5000 |
| `list_entreprises_pending_enrichment` | user + status vide | 5000 |
| `list_prospects_for_user` | → dict UI | 5000 |
| `list_swipe_prospects_for_user` | email+mail, non SENT | 2000 (cap 5000) |

## Table `entreprises_globales`

```sql
CREATE TABLE entreprises_globales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siren TEXT DEFAULT '',
  key_denomination TEXT NOT NULL DEFAULT '',
  key_ville TEXT NOT NULL DEFAULT '',
  denomination TEXT NOT NULL,
  ville TEXT DEFAULT '',
  adresse TEXT DEFAULT '',
  taille TEXT DEFAULT '',
  secteur TEXT DEFAULT '',
  info TEXT DEFAULT '',
  site TEXT DEFAULT '',
  email TEXT DEFAULT '',
  numero TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  status TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  date TEXT DEFAULT '',
  enriched_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  hit_count INTEGER DEFAULT 0,
  source_user_email TEXT DEFAULT ''
);
-- INDEX siren (si non vide)
-- UNIQUE (key_denomination, key_ville)
```

Normalisation clés : minuscules, sans accents, alphanum (`normalize_key_text`). SIREN : 9 chiffres (SIRET → 9 premiers).

Pas de colonnes mail (`message` / `mail_subject`) — cache contacts uniquement.

## Tables user liées (`users.db`)

### `enrichment_state`

| Colonne | Type | Notes |
|---------|------|-------|
| `user_email` | TEXT PK | |
| `last_run_at` | TEXT | |
| `last_row_index` | INTEGER | |
| `last_status` | TEXT | `ok`, `error`, `awaiting_n8n`, `idle`, … |
| `last_error` | TEXT | |
| `rows_processed` | INTEGER DEFAULT 0 | cumul |
| `interval_seconds` | INTEGER | |
| `next_run_at` | TEXT | |
| `awaiting_n8n_count` | INTEGER DEFAULT 0 | |

### Colonnes `users` utiles entreprises / enrichissement

| Colonne | Rôle |
|---------|------|
| `plan` | 1 / 2 / 3 — gates enrichissement & mailing |
| `enrichment_enabled` | 0/1 kill-switch |
| `enrich_interval_seconds` | override intervalle |
| `gsheet_url` | legacy Sheet (enrichissement lit surtout `entreprises.db`) |
| `mail_use_ai`, `selected_template_id`, `selected_prompt_id` | payload webhook |
| `cv_json`, `competence_highlight` | payload webhook |
| `search_domain` | champ `secteur` webhook |
| `mail_sending_enabled`, `mail_test_mode`, `send_mode` | envois (page Entreprises plan 3) |

### Miroir Sheet (legacy / parallèle)

`sheet_mirror_meta`, `sheet_prospect_rows` — encore présents ; le flux actuel Entreprises lit **directement** `entreprises.db` (`auth_mode: "entreprises_db"`).

### Autres

`blacklisted_emails`, `email_templates`, `email_prompts` — utilisés depuis les actions mail de la page Entreprises.

## Mapping prospect UI ↔ DB

| Prospect UI | Colonne DB |
|-------------|------------|
| `id` / `row_index` / `entreprises_db_id` | `id` |
| `entreprise` | `denomination` |
| `email` | `email` |
| `lien` | `site` |
| `mailSubject` | `mail_subject` |
| `mailBody` | `message` |
| `notePerso` | `note_perso` |
| `statut` | dérivé de `status` (`STATUS_MAP`) |
| `statutSheet` | `status` brut |
| `repondu` | `repondu` |
| `sheet_id` | `sheet_id` |

## Port iOS

- Ne **pas** ouvrir ces fichiers SQLite depuis l’app.
- Modèle local = snapshot JSON des `prospects` (+ meta `mirror.entreprises_db`).
- Cache offline : dernière page + horodatage `last_updated_at` ; invalider si SSE `count`/`last_updated_at` change ou après mutation.
- Pour sync volumineux : paginer `GET /api/plan3/sheet-prospects` (`limit`≤2000).

## Fichiers source

- `entreprises_db.py`, `entreprises_globales_db.py`
- `company_enrichment.py` (`init_enrichment_db`)
- `coralt_paths.py`, `coralt_web/db.py`
