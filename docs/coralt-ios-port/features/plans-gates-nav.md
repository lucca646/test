# Plans, gates et navigation

Sources : `frontend/src/utils/planAccess.js`, `accountActivation.js`, `layout/navConfig.js`, `layout/AppShell.jsx`, `App.jsx`.

## Plans produit

| Plan | Titre (activation) | Capacités clés |
|------|--------------------|----------------|
| 1 | Essentiel | Recherche + liste entreprises (nom/adresse) |
| 2 | Avancé | + contacts (email/tél), infos enrichies, bascule statut manuelle |
| 3 | Complet | + mailing IA, Gmail, onglet Envois (swipe) |

Prix UI (référence) : 60/80/90 € once ou 20/35/40 € / mois — `ACTIVATION_PLANS`.

Comparaison features : `PLAN_COMPARISON_ROWS` (`minPlan` par ligne).

## Helpers `planAccess.js`

| Export | Seuil | Effet |
|--------|-------|--------|
| `PLAN_MAILING_MIN` / `hasMailingAccess` | plan ≥ 3 | Mailing, CV/Gmail setup, mails générés, bouton Vérifier |
| `PLAN_ENVOIS_MIN` / `hasEnvoisAccess` | plan ≥ 3 | Onglet Envois |
| `entreprisesHideFilterTabs` | plan ≤ 1 | Pas de barre d’onglets filtres |
| `entreprisesHideSentTab` | plan < 2 | Pas d’onglet « Envoyé » |
| `entreprisesCanToggleContactStatus` | plan === 2 | Toggle manuel À contacter ↔ Envoyé |
| `entreprisesShowGeneratedMail` / `entreprisesShowVerifyButton` | plan ≥ 3 | Contenu / actions mailing |

## Activation compte

`isAccountActivated(user)` : admin toujours activé ; sinon `account_activated` truthy.

`ActivationGate` (`App.jsx`) : tant que non activé, seules `/recherche` (et alias `/console`) sont accessibles ; le reste redirige vers `/recherche`.

## Navigation (`navConfig.js`)

| Route | Label | Filtre |
|-------|-------|--------|
| `/entreprises` | Entreprises | `minPlan: 1` |
| `/recherche` | Recherche | `minPlan: 1` |
| `/parametres` | Paramètres | `minPlan: 1` |
| `/mailing` | Mailing | `minPlan: PLAN_MAILING_MIN` (3) |
| `/envois` | Envois | `envoisOnly` → `hasEnvoisAccess` |
| `/admin` | Administration | `adminOnly` → `isAdmin` |

`getNavItemsForUser(user, { isAdmin })` alimente sidebar desktop + bottom-nav mobile (`AppShell`).

## Gates React (`App.jsx`)

| Gate | Condition | Sinon |
|------|-----------|--------|
| `Plan3Gate` | `hasMailingAccess` | → `/recherche` |
| `EnvoisGate` | `hasEnvoisAccess` | → `/recherche` |
| `AdminGate` | `user && isAdmin` | → `/recherche` |
| `ActivationGate` | activé ou questionnaire recherche | → `/recherche` |
| `PlansGate` | admin (preview) ou non activé | activé non-admin → app |

## Shell

- Desktop : sidebar marque COR·ALT, plan affiché, nav filtrée, déconnexion.
- Mobile : topbar + `bottom-nav` mêmes items.
- Prefetch idle/hover des chunks pages accessibles.

## Port iOS (MVP)

- Reproduire les **mêmes seuils plan** et l’activation avant d’ouvrir Mailing / Envois.
- **Admin hors MVP** — ne pas afficher l’onglet Administration.
- Auth cible : Bearer (voir [http-client](../api/http-client.md)) ; le web filtre encore via session + `user.plan` / `is_admin` renvoyés par `/api/auth/me`.
