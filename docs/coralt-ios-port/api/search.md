# API Recherche — contrats exacts

Blueprint Flask `search_bp` (`coralt_web/routes/search.py`). Auth : session / email utilisateur (`require_user_email()`). Client : `frontend/src/api/console.js`, `skills.js`.

Toutes les réponses d’erreur suivent en général `{ "status": "error", "message": "…" }` + HTTP 4xx/5xx.

---

## NAF

### `GET /api/naf-suggest`

**Query :** `secteur` (string)

**Réponse 200 :**

```json
{
  "status": "success",
  "query": "naval",
  "corrected_query": "construction navale",
  "ai_keys_loaded": { "openai": true, "deepseek": true },
  "rag_enabled": true,
  "rag_error": null,
  "lexical_tokens": ["…"],
  "suggestions": [
    { "code": "30.11Z", "label": "Construction de navires…", "source": "rag" }
  ]
}
```

### `POST /api/naf-onboarding-themes`

**Body :**

```json
{ "profile_text": "Je cherche une alternance en développement logiciel…" }
```

**Réponse :** `{ "themes": [ { "theme": "logiciel", "items": [ { "code": "62.01Z", "label": "…" } ] } ] }`  
(si texte &lt; 10 car. → `themes: []`)

---

## Skills

### `POST /api/skills/extract-tags`

**Body :**

```json
{ "text": "Je maîtrise React et Python", "job_target": "développeur web" }
```

**Réponse 200 :** `{ "status": "success", "skills": ["React", "Python"] }`  
**400 :** texte &lt; 2 car. ou aucune compétence.

---

## Profil de recherche

### `POST /api/search-profile/compose`

**Body :**

```json
{
  "answers": {
    "prenom": "Lucca",
    "nom": "Rouxel",
    "search_duration": "1_to_3_months",
    "formation": "Master Info",
    "ecole_accueil": "…",
    "contract_type": "alternance",
    "contract_start": "",
    "job_target": "développeur",
    "skills_highlight": "React, Python",
    "skills_list": ["React", "Python"],
    "company_types": "",
    "geo_query": "autour de Lorient (20 km)"
  },
  "email": "user@example.com",
  "skip_ape": true
}
```

**Réponse 200 (extrait) :**

```json
{
  "status": "success",
  "text": "Je recherche une alternance…",
  "onboarding": { "…": "…", "skills_mail_phrase": "…", "skills_list": [] },
  "secteur_principal": "",
  "professions": [],
  "themes": [],
  "suggestions": [],
  "naf_codes": [],
  "ape_pipeline": { "mode": "skipped" },
  "geo": { "label": "…", "query": "…", "patterns": [], "ville": "…" },
  "competence_highlight": "…",
  "default_template": { "template_id": 123, "skills_mail_phrase": "…" }
}
```

Timeouts client : 90 s (`skip_ape`) / 240 s (APE inclus).

### `POST /api/search-profile/analyze`

**Body :**

```json
{
  "text": "Je recherche une alternance en…",
  "geo_query": "Pays de la Loire",
  "fast": true,
  "skip_ape": false
}
```

**Réponse 200 :** `{ "status": "success", …analysis }` (voir `naf-geo.md`).  
**400** si texte &lt; 8 car. ; **503** si analyse interrompue.

---

## Geo

### `GET /api/geo-zones/catalog`

```json
{
  "status": "success",
  "departments": [{ "code": "56", "name": "Morbihan", "norm": "…" }],
  "regions": [{ "code": "bretagne", "name": "Bretagne", "dept_count": 4 }]
}
```

### `GET /api/geo-zones/communes?q=`

```json
{ "status": "success", "communes": [ { "nom": "Lorient", "code": "…", "codesPostaux": ["56100"], "…": "…" } ] }
```

### `POST /api/geo-zones/resolve`

Trois formes de body :

```json
{ "query": "autour de Lorient 20 km" }
```

```json
{
  "kind": "city",
  "code": "",
  "name": "Lorient",
  "postal_code": "56100",
  "radius_km": 20
}
```

```json
{
  "zones": [
    { "kind": "department", "code": "56", "name": "Morbihan" },
    { "kind": "city", "name": "Nantes", "postal_code": "44000", "radius_km": 10 }
  ]
}
```

**Réponse succès :** `{ "status": "success", "label", "query", "patterns": [...], "ville": "…" }`

---

## Lancement recherche

### `POST /api/send`

**Body (client actuel) :**

