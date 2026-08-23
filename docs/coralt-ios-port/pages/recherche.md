# Page Recherche (`/recherche`) — ConsolePage

Surface principale de prospection entreprises. Sur le web : `frontend/src/pages/ConsolePage.jsx` (route `/recherche`, alias historique `/console`).

## Rôle

1. Questionnaire d’onboarding multi-étapes (plein écran via `SearchLayoutContext`).
2. Profil de recherche persisté (`search_domain`, `search_profile_json`, codes NAF, zones).
3. Lancement d’une campagne **APE × zone** via `POST /api/send` → file d’attente → webhook n8n.
4. Suivi de progression (polling 5 s) + pause / reprise / annulation.

## États UI majeurs

| État | Signification |
|------|----------------|
| `wizardMode` | Questionnaire fullscreen ouvert |
| `profileReady` | Texte profil + ≥1 code APE validés |
| `hasGeoConfigured` | Au moins une zone dans `geo_zones_list` |
| `canLaunch` | `profileReady && hasGeoConfigured && nafCodes.length > 0` |
| `queueProgress` / `activeCampaignId` | Campagne suivie |
| `queuePaused` / `workerRunning` | Depuis `GET /api/search-queue/state` |
| `scopePreview` | Jauge APE×zone sans lancer (`/preview`) |
| `allCombinationsCached` | Rien de nouveau à envoyer |

## Flux utilisateur (résumé)

```
Premier accès / compte non activé
  → shouldAutoOpenOnboarding → wizard
  → étapes identity…ape_validation (+ plan si non activé)
  → compose (skip_ape) → analyze APE → validation humaine
  → persistProfile + sortie wizard

Console « au repos »
  → éditer profil / zones / codes APE
  → preview auto (debounce) → auto-launch si manques
  → ou bouton « Lancer » → POST /api/send
  → polling status jusqu’à completed*
```

## Constantes frontend

- `TAILLE_MIN = 5`, `TAILLE_MAX = 1000` (effectif entreprises, envoyé à n8n).
- Polling file : **5 000 ms**.
- Auto-launch après preview : délai **700 ms** si critères éligibles.

## Payload lancement (identique manuel / auto)

```json
{
  "secteur": "…",
  "ville": "29*,22*",
  "geo_patterns": [{ "pattern": "29*", "type": "department", "label": "…" }],
  "geo_query": "autour de Lorient (20 km)",
  "geo_label": "Lorient et alentours",
  "code": "62.01Z, 62.02A",
  "codes": ["62.01Z", "62.02A"],
  "profil_candidat": "Je recherche…",
  "taille_min": 5,
  "taille_max": 1000,
  "email": "user@example.com",
  "name": "Prénom Nom",
  "gsheet_url": "https://docs.google.com/spreadsheets/d/…/edit"
}
```

Réponse typique file activée : `response_kind: "queued" | "cached"`, `campaign_id`, compteurs `pending_count` / `total` / `progress_pct`.

## Persistance profil (champs user)

| Champ | Usage |
|-------|--------|
| `search_domain` | Texte profil (présentation) |
| `search_naf_codes` | `"62.01Z, 62.02A"` |
| `search_geo_zones` | Motifs CP concaténés (`ville` résolu) |
| `search_profile_json` | JSON riche (onboarding, ape_groups, geo_patterns, …) |
| `competence_highlight` | Phrase compétences mailing |
| `gsheet_url` | Sheet prospects |
| `search_enabled` | Kill-switch admin |
| `search_queue_paused` | Pause utilisateur |
| `search_analysis_limit` | Quota analyses / requêtes |

Structure `search_profile_json` (extrait) :

```json
{
  "secteur_principal": "…",
  "professions": ["…"],
  "themes": ["…"],
  "onboarding": { "prenom": "…", "geo_zones_list": [], "skills_list": [] },
  "geo_query": "…",
  "geo_label": "…",
  "geo_patterns": [{ "pattern": "293*", "type": "agglomeration" }],
  "ape_groups": [{ "theme": "logiciel", "items": [{ "code": "62.01Z", "label": "…" }] }],
  "suggestions": [],
  "ape_rejected": [],
  "onboarding_ape_validated": true
}
```

## Layout

`SearchLayoutProvider` expose `onboardingFullscreen` / `setOnboardingFullscreen` pour masquer le chrome (dock / nav) pendant le wizard.

## Port iOS — points d’attention

- Remplacer `localStorage` onboarding (`coralt_onboarding_*`) par **AsyncStorage / SecureStore**.
- Wizard = stack de screens ou pager ; garder les **mêmes step ids** et validations.
- Notifications push recommandées quand `campaign_status` passe à `completed` / `completed_with_errors` (le web ne fait que poller).
- Auto-launch : optionnel sur mobile (batterie / data) — préférer lancement explicite + badge progression.
- OAuth Gmail pendant l’étape `extras` : reprendre via `pendingOAuth` + deep link `?gmail=connected` (voir onboarding).

## Fichiers source (COR·ALT)

- `frontend/src/pages/ConsolePage.jsx`
- `frontend/src/api/console.js`, `skills.js`
- `frontend/src/context/SearchLayoutContext.jsx`
- `coralt_web/routes/search.py`
