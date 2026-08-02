# Page Envois (EmailSwipePage)

Source web : `frontend/src/pages/EmailSwipePage.jsx`  
Deck : `components/emailSwipe/SwipeDeck.jsx` + `EmailSwipeCard.jsx`  
Utils : `emailSwipeDeck.js`, `mailingProspects.js`, `prospectsCache.js`  
Hook : `useProspectsPolling` (`forSwipe: true`, 45 s)  
Gate : `EnvoisGate` → `hasEnvoisAccess` (`plan >= 3`) · route `/envois`

## Rôle

File **swipe** des prospects avec mail déjà généré : relecture / édition, régénération IA, envoi Gmail (droite) ou report local (gauche).

## Flux de chargement

1. Cache local `readProspectsCache(email, { forSwipe: true })` si présent → affichage immédiat
2. `fetchSheetProspects(email, { forSwipe: true })` — pagination `limit=1000` + `for_swipe=1`
3. Polling 45 s (`useProspectsPolling`) + refresh au retour foreground
4. Templates en parallèle : `fetchTemplates` (sélecteur modèle / IA sur la carte)

Deck UI = `getEmailSwipeDeck(rows, { skippedIds })` :

- a un e-mail valide
- a `mailSubject` **et** `mailBody`
- statut ≠ `sent` / `no_contact`
- id pas dans `skippedIds` (session uniquement)

## Swipe → actions → API

| Geste | Direction | Overlay | Handler | API |
|-------|-----------|---------|---------|-----|
| Droite | `deltaX >= 96` | « Envoyer » | `handleSend` | `POST …/mail` puis `POST …/send` |
| Gauche | `deltaX <= -96` | « Plus tard » | `handleLater` | **aucune** — `skippedIds.add(id)` |
| Clavier | `ArrowRight` / `ArrowLeft` | idem | idem | idem |

Séquence **send** (optimiste) :

1. Confirm si `findPriorSendsToEmail` trouve déjà un `statut === "sent"` vers la même adresse
2. Patch local `statut: "sent"`
3. `saveProspectMail({ email, row_index, subject, body })`
4. `sendProspectMail({ …, target_email, force })`
5. Success notice (+ hint mode test) ; `loadRows({ background: true })`
6. Erreur : rollback rows ; si `409 already_sent` → re-confirm + retry `force: true`

**Later** : pas d’API ; bouton « Revoir les cartes reportées » vide `skippedIds`.

## Édition / régénération sur la carte

| Action | API |
|--------|-----|
| Save brouillon (blur / change modèle) | `POST /api/plan3/sheet-prospects/mail` |
| Régénérer / affiner IA | même route avec `regenerate: true` (+ `instructions` optionnel), timeout 120 s |

## Bannières

- Mode test (`mail_test_mode`) → mails vers `coraia.contact@gmail.com`
- Gmail non connecté → lien Paramètres (envoi bloqué côté API)
- Empty deck → message + lien `/entreprises`

## Port iOS

- **Deck natif** (UIKit / SwiftUI / gesture handler) : threshold ~96 pt, stack 3 cartes, exit animation ~280 ms
- Swipe droite = envoi **background** : ne pas bloquer le deck ; file locale de jobs + statut (pending / ok / erreur)
- Swipe gauche = skip local (UserDefaults / mémoire session)
- Polling ou push léger pour sync `statut` après envoi auto worker
- Voir `features/envois-swipe.md`, `api/plan3-mailing.md`, `connectors/email-sender.md`
