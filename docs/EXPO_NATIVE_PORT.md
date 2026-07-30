# COR·ALT → application native Expo Go

Doc de portage hébergée dans ce repo (`lucca646/test`).  
Code source COR·ALT de référence : repo **COR-ALT** (`frontend/` + `coralt_web/`).  
Playground Expo déjà présent ici : [`mobile/`](../mobile).

**Étape 1** : cartographie web + relations API — faite.  
**Plan validé** (2026-07-30) :

| Décision | Choix |
|----------|--------|
| MVP v1 | Auth · Recherche · Entreprises · Envois · Paramètres |
| Hors MVP v1 | Landing, Admin, Mailing avancé (templates/prompts) |
| Auth mobile | **Bearer token** (backend COR-ALT à étendre) |
| Cible API v1 | **dev** (`dev.cal.coraia.eu`) en priorité |
| Où coder Expo | ce repo → `mobile/` (ou app dédiée `coralt-mobile/` si séparation) |

| Champ | Valeur |
|-------|--------|
| Source web | COR-ALT : `frontend/` (React + Vite) + `coralt_web/` (Flask) |
| Client HTTP | `frontend/src/api/http.js` → `apiFetch` (`credentials: "include"`) |
| Auth web | Cookie HttpOnly `coralt_session` (+ cache `localStorage` `coralt_session_v2`) |

---

