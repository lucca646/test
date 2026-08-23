# Page Paramètres (SettingsPage)

Source web : `frontend/src/pages/SettingsPage.jsx`  
Composants liés : `AccountSetupOptional`, `GmailConnect`, `CvUploader`, `PurchaseReceiptSection`

## Rôle

Écran compte utilisateur : profil éditable, reçu d’achat (si activé), bloc facultatif CV + Gmail (plan mailing ≥ 3).

## Structure UI web

1. **Informations du compte** (`Card`)
   - Avatar initiale + nom affiché + e-mail
   - Badge plan (`userPlan(user)`)
   - Formulaire : nom, téléphone (éditables) ; e-mail et plan en lecture seule
   - Section mot de passe : actuel + nouveau (min 6) — les deux vides = inchangé
   - Bouton « Enregistrer » si dirty

2. **Reçu d’achat** — `PurchaseReceiptSection` si `isAccountActivated(user)`

3. **CV et compte Google** — `AccountSetupOptional` si `hasCvGmailSetup(user)` (= plan ≥ 3)
   - Upload / suppression / relance analyse CV
   - Connexion / déconnexion Gmail

## Données utilisateur affichées

| Champ | Source API | Éditable ici |
|-------|------------|--------------|
| `name`, `phone` | `POST /api/auth/update` | oui |
| `email`, `plan` | session / `me` | non |
| `password` | `update` + `current_password` | oui (optionnel) |
| `cv_path`, `cv_json`, `gmail_connected` | plan3 / auth | via sous-composants |

## Profil & compétences (skills)

La page Paramètres **ne** gère **pas** l’édition des tags skills. Les compétences passent par :

- Onboarding recherche (`SearchOnboardingWizard`) → `skills_list` dans `search_profile_json.onboarding`
- Mailing / Console → `apiUpdateProfile({ skills_list })` ou `competence_highlight`
- Backend `POST /api/auth/update` : `skills_list` (tableau) déclenche `_persist_user_skills_list` (reformulation IA + trame mail)

Helpers front : `frontend/src/utils/skillsList.js` (`resolveSkillsList`, `parseSkillsListFromProfile`).

Pour iOS : écran Paramètres v1 = profil + CV/Gmail ; édition skills peut rester sur Recherche/Mailing ou un sous-écran « Compétences ».

## Appels au chargement / save

| Action | API |
|--------|-----|
| Mount | `refreshUser()` → `POST /api/auth/me` |
| Enregistrer profil | `apiUpdateProfile` → `POST /api/auth/update` |
| CV / Gmail | voir `features/cv.md`, `features/gmail-oauth.md` |

Payload update (SettingsPage) :

```json
{
  "email": "user@example.com",
  "name": "…",
  "phone": "…",
  "password": "…",
  "current_password": "…"
}
```

`email` dans le body est informatif : le serveur utilise la session (`require_user_email()`), pas le body pour l’identité.

## Gates plan

| Feature | Condition |
|---------|-----------|
| Bloc CV + Gmail | `plan >= 3` (`hasCvGmailSetup`) |
| Reçu Stripe | `account_activated` |

## Port iOS

- Écran **Paramètres** dans les tabs (MVP EXPO)
- Session : token dans **SecureStore** ; `apiFetch` avec `Authorization: Bearer` (ou Cookie interim)
- Ne pas stocker le mot de passe en clair
- Après OAuth Gmail / upload CV : `refreshUser` / patch user local
- Deep link retour OAuth : `coralt://` ou `coraia://` → onglet Paramètres (voir `features/gmail-oauth.md`)
- CV : `expo-document-picker` (PDF only), pas `<input type=file>`

## Fichiers à porter

| Web | iOS cible |
|-----|-----------|
| `SettingsPage.jsx` | écran Settings |
| `AccountSetupOptional.jsx` | section optionnelle |
| `api/auth.js` (`apiUpdateProfile`, `apiRefreshUser`) | client auth |
| `api/cv.js`, `api/gmail.js` | clients CV / OAuth |
| `utils/planAccess.js` | mêmes gates |
