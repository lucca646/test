# COR·ALT mobile (Expo Go)

App native MVP branchée sur **dev.cal.coraia.eu**.

Doc architecture : [`../docs/EXPO_NATIVE_PORT.md`](../docs/EXPO_NATIVE_PORT.md)  
Étape 2 : [`../docs/EXPO_STEP2.md`](../docs/EXPO_STEP2.md)

## Démarrage

```bash
cd coralt-mobile
npm install
npx expo start --go --tunnel
```

Variables : `.env` (gitignored) avec au minimum :

```
EXPO_PUBLIC_API_URL=https://dev.cal.coraia.eu
```

## MVP écrans

- Auth (login / register)
- Recherche (compose + launch)
- Entreprises (liste sheet)
- Envois (deck plan 3)
- Paramètres (profil / logout)

Auth v1 : cookie session Flask stocké en SecureStore.  
Bearer prêt côté client dès que COR-ALT renverra `access_token`.
