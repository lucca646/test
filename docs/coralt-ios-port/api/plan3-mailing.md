# API Plan 3 — Mailing & prospects

Blueprint : `coralt_web/routes/plan3.py` (`plan3_bp`)  
Client : `frontend/src/api/mailing.js`  
Auth : session cookie (`require_user_email()`) — le `email` body/query est informatif

## Prospects (`entreprises.db`)

### `GET /api/plan3/sheet-prospects`

| Query | Défaut | Notes |
|-------|--------|-------|
| `email` | — | compte |
| `limit` | 1000 | max 2000 |
| `offset` | 0 | pagination |
| `for_swipe` | — | `1`/`true` → `list_swipe_prospects_for_user` |

Réponse :

```json
{
  "status": "success",
  "prospects": [ /* objets UI */ ],
  "total": 0,
  "limit": 1000,
  "offset": 0,
  "has_more": false,
  "mirror": { "source": "entreprises_db_swipe|entreprises_db", "synced_at": "…", "count": 0 },
  "for_swipe": true,
  "from_cache": true
}
```

`for_swipe` : cartes ready (slim) + stubs `sent` (anti-doublon). Client pagine jusqu’à `has_more=false` (timeout 45 s swipe / 90 s full).

### `DELETE /api/plan3/sheet-prospects`

Body `{ email, row_index }` — supprime la ligne.

### Autres champs fiche

| Route | Rôle |
|-------|------|
| `POST …/update` | champs éditables Sheet/DB |
| `POST …/note-perso` | note locale |
| `POST …/repondu` | `yes` \| `no` \| `""` |
| `POST …/status` | actions statut (`relancer`, etc.) |

## Mail brouillon / IA / envoi

### `POST /api/plan3/sheet-prospects/mail`

Sans `regenerate` : sauve `mail_subject` + `message`.

Avec `regenerate: true` : IA / template (voir `features/templates-prompts.md`). Timeout conseillé 120 s.

### `DELETE …/mail`

Vide brouillon + `status = NO CONTACT`.

### `GET …/sent-check?target_email=`

`{ already_sent, prior_sends, count }`.

### `POST …/send` — envoi Gmail

Body :

```json
{
  "email": "user@…",
  "row_index": 123,
  "subject": "…",
  "body": "…",
  "target_email": "contact@entreprise.fr",
  "force": false
}
```

**Gates** (ordre) :

| Check | HTTP |
|-------|------|
| plan < 3 | 403 |
| hors créneau global | 403 + `outside_timeslot` |
| pas de target (hors test) | 400 |
| Gmail non connecté | 400 |
| scopes label manquants | 400 |
| déjà envoyé à l’adresse (`force` false) | **409** `{ status: "already_sent", prior_sends }` |
| blacklist / CV manquant / etc. | 400 |
| email_sender down / Gmail fail | 502 |

Succès : `{ status: "success", sent_to, test_mode, gmail, prospect }` — prospect marqué `SENT`, `repondu=no`.

Implémentation : `mailing_send.send_prospect_mail` → `POST {EMAIL_SENDER_URL}/send-email` + PJ CV base64.

## Templates / prompts / blacklist / compose

| Route | Méthodes |
|-------|----------|
| `/api/plan3/templates` | GET, POST |
| `/api/plan3/templates/<id>` | DELETE |
| `/api/plan3/prompts` | GET, POST |
| `/api/plan3/prompts/<id>` | DELETE |
| `/api/plan3/blacklist` | GET, POST (`user_email` + `email`) |
| `/api/plan3/blacklist/<id>` | DELETE |
| `/api/plan3/mailing-compose` | POST |
| `/api/plan3/mailing-control` | POST |
| `/api/plan3/mailing-status` | GET |
| `/api/plan3/settings` | POST |

Blacklist : adresse exacte **ou** domaine `@domaine.com` (match suffixe).

## Enrichissement (lié mailing)

| Route | Rôle |
|-------|------|
| `GET /api/enrichment/status` | file / erreurs n8n |
| `POST /api/enrichment/run` | cycle immédiat (`force`) |

## Port iOS

- Même paths sous base URL API ; Bearer (cible) à la place du cookie
- Gérer explicitement **409 already_sent** et **403 outside_timeslot**
- Pagination swipe obligatoire (ne pas charger le full 1500 fiches)
- Voir `connectors/email-sender.md`, `db/mailing-prospects.md`
