# Feature enrichissement contacts

Worker backend qui complète les fiches `entreprises` (email, téléphone, site, status, …) via **webhook n8n**, avec cache partagé `entreprises_globales.db`.

Sources : `company_enrichment.py`, `entreprises_globales_db.py`, routes `/api/enrichment/*` dans `coralt_web/routes/plan3.py`.

## Règle d’éligibilité d’une ligne

Une ligne est **à enrichir** ssi la colonne DB `status` est **vide** (`TRIM(status) = ''`).

- UI : `statut === "pending"`, pas de `statutSheet`.
- Compteur : `count_pending_enrichment(user_email)` / `list_entreprises_pending_enrichment`.

Dès qu’un status est posé (`OK`, `GO`, `NO CONTACT`, `SENT`, …), la ligne sort de la file n8n (sauf `action: relancer` → `status=""`).

## Droits par plan

| Condition | Valeur |
|-----------|--------|
| Plan minimum | `ENRICH_MIN_PLAN` env, défaut **2** |
| Flag compte | `users.enrichment_enabled` (défaut 1) — kill-switch admin |
| Intervalle plan 2 | `app_settings.enrich_interval_plan2` défaut **300 s** |
| Intervalle plan 3 | `enrich_interval_plan3` défaut **120 s** |
| Override user | `users.enrich_interval_seconds` > 0 (+ stagger) |
| Stagger par email | `enrich_stagger_seconds` défaut 60 (hash email) |
| Gap global entre webhooks | `enrich_global_gap_seconds` défaut 10 s |
| Batch / tick | `ENRICH_BATCH_SIZE` défaut **1** ligne |
| Tick worker | `enrich_tick_seconds` défaut 10 s |

Plan 1 : API `POST /api/enrichment/run` → **403**. Worker ignore les users `plan < ENRICH_MIN_PLAN`.

## Flux par ligne (`enrich_prospect_row`)

```
status vide ?
  → lookup entreprises_globales (SIREN puis nom+ville normalisés)
      → hit + status global renseigné :
          apply_enrichment_updates → record global hit_count
          state = ok ; schedule next
  → sinon GET webhook n8n (ENRICH_WEBHOOK_URL)
      → réponse avec champs → apply_enrichment_updates (+ sync global)
      → ack placeholder n8n sans data → status awaiting_n8n, retry ~45 s
        (plafond ENRICH_AWAITING_N8N_MAX_ATTEMPTS=12)
      → erreur HTTP → state error + schedule
```

**Important** : le webhook reçoit surtout le **contexte user** + `row_index` / `sheet_id` ligne — pas le dump complet prospect (n8n relit / produit les coords). Enrichissement écrit les coords / status, **pas** la rédaction mailing (`message` / objet) depuis la réponse n8n (filtrage `_normalize_webhook_updates`).

### Payload webhook (extrait)

```json
{
  "email": "user@…",
  "name": "…",
  "sheet_id": "<id ligne ou sheet user>",
  "plan": "2",
  "secteur": "…",
  "mail_use_ai": "true|false",
  "template_objet": "…",
  "template_message": "…",
  "trame_objet": "…",
  "trame_message": "…",
  "competence_highlight": "…",
  "competence_cv": "…",
  "CV": "{…}",
  "row_index": 12
}
```

Méthode : **GET** (query) par défaut ; `ENRICH_HTTP_METHOD=post` possible. Troncature URL si > `ENRICH_GET_MAX_URL` (7500). Timeout `ENRICH_REQUEST_TIMEOUT` (120 s).

### Champs appliqués depuis n8n / cache global

| Source réponse | Clé UI apply | Colonne DB |
|----------------|--------------|------------|
| email / mail | `email` | `email` |
| site / lien / url / website | `lien` | `site` |
| numero / telephone / phone | `numero` | `numero` |
| info, ip, date | idem | idem |
| status / statut | `statut` | `status` |
| siren, contact | idem | idem |

Après apply : `record_global_from_user_row` si status non vide.

## État worker (`enrichment_state` dans `users.db`)

| Colonne | Rôle |
|---------|------|
| `user_email` | PK |
| `last_run_at` | ISO dernier passage |
| `last_row_index` | dernière ligne touchée |
| `last_status` | `ok` \| `error` \| `awaiting_n8n` \| `idle` \| … |
| `last_error` | message |
| `rows_processed` | compteur cumulé |
| `interval_seconds` | intervalle effectif mémorisé |
| `next_run_at` | prochain cycle autorisé |
| `awaiting_n8n_count` | essais async n8n |

## API HTTP

### `GET /api/enrichment/status`

Auth : session utilisateur.

```json
{
  "status": "success",
  "state": { "last_run_at": "…", "last_status": "ok", "next_run_at": "…", "…" },
  "pending_rows": 42,
  "eligible": true,
  "webhook_configured": true,
  "interval_seconds": 360,
  "due_now": false,
  "worker_running": true
}
```

### `POST /api/enrichment/run`

Body : `{ "force": false }`. Plan ≥ 2.

```json
{
  "status": "success",
  "pending_before": 10,
  "result": {
    "status": "success|idle|skipped",
    "email": "…",
    "pending": 10,
    "interval_seconds": 300,
    "next_run_at": "…",
    "processed": [
      {
        "status": "success|awaiting_n8n|error|skipped",
        "row_index": 12,
        "from_global_cache": false,
        "webhook_applied": ["email", "numero"],
        "webhook_pending": false
      }
    ]
  }
}
```

`force: true` ignore `user_is_due`. `skipped` reasons : `paused`, `not_due`.

### Admin (hors MVP mobile)

- `PATCH /api/admin/users/<id>/enrichment-enabled`
- `GET|PATCH /api/admin/enrichment-settings` (+ recalcul plannings)

## Cache global (`entreprises_globales`)

| Clé | Usage |
|-----|--------|
| `siren` (9 chiffres ; SIRET tronqué) | lookup prioritaire |
| `(key_denomination, key_ville)` | unique index normalisé (sans accents) |
| Réutilisable | `status` non vide |
| `hit_count` | incrémenté à chaque cache hit |
| Pas de mails | `message` / `mail_subject` **non** stockés |

Backfill : `backfill_global_from_entreprises_db` / admin.

## Statuts enrichissement côté produit

| Signal | Signification |
|--------|----------------|
| UI `pending` | En file |
| UI `in_progress` (`GO`) | n8n / pipeline a marqué en cours |
| UI `validate` (`OK`) | Coords OK — prêt contact |
| UI `no_contact` | Pas de canal exploitable |
| `awaiting_n8n` (state only) | Webhook ack sans payload encore |
| Relancer | Remet `status=""` → refile |

## Port iOS

- Afficher badge / bandeau `pending_rows` via `GET /api/enrichment/status` (pull-to-refresh ou timer 30–60 s).
- Ne pas implémenter le worker sur device — uniquement déclencher `POST /api/enrichment/run` (opt-in) et rafraîchir la liste.
- Relancer une ligne : `POST …/status` `{ action: "relancer" }` puis poll liste.
- Indicateur offline : conserver dernier `state` + `pending_rows` en cache local.

## Fichiers source

- `company_enrichment.py`
- `entreprises_globales_db.py`
- `entreprises_db.py` — `apply_enrichment_updates`, `list_entreprises_pending_enrichment`
- `coralt_web/routes/plan3.py` — `/api/enrichment/status`, `/run`
- `deploy/company-enrichment.service`, `scripts/run_company_enrichment.py`
