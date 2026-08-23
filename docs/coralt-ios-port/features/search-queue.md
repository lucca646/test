# File d’attente recherche (APE × zone)

Source : `search_queue.py` + routes `/api/search-queue/*` + polling `ConsolePage`.

## Modèle

Une **campagne** = empreinte (`fingerprint`) des critères utilisateur :

- codes APE (liste normalisée),
- cibles géo (motifs CP / agglomération / département),
- `taille_min` / `taille_max`.

Chaque **item** de file = un lot de codes APE (`SEARCH_APE_BATCH_SIZE`, défaut **2**) × **une** zone (`ville` = motif envoyé à n8n, ex. `29*` ou `56100`).

Cache anti-doublon : table `search_request_cache` (clé user + ape + postal + ville + tailles), TTL logique `SEARCH_CACHE_DAYS` (défaut **30** jours).

## Statuts

### Campagne (`search_campaigns.status`)

| Valeur | Sens |
|--------|------|
| `pending` | Items en attente / retry |
| `running` | Au moins un item en cours ou campagne active |
| `completed` | Plus de pending, aucun failed |
| `completed_with_errors` | Terminé avec ≥1 `failed` |
| `cancelled` | Tous les items annulés |

### Item (`search_queue_items.status`)

| Valeur | Libellé UI | Sens |
|--------|------------|------|
| `pending` | À envoyer | En file |
| `running` | En cours | Webhook en vol |
| `success` | Envoyée | n8n OK + cache écrit |
| `skipped` | Déjà en mémoire | Cache hit à l’enqueue |
| `failed` | Échec | Après `MAX_ATTEMPTS` |
| `cancelled` | Annulée | Cancel utilisateur / quota |

Aperçu preview (sans campagne) : `to_send` | `cached`.

## Worker async

- Thread daemon `search-queue` : `start_background_worker()`.
- Lock fichier `.search_queue_worker.lock` (un seul worker).
- Boucle : `run_queue_tick()` → `process_next_queue_item()` puis wait `SEARCH_QUEUE_TICK_SECONDS` (défaut **5 s**).
- Gap entre webhooks : `SEARCH_QUEUE_GAP_SECONDS` (défaut **60 s**, overridable settings DB).
- Timeout HTTP n8n : `SEARCH_QUEUE_TIMEOUT` (défaut **120 s**).
- Retry : jusqu’à `SEARCH_QUEUE_MAX_ATTEMPTS` (défaut **3**) ; sinon `failed`.
- Items `running` trop vieux → re-queue / fail (`SEARCH_QUEUE_RUNNING_STALE_SECONDS` ≈ timeout + 90).

Sélection item : plus ancien `pending` dont `users.search_queue_paused = 0` et `search_enabled = 1`.

Quota : si `analysis_remaining <= 0` → cancel pending + force pause.

## Polling client (web)

```
startQueuePolling(campaignId):
  toutes les 5 s :
    GET /api/search-queue/status?campaign_id=&email=
    GET /api/search-queue/state?email=
  stop si status ∈ {completed, completed_with_errors}
       ou (pending_count == 0 && done_count >= total)
```

Au mount : `fetchSearchQueueState` pour reprendre une campagne active matching le fingerprint courant.

## Preview & auto-launch

1. Résoudre zones → `POST /api/search-queue/preview`.
2. Si `scope_items` avec `status: "to_send"` et pas de campagne active → auto-launch après 700 ms (désactivé en `wizardMode`).
3. Changement de critères → `POST /api/search-queue/cancel` (`reason: "criteria_changed"`).

## Pause

`PATCH /api/search-queue/pause` `{ email, paused: true|false }` → colonne `users.search_queue_paused`.

Le worker ignore les users en pause ; la campagne reste en `pending`/`running` jusqu’à reprise.

## Flags env

| Variable | Défaut | Rôle |
|----------|--------|------|
| `SEARCH_QUEUE_ENABLED` | `1` | `/api/send` enqueue au lieu d’appels sync |
| `SEARCH_QUEUE_WORKER_ENABLED` | `1` | Démarre le thread |
| `SEARCH_QUEUE_TICK_SECONDS` | `5` | Période scheduler |
| `SEARCH_QUEUE_GAP_SECONDS` | `60` | Espacement webhooks |
| `SEARCH_APE_BATCH_SIZE` | `2` | Codes par item |
| `SEARCH_CACHE_DAYS` | `30` | Dédup |
| `DEFAULT_SEARCH_ANALYSIS_LIMIT` | `1000` | Quota |

## Port iOS

- Afficher jauge : `done_count / total`, `progress_pct`, liste `scope_items`.
- Background : `BGAppRefresh` / push serveur quand item success (idéalement webhook → push) ; à défaut polling moins agressif (15–30 s) en foreground.
- Exposer Pause / Reprendre / Annuler comme sur le web.
- Si `response_kind: "cached"` : message « déjà traité » + CTA modifier zones/APE.
- Sur kill app : la file **continue côté serveur** ; au retour, `GET …/state` restaure l’UI.