## 1. Vue d’ensemble

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend React (Vite)                                      │
│  App.jsx + AppShell + pages/* + api/*                       │
│  Session cookie · PostHog · liquid-glass bottom nav         │
└───────────────────────────┬─────────────────────────────────┘
                            │ /api/* (proxy Vite → Flask)
┌───────────────────────────▼─────────────────────────────────┐
│  Flask coralt_web                                           │
│  auth · search · plan3 · payments · admin · entreprises-db  │
│  SQLite users + workers (enrichissement, search-queue…)     │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
     Google OAuth      Stripe/Revolut    email_sender
     (Gmail/Sheets)    (checkout)        (:8020)
```

### Stack

| Couche | Techno | Emplacements clés |
|--------|--------|-------------------|
| UI | React 18, React Router 6, CSS custom | `frontend/src/pages/`, `layout/`, `styles/` |
| État | `AuthContext`, `SearchLayoutContext`, localStorage | `frontend/src/context/` |
| API client | Modules par domaine | `frontend/src/api/*.js` |
| Backend | Flask blueprints | `coralt_web/routes/` |
| Plans | Gates UI + helpers | `frontend/src/utils/planAccess.js` |

### Plans produit

| Plan | Accès typique |
|------|----------------|
| 1 | Entreprises (liste), Recherche, Paramètres (profil) |
| 2 | + contacts enrichis / suivi statut manuel |
| 3 | + Mailing, Envois (swipe), CV, Gmail |
| Admin | `/admin` si `user.is_admin` |

Activation compte : `account_activated` (ou admin). Sinon l’utilisateur est forcé vers `/recherche` (questionnaire + paiement).

---

## 2. Navigation & gates

Fichiers : `frontend/src/App.jsx`, `frontend/src/layout/navConfig.js`.

### Routes publiques / pré-session

| Route | Page | Rôle |
|-------|------|------|
| `/`, `/connexion` | `AuthPage.jsx` | Login / inscription |
| `/presentation` | `LandingPage.jsx` | Marketing (hors MVP mobile) |
| `/plans` | `ActivationPage.jsx` | Aperçu forfaits (surtout admin) |

### Routes authentifiées (dans `AppShell`)

| Route | Page | minPlan / gate |
|-------|------|----------------|
| `/entreprises` | `EntreprisesPage.jsx` | Plan ≥ 1 |
| `/recherche` (`/console` → redirect) | `ConsolePage.jsx` | Plan ≥ 1 ; **seule** route OK si non activé |
| `/parametres` | `SettingsPage.jsx` | Plan ≥ 1 |
| `/mailing` | `MailingPage.jsx` | Plan ≥ 3 (`Plan3Gate`) |
| `/envois` | `EmailSwipePage.jsx` | Plan ≥ 3 (`EnvoisGate`) |
| `/admin` | `AdminPage.jsx` | `is_admin` |

### Gates (à reproduire en Expo)

1. **Pas de user** → écran Auth.  
2. **User non activé** → uniquement Recherche (onboarding + checkout).  
3. **Plan &lt; 3** → masquer / bloquer Mailing & Envois.  
4. **Admin** → écran Admin optionnel.

Nav bottom web : `getNavItemsForUser(user)` filtre les onglets selon le plan.

---

## 3. Carte écrans ↔ API ↔ backend

### 3.1 Auth — `AuthPage`

| Action UI | Client API | Endpoint | Backend |
|-----------|------------|----------|---------|
| Connexion | `api/auth.js` → `apiLogin` | `POST /api/auth/login` | `coralt_web/routes/auth.py` |
| Inscription | `apiRegister` | `POST /api/auth/register` | idem |
| Boot / refresh | `apiRefreshUser` | `POST /api/auth/me` | idem |
| Déconnexion | `apiLogout` | `POST /api/auth/logout` | idem |

**Relation** : après login, cookie `coralt_session` ; `AuthContext` hydrate `user` via `/me`.  
**Expo** : aujourd’hui cookie same-origin → **ne fonctionne pas tel quel** depuis Expo Go. Voir §6.

### 3.2 Recherche / onboarding — `ConsolePage` + `SearchOnboardingWizard`

| Action UI | Client | Endpoint | Backend |
|-----------|--------|----------|---------|
| Suggestions NAF | `api/console.js` | `GET /api/naf-suggest` | `routes/search.py` |
| Thèmes onboarding | | `POST /api/naf-onboarding-themes` | idem |
| Catalog geo | | `GET /api/geo-zones/catalog` | idem |
| Communes | | `GET /api/geo-zones/communes` | idem |
| Resolve zones | | `POST /api/geo-zones/resolve` | idem |
| Compose profil | | `POST /api/search-profile/compose` | idem |
| Analyze profil | | `POST /api/search-profile/analyze` | idem |
| Lancer recherche | | `POST /api/send` | idem |
| File APE | | `GET /api/search-queue/status\|state` (+ pause/resume) | idem |
| Skills tags | `api/skills.js` | `POST /api/skills/extract-tags` | `search.py` |
| Settings plan3 | `api/mailing.js` | settings plan3 | `plan3.py` |
| Paiement activation | `api/payments.js` | `POST /api/payments/create-checkout-session` | `payments.py` |
| Vérif session | | `POST /api/payments/verify-session` | idem |
| Demande plan | `api/auth.js` | `POST /api/auth/request-plan` | `auth.py` |

**Flux** : questionnaire → compose/analyze → choix plan → checkout externe → retour URL → `verify-session` → `account_activated` → accès app.

**Expo** : ouvrir Checkout via `WebBrowser` / `Linking` ; deep link `coralt://…` pour le retour.

### 3.3 Entreprises — `EntreprisesPage`

| Action UI | Client | Endpoint | Backend |
|-----------|--------|----------|---------|
| Liste / filtres prospects | `api/mailing.js` | `GET /api/plan3/sheet-prospects` | `plan3.py` |
| Update / statut / note | | `POST …/update`, `…/status`, `…/note-perso`, `…/repondu` | idem |
| Upsert DB entreprises | `api/entreprises.js` | `POST /api/entreprises-db/rows` | `entreprises_db_routes.py` |
| Enrichissement | | `GET/POST /api/enrichment/*` | plan3 / workers |

**Relation** : la « sheet » prospects est le cœur métier partagé avec Envois/Mailing. Le comportement UI dépend du plan (`planAccess.js` : onglets, badge statut, mail généré…).

### 3.4 Envois (swipe) — `EmailSwipePage` + `SwipeDeck`

| Action UI | Client | Endpoint | Backend |
|-----------|--------|----------|---------|
| Deck swipe | `fetchSheetProspects({ for_swipe: 1 })` | `GET /api/plan3/sheet-prospects?for_swipe=1` | `plan3.py` |
| Générer / regen mail | | `POST …/mail` | idem |
| Envoyer | | `POST …/send` | idem |
| MAJ statut | | `POST …/status` etc. | idem |

**Relation** : même source prospects que Entreprises ; UX gestuelle (pointer events web).  
**Expo** : `react-native-gesture-handler` / Reanimated.

### 3.5 Mailing — `MailingPage` (post-MVP recommandé)

| Domaine | Endpoints (via `api/mailing.js`) | Backend |
|---------|----------------------------------|---------|
| Templates / prompts / blacklist | `/api/plan3/templates\|prompts\|blacklist` | `plan3.py` |
| Contrôle envoi | `/api/plan3/mailing-control`, `mailing-status`, `mailing-compose` | idem |
| CV | `api/cv.js` → upload/analyze/delete `/api/plan3/*cv*` | idem |
| Gmail | `api/gmail.js` → redirect `/api/auth/gmail` | `auth.py` + email_sender |

### 3.6 Paramètres — `SettingsPage`

| Action | Client | Endpoint |
|--------|--------|----------|
| Profil | `apiUpdateProfile` | `POST /api/auth/update` |
| CV / Gmail (plan ≥ 3) | `cv.js`, `gmail.js` | plan3 + auth Gmail |
| Reçu paiement | `payments.js` | `GET /api/payments/purchase-receipt` |

### 3.7 Admin — `AdminPage` (hors MVP)

`api/admin.js` → `/api/admin/users`, services, signup-codes, enrichment-settings, timeslot, tables…  
Backend : `coralt_web/routes/admin.py`.

### 3.8 Config instance

`GET /api/config` (`api/config.js`, `routes/public.py`) — flags instance (billing provider, etc.).

---

## 4. Flux critiques (séquences)

### 4.1 Login

```
AuthPage → POST /api/auth/login
        → Set-Cookie coralt_session
        → AuthContext.setUser
        → si !activated → /recherche
           sinon → /entreprises
```

### 4.2 Activation (paiement)

```
SearchOnboardingWizard / PlanPickerStep
  → POST /api/payments/create-checkout-session { plan }
  → redirect Stripe ou Revolut (façade payments)
  → retour success_url (?session_id=…)
  → POST /api/payments/verify-session
  → user.account_activated = true
  → accès Entreprises / reste de l’app
```

### 4.3 Gmail

```
connectGmail() → window.location = /api/auth/gmail?return_to=…
  → OAuth Google → callback email_sender /auth/callback
  → redirect app ?gmail=connected
  → refresh /api/auth/me (gmail_connected)
```

### 4.4 Recherche APE

```
Profil compose/analyze → POST /api/send
  → worker search-queue
  → poll GET /api/search-queue/status
  → prospects apparaissent via sheet-prospects / entreprises
```

### 4.5 Swipe envoi

```
GET sheet-prospects?for_swipe=1
  → SwipeDeck (keep / skip / send)
  → POST mail / send / status
```

---

## 5. Modèle user (champs utiles mobile)

Sérialisation backend : `coralt_web/users.py` (`serialize_user`). Champs typiques exposés au front :

| Champ | Usage mobile |
|-------|----------------|
| `id`, `email`, `name`, `phone` | Profil / auth |
| `plan` | Gates nav & features |
| `account_activated` | Gate activation |
| `is_admin` | Admin |
| `gmail_connected`, `gmail_labels_ready` | Mailing / Envois |
| CV / search_* / mail_* / send_mode | Recherche & mailing |
| flags search/enrichment/queue | États async |

Cache local web : `coralt_session_v2` — **ne pas** traiter comme source de vérité sécurité.

---

## 6. Écarts Expo Go (à traiter avant code)

| Sujet | Web actuel | Impact Expo | Proposition |
|-------|------------|-------------|-------------|
| Auth | Cookie `SameSite=Lax` | Origine ≠ API | **Bearer** (`Authorization`) + endpoints login/me adaptés ; interim : WebView |
| Base URL | `/api` relatif (proxy Vite) | Pas de proxy | `EXPO_PUBLIC_API_URL=https://dev.cal.coraia.eu` |
| Gmail OAuth | `window.location` | Pas de navigateur app | `AuthSession` + scheme `coralt://` |
| Checkout | Redirect navigateur | Idem | `WebBrowser.openAuthSessionAsync` + verify |
| Fichiers CV | `<input type=file>` | — | `expo-document-picker` |
| Swipe | Pointer DOM | — | Gesture Handler |
| Stockage | `localStorage` | — | `AsyncStorage` / SecureStore (token) |
| Analytics | `posthog-js` | — | `posthog-react-native` |
| SSE entreprises-db | EventSource | Fragile | Polling REST en v1 |
| UI desktop | Tableaux larges | Petit écran | Listes / fiches natives |

---

## 7. Spec MVP Expo (étape 2 — à valider)

### Écrans v1

1. **Auth** (login / register)  
2. **Recherche** (onboarding simplifié + lancement file)  
3. **Entreprises** (liste + fiche + actions plan 1/2)  
4. **Envois** (swipe plan 3 — si plan insuffisant : écran upgrade)  
5. **Paramètres** (profil ; CV/Gmail si plan 3)

### Navigation proposée

```
RootNavigator
├── AuthStack (si !user)
└── AppTabs (si user)
    ├── Entreprises
    ├── Recherche
    ├── Envois          (masqué si plan < 3)
    └── Paramètres
```

Activation : modal / stack plein écran sur Recherche tant que `!account_activated`.

### Auth recommandée (détail)

1. Backend : login/register renvoient aussi `access_token` (JWT ou opaque) ; `/api/auth/me` accepte `Authorization: Bearer …` **en plus** du cookie.  
2. Expo : SecureStore pour le token ; `apiFetch` mobile ajoute le header.  
3. Cookies web inchangés (pas de régression).

Alternative plus rapide mais moins propre : WebView pointant vers `dev.cal.coraia.eu` (hors scope « vraie » app native).

### Modules API à réutiliser (logique)

Porter les façades quasi telles quelles :

- `auth.js`, `console.js`, `mailing.js` (sous-ensemble swipe/liste), `entreprises.js`, `payments.js`, `cv.js`, `gmail.js`, `config.js`

Remplacer uniquement la couche `http.js` (base URL + Bearer + erreurs).

---

## 8. Roadmap implémentation (étape 3 — lots)

| Lot | Livrable | Dépendance |
|-----|----------|------------|
| **A** | Projet Expo + `apiFetch` + Auth + AuthContext | Décision Bearer |
| **B** | Tabs shell + Paramètres profil | A |
| **C** | Recherche onboarding + queue status | A |
| **D** | Entreprises liste/fiche | A |
| **E** | Checkout activation (WebBrowser) | A+C |
| **F** | Envois swipe | D + plan 3 |
| **G** | Gmail + CV | F |
| **H** | Mailing avancé / Admin | post-MVP |

Chaque lot = branche dédiée + test sur Expo Go contre **dev** (`dev.cal.coraia.eu` / port doc `docs/DEV_PROD.md`).

---

## 9. Checklist tests manuels Expo Go

- [ ] Login / logout / register  
- [ ] `/me` après kill app (token persisté)  
- [ ] Non activé → uniquement Recherche + checkout  
- [ ] Après paiement → Entreprises accessible  
- [ ] Liste prospects plan 1 vs 2  
- [ ] Swipe plan 3 (send / skip)  
- [ ] Deep link retour Stripe/Revolut  
- [ ] Deep link retour Gmail  
- [ ] Upload CV  
- [ ] Offline / erreur réseau affichée proprement  

---

## 10. Prochaine étape

**Étape 1** : cartographie — faite (ce fichier).  
**Plan produit** : validé.

**Étape 2** (à faire avant le lot A code) :
1. Contrats API Bearer (login/me/logout) à ajouter côté COR-ALT.  
2. Arborescence navigation Expo (tabs + stacks) détaillée.  
3. Découpage dossiers dans `mobile/` (ou `coralt-mobile/`).  

**Lot A** ensuite : scaffold Expo + `apiFetch` Bearer + écran Auth contre `dev.cal.coraia.eu`.

---

## Annexe — index fichiers

| Rôle | Chemin |
|------|--------|
| Routes UI | `frontend/src/App.jsx` |
| Nav | `frontend/src/layout/navConfig.js`, `AppShell.jsx` |
| HTTP | `frontend/src/api/http.js` |
| Auth client | `frontend/src/api/auth.js` |
| Recherche client | `frontend/src/api/console.js` |
| Prospects / swipe | `frontend/src/api/mailing.js` |
| Paiements | `frontend/src/api/payments.js` |
| Plans UI | `frontend/src/utils/planAccess.js` |
| Activation | `frontend/src/utils/accountActivation.js` |
| Blueprints | `coralt_web/routes/__init__.py` |
| Auth serveur | `coralt_web/routes/auth.py` |
| Search | `coralt_web/routes/search.py` |
| Plan3 / mailing | `coralt_web/routes/plan3.py` |
| Payments | `coralt_web/routes/payments.py` |
| Dev/prod (COR-ALT) | COR-ALT `docs/DEV_PROD.md` |
| Playground Expo (ce repo) | `mobile/` |
