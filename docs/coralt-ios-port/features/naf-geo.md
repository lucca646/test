# NAF / APE & géographie

Sources : `nafCodes.js`, `geoCatalog.js`, `geoZones.js`, `naf_ai_pipeline.py`, `rag_search.py`, routes search.

## Codes NAF / APE

### Format client

- Stockage user : string `"62.01Z, 62.02A"` (`search_naf_codes`).
- Helpers : `parseNafCodes` / `formatNafCodes` / `toggleNafCode` (upper, split `[,;]`).

### Suggestion manuelle

`GET /api/naf-suggest?secteur=`

Réponse :

```json
{
  "status": "success",
  "query": "…",
  "corrected_query": "…",
  "suggestions": [
    { "code": "62.01Z", "label": "…", "source": "rag|ai|local|…" }
  ],
  "lexical_tokens": [],
  "rag_enabled": true
}
```

Pipeline : correction IA (DeepSeek, timeout court) + RAG vectoriel + lexical local.

### Thèmes onboarding

`POST /api/naf-onboarding-themes` `{ "profile_text": "…" }`

```json
{
  "themes": [
    { "theme": "logiciel", "items": [{ "code": "62.01Z", "label": "…" }] }
  ]
}
```

3–4 mots-clés IA puis recherche NAF parallèle par thème.

### Analyse profil → codes

Priorité dans `_run_search_profile_analysis` :

1. Script / bridge **APE RAG** (`rag_search.chercher_codes_ape_profil` / `ape_rag.web_bridge`).
2. Sinon erreur → suggestions vides + `ape_pipeline.mode: "rag_error"`.

Le module legacy `naf_ai_pipeline.analyze_profile_ape_codes` (triple IA analyste A/B + juge) reste disponible pour d’autres chemins / fallbacks.

Sortie analyse :

```json
{
  "secteur_principal": "…",
  "professions": ["…"],
  "themes": ["…"],
  "suggestions": [{ "code": "…", "label": "…", "source": "…" }],
  "naf_codes": ["…"],
  "ape_pipeline": { "mode": "…", "rejected": [] },
  "geo": { "label": "", "query": "", "patterns": [], "ville": "" }
}
```

Validation humaine obligatoire avant lancement (`onboarding_ape_validated`).

## Géographie

### Modèle multi-zones (UI)

Kinds : `city` | `department` | `region`.

Rayons ville (`GEO_RADIUS_OPTIONS`) : `0 | 10 | 20 | 50 | 100` km (distance réelle via geo.gouv.fr).

Item zone :

```json
{
  "id": "gz-…",
  "geo_kind": "city",
  "geo_code": "",
  "geo_name": "Lorient",
  "geo_postal_code": "56100",
  "geo_radius_km": 20,
  "geo_label": "Autour de Lorient (20 km)"
}
```

Resolve body (API) :

```json
{
  "kind": "city",
  "code": "",
  "name": "Lorient",
  "postal_code": "56100",
  "radius_km": 20
}
```

Multi : `{ "zones": [ … ] }`.

### Motifs postaux (file / n8n)

| Type | Exemple pattern | Inférence |
|------|-----------------|-----------|
| Ville | `56100` | 5 chiffres |
| Agglomération | `293*` | 3 chiffres + `*` |
| Département | `29*` | 2 chiffres + `*` |
| Zone | autre | fallback |

`ville` campagne / item = motif(s) exploités par n8n (souvent le pattern lui-même).

### APIs geo

| Endpoint | Rôle |
|----------|------|
| `GET /api/geo-zones/catalog` | `{ departments: [{code,name,norm}], regions: [{code,name,dept_count}] }` |
| `GET /api/geo-zones/communes?q=` | Autocomplete (≥2 car.) via geo.api.gouv.fr |
| `POST /api/geo-zones/resolve` | Texte libre **ou** structured **ou** batch `zones` |

Réponse resolve (succès typique) :

```json
{
  "status": "success",
  "label": "…",
  "query": "…",
  "patterns": [
    { "pattern": "293*", "type": "agglomeration", "label": "…", "place_name": "Lorient" }
  ],
  "ville": "293*"
}
```

### Régions connues (frontend + backend)

Clés : `bretagne`, `pays de la loire`, `ile de france`, `normandie`, `nouvelle aquitaine`, `occitanie`, `hauts de france`, `grand est`, `provence alpes cote d azur`, `centre val de loire`, `bourgogne franche comte`, `auvergne rhone alpes` — chacune dépliée en motifs départementaux `XX*`.

## Port iOS

- Sélecteurs natifs : région → départements ; ville + slider rayon.
- Toujours appeler **resolve** avant send/preview (ne pas inventer les patterns).
- Afficher chips `formatZoneChipLabel` ; garder `geo_zones_list` dans le profil JSON.
- NAF : multi-select + recherche `naf-suggest` ; conserver la validation humaine post-analyse.
