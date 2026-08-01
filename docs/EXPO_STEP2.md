# Étape 2 — Contrats Bearer + navigation Expo (validé)

Repo de travail : **lucca646/test** · app : [`coralt-mobile/`](../coralt-mobile)

## Décisions verrouillées

| Sujet | Choix |
|-------|--------|
| MVP | Auth · Recherche · Entreprises · Envois · Paramètres |
| Auth v1 runtime | Cookie Flask `coralt_session` persisté (SecureStore) via header `Cookie` |
| Auth cible | Bearer `access_token` (à ajouter côté COR-ALT) |
| API | `https://dev.cal.coraia.eu` |
| Nav | Tabs Expo Router `(app)` + stack `(auth)` |

## Contrat Bearer (à implémenter dans COR-ALT plus tard)

Sans casser les cookies web :

### `POST /api/auth/login` / `register`

Réponse actuelle + champ optionnel :

```json
{
  "status": "success",
  "user": { "...": "..." },
  "access_token": "<jwt ou opaque>",
  "token_type": "Bearer",
  "expires_in": 1209600
}
```

### Authentification des routes protégées

Accepter **dans cet ordre** :
1. Session cookie `coralt_session` (comportement actuel)
2. `Authorization: Bearer <access_token>` → résout `user_email`

### `POST /api/auth/me` / `logout`

- `me` : fonctionne avec cookie **ou** Bearer  
- `logout` : invalide session + blacklist token si opaque/JWT

Le client mobile (`coralt-mobile/src/api/http.ts`) lit déjà `access_token` s’il est présent.

## Navigation Expo (implémentée)

```
app/
  index.tsx                 → redirect selon session
  (auth)/
    login.tsx
    register.tsx
  (app)/                    → Tabs
    entreprises.tsx         → GET sheet-prospects
    recherche.tsx           → compose + send (+ gate activation)
    envois.tsx              → for_swipe + send/skip (plan ≥ 3)
    parametres.tsx          → profil + logout
```

Gates :
- `!user` → login  
- `!activated` → onglet Recherche seul (paiement = lot E)  
- Envois masqué si plan &lt; 3  

## Interim cookie (v1 actuelle)

1. Login → parser `Set-Cookie: coralt_session=…`  
2. Stocker dans SecureStore  
3. Renvoyer `Cookie: coralt_session=…` sur chaque `apiFetch`  

Limitation : si le reverse-proxy strip `Set-Cookie` vers le client RN, il faudra le Bearer COR-ALT.

## Lots suivants

| Lot | Contenu |
|-----|---------|
| A ✅ | Scaffold + Auth + tabs + apiFetch |
| B | Polish Paramètres (update profil) |
| C | Recherche complète (geo, queue poll) |
| D | Fiche entreprise + filtres plan |
| E | Checkout activation (WebBrowser) |
| F | Swipe gestuel (Reanimated) |
| G | Gmail + CV |
| H | Bearer natif COR-ALT |

## Lancer

```bash
cd coralt-mobile
cp .env.example .env   # ou utiliser le .env déjà généré localement
npm install
npx expo start --go --tunnel
```
