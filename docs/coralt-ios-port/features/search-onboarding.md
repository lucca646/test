# Onboarding recherche — questionnaire multi-étapes

Source : `frontend/src/utils/searchOnboarding.js`, orchestration dans `ConsolePage.jsx`, reprise OAuth dans `onboardingResumeBridge.js`.

## Quand ouvrir le wizard

`shouldAutoOpenOnboarding(user)` → `true` si :

1. Compte **non admin** et **non activé** (`isAccountActivated` faux), **ou**
2. Aucun code NAF (`parseNafCodes(user.search_naf_codes).length === 0`) **et** l’utilisateur n’a pas dismissé.

Dismiss local : clé `coralt_onboarding_dismissed_v1_{email}` = `"1"`.

## Étapes (`ONBOARDING_STEPS`)

Ordre de base (`getQuestionnaireSteps`) — l’étape `extras` n’apparaît que si `hasCvGmailSetup` :

| # | `id` | Titre | Contenu | Validation (`isOnboardingStepValid`) |
|---|------|-------|---------|--------------------------------------|
| 1 | `identity` | Vous | `prenom`, `nom` | Les deux non vides |
| 2 | `duration` | Votre recherche | `search_duration` (+ optionnels `formation`, `ecole_accueil`, `contract_start`) | `search_duration` requis |
| 3 | `contract` | Type de contrat | `contract_type` | Requis |
| 4 | `job` | Métier visé | `job_target` | ≥ 3 caractères |
| 5 | `skills` | Compétences | `skills_list[]` et/ou `skills_highlight` | Liste non vide **ou** draft vide **ou** draft ≥ 5 car. |
| 6 | `geo` | Zone géographique | `geo_zones_list[]` (multi-zones) | `hasGeoZonesList` |
| 7 | `extras` | CV & Google | Upload CV / OAuth Gmail (facultatif) | Toujours OK |
| 8 | `summary` | Votre profil | Compose IA → texte présentation | Toujours OK (génération async) |
| 9 | `ape_validation` | Activités ciblées | Analyse APE + sélection humaine | Toujours OK côté step ; lancement exige codes |

Si compte **non activé**, `getOnboardingSteps` ajoute en fin :

| `id` | Titre | Rôle |
|------|-------|------|
| `plan` | Votre formule | Choix offre / activation (`ONBOARDING_PLAN_STEP`) |

### Options durée

```
less_than_1_month | 1_to_3_months | 3_to_6_months | more_than_6_months
```

### Options contrat

```
alternance | stage | cdi | cdd | premiere_experience
```

## Objet `answers` (état wizard)

```json
{
  "prenom": "",
  "nom": "",
  "search_duration": "",
  "formation": "",
  "ecole_accueil": "",
  "contract_start": "",
  "contract_type": "",
  "job_target": "",
  "skills_highlight": "",
  "skills_list": [],
  "company_types": "",
  "geo_query": "",
  "geo_kind": "",
  "geo_code": "",
  "geo_name": "",
  "geo_postal_code": "",
  "geo_radius_km": 20,
  "geo_label": "",
  "geo_zones_list": [
    {
      "id": "gz-…",
      "geo_kind": "city",
      "geo_code": "",
      "geo_name": "Lorient",
      "geo_postal_code": "56100",
      "geo_radius_km": 20,
      "geo_label": "Autour de Lorient (20 km)"
    }
  ]
}
```

Stocké dans `search_profile_json.onboarding` après hydratation (`hydrateGeoZonesInAnswers`).

## Pipeline IA par étape critique

### Skills (`skills`)

- Saisie phrase → `POST /api/skills/extract-tags` `{ text, job_target }` → `skills: string[]`.
- Cache mémoire côté client (`skills.js`).

### Summary (`summary`)

- `composeSearchProfile(answers, { email, skipApe: true })` → `POST /api/search-profile/compose`.
- Timeout client : **90 s** si `skip_ape`, sinon **240 s**.
- Effets : texte `text`, `onboarding` enrichi (`skills_mail_phrase`, `skills_list`), éventuellement `geo`, `default_template`, `competence_highlight`.
- Persist : `search_domain` + `search_profile_json` (sans codes APE encore).

### APE (`ape_validation`)

- `analyzeSearchProfile(profileText, { fast: true })` → `POST /api/search-profile/analyze`.
- UI : groupes / suggestions / rejetés ; utilisateur coche les codes.
- `handleFinishWizard` → `persistWizardProfile` avec `onboarding_ape_validated: true`, `search_naf_codes`, `ape_groups`.
- Sur submit depuis cette étape : finish puis `handleSendWebhook` si `canLaunch`.

## Reprise / OAuth

Clé resume : `coralt_onboarding_resume_v1_{email}` (TTL **1 h**).

```json
{
  "stepIndex": 6,
  "stepId": "extras",
  "answers": {},
  "savedAt": 1710000000000,
  "pendingOAuth": true,
  "returnPath": "/recherche"
}
```

- `publishOnboardingSnapshot` : snapshot mémoire avant redirect.
- `markOnboardingOAuthPending` : force `pendingOAuth`.
- Restauration si `?gmail=connected` et `pendingOAuth`.

Chemins OAuth acceptés : `/recherche`, `/console`.

## Backend compose — champs normalisés

`search_profile_compose.normalize_answers` ne garde que :

`prenom`, `nom`, `search_duration`, `formation`, `ecole_accueil`, `contract_type`, `job_target`, `skills_highlight` (dérivé de `skills_list`), `company_types`, `geo_query`, `contract_start`.

Les zones structurées restent côté client dans `search_profile_json` ; `geo_query` agrège les libellés pour l’analyse.

## Port iOS

- Pager / `NavigationStack` avec barre de progression (même ids).
- Persister draft answers localement à chaque step (équivalent resume).
- `extras` : SFSafariViewController / ASWebAuthenticationSession pour Gmail.
- Sur `plan` : deep link paiement / Sheet Stripe existant.
- Après `ape_validation` : ne pas bloquer si l’utilisateur veut seulement sauvegarder sans lancer la file.
- Notifications : « Profil prêt » / « Activités à valider » optionnelles ; plus critique pour la **file** (voir `search-queue.md`).
