# Page Landing (`LandingPage`)

Documentation pour le port iOS (JS) — présentation marketing COR·ALT.

## Route

| Élément | Valeur |
|--------|--------|
| Path | `/presentation` |
| Fichier | `frontend/src/pages/LandingPage.jsx` |
| Auth | **Publique** — accessible connecté ou non (hors `ActivationGate`) |

Ancres internes : `#parcours`, `#envois`, `#tarifs` (composant `LandingPricing`).

## Gates

- Aucun gate d’auth strict : route toujours montée.
- Si `user` connecté **et** `isAccountActivated(user)` après `refreshUser()` → `window.location.replace("/entreprises")`.
- Bannière activation si `user && !activated` → lien « Reprendre l'inscription » → `/recherche`.

## États UI / CTAs dynamiques

`sessionLink` selon session :

| Condition | Destination | Label |
|-----------|-------------|-------|
| Non connecté | `/connexion?mode=register&return_to=/presentation` | Créer un compte |
| Connecté, non activé | `/recherche` | Continuer l'inscription |
| Connecté, activé | `/entreprises` | Accéder à l'app |

Hero primaire :

- Non activé (avec session) → Continuer l'inscription `/recherche`
- Sinon → Créer un compte `/connexion?mode=register`

Pricing (`LandingPricing`) : `registerTo` = `/recherche` si session non activée, sinon `/connexion?mode=register&return_to=/presentation`.

Footer : register + login (`/connexion`) si anonyme.

## Appels API

| Quand | API | But |
|-------|-----|-----|
| Mount (si `user.email`) | `POST /api/auth/me` via `refreshUser` | Sync activation ; redirect si activé |
| Analytics | PostHog `FEATURE.LANDING` | `page_view`, CTAs (`cta_register`, `hero_get_started`, etc.) |

Pas d’appel Stripe / register depuis la landing elle-même — uniquement navigation.

## localStorage / SecureStore

Aucun écriture dédiée. Lit le contexte `AuthContext` (cache session + config déjà chargés au boot).

## Flux utilisateur

```mermaid
flowchart TD
  A[/presentation] --> B{Session?}
  B -->|non| C[CTA Créer un compte → /connexion?mode=register]
  B -->|oui non activé| D[Bannière + CTA → /recherche]
  B -->|oui activé| E[Redirect /entreprises]
  C --> F[Auth puis return_to=/presentation ou /recherche]
  D --> G[Onboarding + PlanPicker + Stripe]
```

### Sections contenu (référence UI)

1. Hero — headline candidatures automatiques + CTAs
2. Parcours — 4 étapes (`LandingStepsPath`)
3. Envoi par carte — démo swipe (`LandingSwipeDemo`)
4. Tarifs — `LandingPricing`
5. Showcase image workflow
6. CTA band final + footer brand coraia

## Port iOS

- Écran marketing optionnel (WebView ou écran natif simplifié) ; le cœur du port est Auth → Onboarding → Plans.
- Reproduire la logique de CTA selon `user` / `account_activated`.
- Deep link `coralt://presentation` ou Universal Link `/presentation` si besoin marketing.
- Analytics : équivalent events Landing (optionnel).
- Lien externe `https://coraia.eu` (byline).