```json
{
  "secteur": "Développement logiciel",
  "ville": "293*",
  "geo_patterns": [
    { "pattern": "293*", "type": "agglomeration", "label": "Agglomération de Lorient" }
  ],
  "geo_query": "autour de Lorient (20 km)",
  "geo_label": "Lorient et alentours",
  "code": "62.01Z, 62.02A",
  "codes": ["62.01Z", "62.02A"],
  "profil_candidat": "Je recherche…",
  "taille_min": 5,
  "taille_max": 1000,
  "email": "user@example.com",
  "name": "Prénom Nom",
  "phone": "",
  "gsheet_url": "",
  "sheet_id": "",
  "plan": 3
}
```

Notes serveur :

- `gsheet_url` / `plan` / `search_enabled` relus depuis la BDD si email connu.
- Si `SEARCH_QUEUE_ENABLED` : enqueue, **pas** d’appel n8n synchrone.

**Réponse file (200) :**

```json
{
  "status": "success",
  "response_kind": "queued",
  "accepted": true,
  "queued": true,
  "campaign_id": 42,
  "message": "3 nouvelle(s) requête(s) planifiée(s).",
  "total": 5,
  "success_count": 0,
  "failed_count": 0,
  "skipped_count": 2,
  "pending_count": 3,
  "progress_pct": 40.0,
  "queued_new": 3,
  "skipped_cache": 2,
  "reused": false,
  "gsheet_url": "…",
  "sheet_id": "…"
}
```

Autres `response_kind` : `cached` (tout déjà fait), éventuellement réutilisation campagne `pending`/`running`.

**Erreurs :** `400` zone invalide / enqueue error ; `403` `search_disabled` ; `503` check compte échoué.

---

## File d’attente

### `GET /api/search-queue/status?campaign_id=&email=`

**Réponse :**

```json
{
  "status": "success",
  "campaign": {
    "id": 42,
    "user_email": "…",
    "fingerprint": "…",
    "geo_query": "…",
    "geo_label": "…",
    "naf_codes": ["62.01Z"],
    "status": "running",
    "total": 5,
    "success_count": 1,
    "failed_count": 0,
    "skipped_count": 1,
    "cancelled_count": 0,
    "pending_count": 3,
    "progress_pct": 40.0,
    "done_count": 2,
    "scope_items": [
      {
        "geo_label": "…",
        "postal_code": "",
        "ville": "293*",
        "ape_codes": ["62.01Z", "62.02A"],
        "ape_label": "62.01Z, 62.02A",
        "status": "pending",
        "status_label": "À envoyer",
        "request_sent": false
      }
    ],
    "profil_candidat": "…"
  }
}
```

### `GET /api/search-queue/state?email=`

```json
{
  "status": "success",
  "queue_enabled": true,
  "worker_running": true,
  "search_queue_paused": false,
  "search_enabled": true,
  "search_analysis_limit": 1000,
  "analyzed_companies_count": 12,
  "analysis_remaining": 988,
  "analysis_limit_reached": false,
  "gap_seconds": 60,
  "campaign": { "…": "…" },
  "has_active_campaign": true,
  "all_combinations_cached": false,
  "search_complete": false
}
```

### `POST /api/search-queue/preview`

**Body :** même famille que send (`codes`/`code`, `geo_patterns`, `geo_query`, `ville`, `taille_*`).

**Réponse :**

```json
{
  "status": "success",
  "preview": true,
  "fingerprint": "…",
  "targets_count": 2,
  "naf_codes_count": 4,
  "all_combinations_cached": false,
  "search_complete": false,
  "to_launch_count": 3,
  "total": 4,
  "pending_count": 3,
  "skipped_count": 1,
  "progress_pct": 25.0,
  "done_count": 1,
  "scope_items": [
    { "status": "to_send", "status_label": "À envoyer", "ape_codes": [], "ville": "29*" }
  ]
}
```

### `PATCH|POST /api/search-queue/pause`

```json
{ "email": "user@example.com", "paused": true }
```

→ `{ "status": "success", "search_queue_paused": true }`

### `POST /api/search-queue/cancel`

```json
{ "email": "user@example.com", "reason": "criteria_changed" }
```

→ `{ "status": "success", "cancelled_items": 3, "campaign_ids": [42] }`

---

## Port iOS

Réutiliser ces contrats sans adapter le schéma ; typage TypeScript recommandé à partir de ce fichier. Timeouts compose/analyze longs : afficher un état « génération en cours » et éviter les doubles submits.
