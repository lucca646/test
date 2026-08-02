# Page Auth (`AuthPage`)

Documentation pour le port iOS (JS) — connexion / inscription COR·ALT.

## Route

| Élément | Valeur |
|--------|--------|
| Path web | `/` (non connecté) et `/connexion` |
| Query | `?mode=register` — ouvre le formulaire inscription |
| Query | `?return_to=/presentation` — redirection post-auth si compte déjà activé |
| Query | `?billing=monthly` — transmis vers `/recherche?billing=monthly` si non activé |
| Fichier source | `frontend/src/pages/AuthPage.jsx` |

## Gates (App.jsx)

- **Non connecté** : routes `/` et `/connexion` → `AuthPage`.
- **Connecté + non activé** : `/connexion` redirige vers `/recherche` (questionnaire / plans).
- **Connecté + activé** : wildcard `*` → `/entreprises`.
- Affichage basculé selon `user` dans `AuthProvider` (`authReady` doit être `true`).

## États UI

| État | Description |
|------|-------------|
| `isLogin` | `true` = connexion ; `false` = inscription (`mode=register` + `registration_open`) |
| `email`, `password` | Toujours visibles |
| `name`, `phone` | Inscription uniquement (téléphone obligatoire) |
| `inviteCode` | Si `registration_signup_code_required` / `registration_invite_required` |
| `loading` | Bouton désactivé pendant l’appel API |
| `error` | Message d’erreur ; 409 inscription → suggestion « Aller à la connexion » |
| `registrationOpen` | Depuis `appConfig.registration_open` (défaut ouvert côté client si `!== false`) |
| `signupCodeRequired` | Depuis `appConfig` |

## Appels API déclenchés

| Action | API | Body |
|--------|-----|------|
| Connexion | `POST /api/auth/login` | `{ login, password }` (`login` = e-mail ou nom) |
| Inscription | `POST /api/auth/register` | `{ name, email, password, phone, invite_code? }` |
| Boot (AuthContext) | `POST /api/auth/me` | `{}` — cookie session |
| Boot (AuthContext) | `GET /api/config` | — config publique inscription / instance |

Via `AuthContext.login` / `register` : réponse contient `user` + `app` → mise à jour state + `localStorage`.

## localStorage / équivalents SecureStore

| Clé web | Contenu | Port iOS |
|---------|---------|----------|
| `coralt_session_v2` | Cache profil user (JSON) | SecureStore / AsyncStorage — **ne jamais faire confiance à `account_activated`** (forcé à `false` au boot jusqu’à `/me`) |
| `coralt_app_config_v1` | Config publique (`registration_open`, etc.) | Idem, cache non sensible |

Session réelle = cookie Flask `coralt_session` (`credentials: "include"`). Sur iOS : préférer **Bearer token** si l’API est étendue, sinon cookie jar natif (voir [features/auth-session.md](../features/auth-session.md)).

## Flux utilisateur

```mermaid
flowchart TD
  A[Ouvre /connexion] --> B{mode=register?}
  B -->|oui + inscriptions ouvertes| C[Formulaire inscription]
  B -->|non| D[Formulaire connexion]
  C --> E[POST /api/auth/register]
  D --> F[POST /api/auth/login]
  E --> G{account_activated?}
  F --> G
  G -->|non| H["/recherche (?billing=monthly)"]
  G -->|oui + return_to presentation| I[/presentation]
  G -->|oui sinon| J[/entreprises]
  E -->|409| K[Erreur + bascule connexion]
```

### Règles post-auth (`redirectAfterAuth`)

1. Si `!isAccountActivated(user)` → `/recherche` (+ `billing=monthly` si query présente).
2. Sinon si `return_to` = `/presentation` → landing.
3. Sinon → `/entreprises`.

### Validation client inscription

- Mot de passe : `minLength={10}` + hint « lettre + chiffre ».
- Téléphone requis (`AuthContext.register` throw si vide).

## Port iOS

- Reproduire les deux modes (login / register) et les query params `mode`, `return_to`, `billing`.
- Après succès : stocker le profil + ouvrir l’écran questionnaire si non activé.
- Gérer 409 (e-mail déjà pris), 403 (inscriptions fermées / code invalide), 429 (rate limit).
- Badge instance (`instance_label` / `isDevInstance`) depuis `/api/config` ou champ `app` des réponses auth.
- Pas d’OAuth sur cette page (Gmail est un flux séparé post-activation).
