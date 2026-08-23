# Connecteur n8n — webhook recherche entreprises

## URL

Module `coralt_webhooks.py` :

- Env **`WEBHOOK_URL`** (obligatoire en production).
- Défaut **dev uniquement** : `https://n8n.coraia.eu/webhook/123aaaa8-c9ba-4fd8-b05c-d9a43c5f829d`.

Timeouts :

- Worker file : `SEARCH_QUEUE_TIMEOUT` (défaut **120 s**).
- Chemin async legacy `/api/send` hors file : `WEBHOOK_TIMEOUT_SECONDS` (défaut **120 s**).

## Qui appelle n8n ?

1. **Chemin nominal** : worker `process_next_queue_item` — **un POST par item** (lot APE × une zone), espacé de `gap_seconds` (~60 s).
2. **File désactivée** : `/api/send` peut fan-out plusieurs appels (ou async) — à éviter en prod.

Le client iOS **ne parle jamais à n8n** : uniquement `POST /api/send` + polling file.

## Payload exact (worker)

Construit par `search_queue._build_payload` — **tableau d’un objet** :

```json
[
  {
    "ville": "293*",
    "code": "62.01Z, 62.02A",
    "codes": ["62.01Z", "62.02A"],
    "taille_min": 5,
    "taille_max": 1000,
    "name": "Prénom Nom",
    "email": "user@example.com",
    "adresse_email": "user@example.com",
    "phone": "",
    "SECTEUR": "Développement logiciel",
    "plan": 3,
    "sheet_id": "1xj9-…",
    "profil_candidat": "Je recherche une alternance…",
    "profile_text": "Je recherche une alternance…"
  }
]
```

| Champ | Source |
|-------|--------|
| `ville` | Motif géo de l’item (CP / `29*` / `293*`) |
| `code` | Lot APE string (virgules) |
| `codes` | Liste parsée du lot |
| `sheet_id` | Extrait de `users.gsheet_url` (`/d/([id])/`) ou vide |
| `profil_candidat` / `profile_text` | Snapshot campagne, sinon `users.search_domain` |
| `plan` | `users.plan` (défaut 3) |
| `SECTEUR` | Champ campagne `secteur` |

`SEARCH_APE_BATCH_SIZE` (défaut 2) limite la taille de `codes` / `code`.

## Réponses n8n attendues

Corps JSON (string HTTP). Parsing partagé (`_apply_webhook_response` / `webhookResponse.js`).

### Nouveau Google Sheet

```json
{ "sheet_id": "1xj9abcdef…" }
```

→ `response_kind: "created"` ; URL dérivée  
`https://docs.google.com/spreadsheets/d/{sheet_id}/edit` ; maj `users.gsheet_url`.

### Sheet existant / ajouts

```json
{ "number": 42 }
```

ou clés équivalentes : `added`, `count`, `nb`, `prospects_added`, `new_rows`.

Également acceptés : `gsheet_url` / `url`.

→ `response_kind: "existing"` + `prospects_added`.

### Côté UI (après file)

Le web n’affiche plus forcément le détail n8n immédiat (réponse `/api/send` = queued). Les titres `getPreviewTitle` :

- `queued` → « Recherche en cours »
- `accepted` → « Demande prise en compte »
- `created` → « Tableau créé »
- `existing` → « N prospects ajoutés »

Après succès item : `sheet_sync.resync_sheet_mirror(email, url)` (miroir entreprises).

## Flux séquence

```
iOS  →  POST /api/send  →  enqueue_search_campaign (SQLite)
                              ↓
                    worker (tick 5s, gap 60s)
                              ↓
                    POST WEBHOOK_URL  [payload ci-dessus]
                              ↓
                    n8n → Google Sheets / scraping
                              ↓
                    JSON { sheet_id | number | … }
                              ↓
                    item success + cache APE
iOS  ←  GET /status|state (poll) ← compteurs campagne
```

## Port iOS — notifications

Le serveur n’émet pas de push natif aujourd’hui. Options port :

1. **Polling** foreground (5–15 s) + banner locale quand `pending_count` passe à 0.
2. **Push** : étendre le worker (succès item / fin campagne) vers APNs / FCM — hors scope web actuel.
3. Afficher `gap_seconds` et `worker_running` pour expliquer les attentes longues.

Ne jamais stocker `WEBHOOK_URL` dans l’app mobile.
