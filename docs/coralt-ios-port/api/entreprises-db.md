# API `entreprises-db`

Blueprint isolé : `entreprises_db_routes.py` (`entreprises_db_bp`).  
Base : `entreprises.db` via `entreprises_db.py`.  
Auth : `coralt_auth.require_entreprises_db_account_email`.

Préfixe machine : `/api/entreprises-db/*` (aussi reconnu par `is_entreprises_db_api_path` pour bypass session si clé API valide).

## Auth

Ordre de résolution du **compte cible** (`user_email`) :

1. Session **admin** + query/body `email` ou `user_email` → compte ciblé (monitoring).
2. Session utilisateur → email de session (param `email` ignoré pour non-admin).
3. Sinon : header `X-API-Key` **ou** `Authorization: Bearer <ENTREPRISES_DB_API_KEY>` + `email`/`user_email` (query ou JSON).

Erreurs typiques :

| Code | Message |
|------|---------|
| 401 | Session / clé manquante ou invalide |
| 400 | Clé OK mais `email` manquant |

Variable env : `ENTREPRISES_DB_API_KEY` (dev défaut `coralt_entreprises_db_dev`).

## Endpoints

### `GET /api/entreprises-db/accounts`

Liste comptes pour la visionneuse.

- Admin session → tous les `users` (+ meta compteur via `list_viewer_accounts`)
- User session → uniquement soi
- Clé API seule → `list_viewer_accounts()` sans filtre users (overview)

```json
{ "status": "success", "accounts": [ { "email": "…", "name": "…", "…" } ] }
```

### `GET /api/entreprises-db/rows`

Liste des lignes du compte (brut SQLite → dict).

Query : `email` / `user_email` si clé API ou admin.

Implémentation : `list_entreprises(email)` — **LIMIT 5000 OFFSET 0** (pas de query `limit` exposée sur cette route).

```json
{
  "status": "success",
  "email": "user@example.com",
  "rows": [ { "id": 1, "user_email": "…", "denomination": "…", "status": "OK", "…" } ],
  "count": 120,
  "last_updated_at": "2026-08-01T12:00:00Z",
  "runtime": {
    "instance": "…",
    "port": 5000,
    "prod_url_hint": "https://cal.coraia.eu/db/entreprises"
  }
}
```

`count` / `last_updated_at` = `entreprises_meta` (`COUNT(*)`, `MAX(updated_at)`).

### `POST /api/entreprises-db/rows`

Upsert `(user_email, denomination)`.

Corps (extrait) :

```json
{
  "user_email": "user@example.com",
  "denomination": "Acme SAS",
  "email_entreprise": "contact@acme.fr",
  "ville": "Lorient",
  "numero": "0612345678",
  "site": "https://acme.fr",
  "contact": "Marie",
  "status": "OK",
  "note_perso": "…",
  "mail_subject": "…",
  "message": "…",
  "siren": "123456789"
}
```

Distinction critique :

- `email` / `user_email` → **compte** COR·ALT (auth / ciblage)
- `email_entreprise` / `EMAIL` / `contact_email` → colonne **email entreprise**

Succès `200` : `{ "status": "success", "row": {…} }`.  
Erreur validation `400` : `{ "status": "error", "message": "denomination requise" }`.

### `GET /api/entreprises-db/rows/<ref>`

`ref` = id SQLite (ex. `5`, ≤ 8 chiffres digitaux) **ou** `sheet_id` horodaté.

`200` : `{ "status": "success", "row": {…} }`  
`404` : ligne introuvable.

### `PATCH /api/entreprises-db/rows/<ref>`

Mise à jour partielle (voir `_EDITABLE_FIELDS` / mapping aliases dans `update_entreprise_by_id`).

`email` dans le body = email **entreprise** (pas le compte).

### `DELETE /api/entreprises-db/rows/<ref>`

```json
{ "status": "success", "deleted": true, "id": 5, "ref": "5" }
```

### `POST /api/entreprises-db/backfill-ids`

Maintenance compte :

```json
{
  "status": "success",
  "updated": 3,
  "deduplicated": 1,
  "cleared_wrong_emails": 0
}
```

Actions : `backfill_empty_sheet_ids`, `fix_duplicate_sheet_ids`, `clear_wrong_company_emails`.

### `GET /api/entreprises-db/stream` — SSE

Server-Sent Events : push quand `(count, last_updated_at)` change.

- Poll interne toutes les **2 s**
- Auth : même `require_entreprises_db_account_email`
- Headers : `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`
- `Content-Type: text/event-stream`

Événement :

```
data: {"count": 120, "last_updated_at": "2026-08-01T12:00:00Z"}

```

**Pas** de payload des lignes — signal de refresh seulement. La page Entreprises web **n’utilise pas** ce stream (elle poll `sheet-prospects`). Utilisé par la visionneuse HTML `/db/entreprises`.

## Visionneuse HTML (hors API JSON)

| Path | Rôle |
|------|------|
| `GET /db/entreprises` | HTML bootstrap (`viewer` + `accounts` JSON injecté) |
| `GET /db/entreprises/viewer.js` | JS visionneuse |

## Relation avec plan3

| Besoin app mobile | Endpoint recommandé |
|-------------------|---------------------|
| Liste UI prospects | `GET /api/plan3/sheet-prospects` (session / futur Bearer) |
| CRUD fiche UI | `/api/plan3/sheet-prospects/*` |
| Création manuelle (web actuel) | `POST /api/entreprises-db/rows` |
| Intégrations / n8n / admin DB | `/api/entreprises-db/*` + clé API |
| Live refresh léger | SSE `/api/entreprises-db/stream` |

## Port iOS

- Préférer plan3 pour l’UX utilisateur (objets déjà mappés `prospect`).
- Si app machine / sync admin : Bearer clé `ENTREPRISES_DB_API_KEY` + `email` (ne jamais embarquer la clé dans le binaire public — réservé outils internes).
- SSE : `URLSession` bytes stream ou EventSource polyfill ; reconnect + debounce reload liste.
- Pagination : la route rows API n’expose pas `limit`/`offset` — pour gros volumes, utiliser plan3 (`limit`≤2000) ou étendre le backend.

## Fichiers source

- `entreprises_db_routes.py`
- `entreprises_db.py`
- `coralt_auth.py` — `require_entreprises_db_account_email`, `entreprises_db_api_key_valid`
- `static/entreprises_db_viewer.html` / `.js`
