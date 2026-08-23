# Feature CRUD entreprises / prospects

Opérations métier sur les fiches du compte. Deux surfaces HTTP :

1. **App utilisateur** — `/api/plan3/sheet-prospects*` (session `require_user_email`) — utilisée par `EntreprisesPage`.
2. **API machine / visionneuse** — `/api/entreprises-db/*` (session, admin+email, ou `X-API-Key` + email) — détail dans [`api/entreprises-db.md`](../api/entreprises-db.md).

Couche données unique : `entreprises_db.py` → table `entreprises` (`entreprises.db`).

## Identifiants

| Concept | Valeur |
|---------|--------|
| Clé métier upsert | `UNIQUE (user_email, denomination)` |
| `row_index` / `id` UI | `entreprises.id` (INTEGER ≥ 1) |
| `sheet_id` | Horodatage UTC `AAAAMMJJHHMMSS` + µs (+ suffixe si collision) ou ID fourni n8n |
| Résolution API entreprises-db | `ref` = id court (≤ 8 chiffres) **ou** `sheet_id` |

## Création / upsert

### Via app (`createEntreprise`)

`POST /api/entreprises-db/rows`

```json
{
  "user_email": "user@example.com",
  "denomination": "Acme SAS",
  "email_entreprise": "contact@acme.fr",
  "contact": "Marie",
  "ville": "Lorient",
  "numero": "0612345678",
  "site": "https://acme.fr",
  "status": "OK"
}
```

Règles client (`entreprises.js`) :

- Téléphone normalisé FR avant envoi.
- `status` forcé `"OK"` si email `@` **ou** téléphone ; sinon `""` (pending enrichissement).
- Réponse : `{ status: "success", row: {…ligne DB…} }` → client retourne `data.row`.

### Via `upsert_entreprise` (serveur)

Aliases acceptés : `denomination`/`DENOMINATION`, email entreprise via `email_entreprise` | `EMAIL` | `contact_email` | …, `note_perso`/`notePerso`/`NOTE`, `mail_subject`/`objet`/`subject`, `contact`, `siren`, champs Sheet (`ville`, `taille`, `adresse`, `secteur`, `info`, `site`, `message`, `numero`, `status`, `ip`, `date`).

- Update si `(user_email, denomination)` existe (conserve `sheet_id` / email / note / contact si non fournis).
- Insert sinon (`created_at` = `updated_at` = ISO UTC `…Z`).

## Lecture

| Endpoint | Pagination | Corps utile |
|----------|------------|-------------|
| `GET /api/plan3/sheet-prospects?limit&offset` | `limit` 1–2000 (défaut 1000), `offset` ≥ 0 | `prospects[]` UI + `total`, `has_more`, `mirror` |
| `GET /api/plan3/sheet-prospects?for_swipe=1` | idem | cartes swipe-ready + stubs `sent` (slim) |
| `GET /api/entreprises-db/rows` | serveur `list_entreprises` défaut **limit 5000** | lignes DB brutes + `count`, `last_updated_at` |
| `GET /api/entreprises-db/rows/<ref>` | — | une ligne DB |

Client app : boucle `offset += 1000` jusqu’à `!has_more`.

## Mise à jour champs fiche

`POST /api/plan3/sheet-prospects/update`

```json
{
  "email": "user@example.com",
  "row_index": 12,
  "fields": {
    "entreprise": "Nouveau nom",
    "contact": "…",
    "email": "…",
    "ville": "…",
    "adresse": "…",
    "lien": "https://…",
    "secteur": "…",
    "taille": "…",
    "numero": "…",
    "info": "…"
  }
}
```

Mapping UI → DB (`update_prospect_ui_fields`) : `entreprise`→`denomination`, `lien`→`site`, `notePerso`→`note_perso`, `repondu` ∈ {`yes`,`no`,``}.

Réponse : `{ status, row_index, prospect }`.

## Note personnelle

`POST /api/plan3/sheet-prospects/note-perso` — `{ email, row_index, note }` (alias `notePerso`).

Stockage : colonne `note_perso`. Réponse inclut `notePerso` + `prospect` + `storage: "entreprises_db"`.

## Suivi « Répondu »

`POST /api/plan3/sheet-prospects/repondu` — `{ email, row_index, repondu }` avec `repondu` ∈ `yes` | `no` | `""` (efface).

## Changement de statut

`POST /api/plan3/sheet-prospects/status`

```json
{ "email": "…", "row_index": 12, "action": "relancer" }
```

| `action` | DB `status` écrit |
|----------|-------------------|
| `validate` | `VALIDATED` |
| `no_contact` | `NO CONTACT` |
| `relancer` | `""` (refile enrichissement) |
| `sent` / `mark_sent` | `SENT` |
| `to_contact` / `mark_contact` | `OK` |

Plan 2 UI : bascule `sent` ↔ `to_contact`. Relancer : bouton « Réanalyser » si `in_progress` depuis ≥ 10 min (`REANALYZE_IN_PROGRESS_MIN_MS`).

## Suppression

`DELETE /api/plan3/sheet-prospects` — body `{ email, row_index }` → `delete_entreprise_by_id`.

Équivalent machine : `DELETE /api/entreprises-db/rows/<ref>`.

## Mail (plan 3 — lié à la fiche)

| Méthode | Path | Effet DB |
|---------|------|----------|
| POST | `/api/plan3/sheet-prospects/mail` | `mail_subject` + `message` |
| DELETE | `/api/plan3/sheet-prospects/mail` | vide mail + `status = NO CONTACT` |
| POST | `/api/plan3/sheet-prospects/send` | envoi Gmail + `SENT` + `repondu=no` ; 409 `already_sent` |

Helpers DB : `save_prospect_mail_db`, `clear_prospect_mail_db`, `mark_prospect_sent_db`.

## PATCH machine (`/api/entreprises-db/rows/<ref>`)

Corps JSON partiel ; clés `_EDITABLE_FIELDS` : `sheet_id`, `denomination`, `ville`, `taille`, `adresse`, `secteur`, `info`, `site`, `email`, `message`, `numero`, `status`, `ip`, `date`, `repondu`, `note_perso`, `mail_subject`, `contact`, `siren`.

`numero` normalisé FR. Clash dénomination → 400.

## Maintenance (API entreprises-db)

`POST /api/entreprises-db/backfill-ids` — remplit `sheet_id` vides, déduplique `sheet_id`, efface emails entreprise = email compte.

Réparations auto (lecture prospects, throttle 5 min) : `repair_misclassified_no_contact`, `repair_malformed_phones`.

## Port iOS

- Un seul modèle `Prospect` aligné sur `db_row_to_prospect_dict`.
- Mutations : mêmes endpoints plan3 ; optimistic update + refresh page (`limit`/`offset`) ou patch local.
- CRUD offline : file d’attente locale des PATCH/POST, flush au retour réseau (ne pas écrire SQLite métier côté device).
- Création : préférer `POST /api/entreprises-db/rows` (déjà utilisé web) ou exposer un wrapper plan3 si Bearer-only.

## Fichiers source

- `entreprises_db.py` — `upsert_entreprise`, `update_*`, `delete_*`, `db_row_to_prospect_dict`
- `coralt_web/routes/plan3.py` — routes `sheet-prospects*`
- `entreprises_db_routes.py` — CRUD `/api/entreprises-db`
- `frontend/src/api/entreprises.js`, `mailing.js`
