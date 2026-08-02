# Feature — Swipe Envois

Sources : `EmailSwipePage.jsx`, `SwipeDeck.jsx`, `EmailSwipeCard.jsx`, `utils/emailSwipeDeck.js`, `utils/mailingProspects.js`  
API : `sheet-prospects?for_swipe=1`, `…/mail`, `…/send`

## Modèle mental

```
[API for_swipe] → rows (ready + stubs sent)
       ↓
getEmailSwipeDeck(rows, skippedIds) → deck[0] = carte active
       ↓
gesture / clavier
  → droite : send (API)
  → gauche : later (local)
```

## Filtres deck (`getEmailSwipeDeck`)

Identique côté serveur à `_prospect_is_swipe_ready` :

1. Pas dans `skippedIds`
2. `hasProspectEmail` (`@` présent)
3. `hasGeneratedMail` (subject **et** body)
4. `statut` ∉ `{ sent, no_contact }`

Les stubs `sent` (sans corps) restent dans `rows` pour `findPriorSendsToEmail` uniquement.

## Gestes (SwipeDeck)

| Constante | Valeur |
|-----------|--------|
| `SWIPE_THRESHOLD` | 96 px |
| `MAX_ROTATION` | 10° |
| `SWIPE_EXIT_MS` | 280 ms |
| Stack visible | 3 cartes |

- Pointer events ; zones interactives (inputs, boutons, select) n’amorcent pas le drag
- Preview corps : tap → édition ; drag horizontal depuis preview → swipe
- Overlays : droite « Envoyer », gauche « Plus tard »
- Clavier : `ArrowRight` = send, `ArrowLeft` = later

## Mapping actions → API

### Droite — Envoyer

```
confirm doublon (si prior sent même email)
→ optimistic UI statut=sent
→ POST /api/plan3/sheet-prospects/mail
   { email, row_index, subject, body }
→ POST /api/plan3/sheet-prospects/send
   { email, row_index, subject, body, target_email, force }
→ refresh for_swipe
```

Erreur 409 `already_sent` : `prior_sends` dans payload ; UI re-propose confirm puis `force: true`.

### Gauche — Plus tard

Aucune API. `skippedIds` en mémoire React (perdu au reload). Empty state propose reset.

### Save / régénération (carte)

| Event | Body |
|-------|------|
| Save | `{ email, row_index, subject, body }` |
| Regenerate | `{ …, instructions?, regenerate: true }` |

Réponse régénération : `{ subject, body, prospect }`. Timeout client 120 s.

## Compose sur carte

Sélecteur modèle vs « Rédaction IA » (`MAIL_VERIFY_AI_COMPOSE_VALUE = "ai"`). Changer de modèle applique `buildMailFromTemplate` (variables `{nom_contact}`, `{entreprise}`, …) et sauve immédiatement.

## Anti-doublon client

`findPriorSendsToEmail(rows, email)` filtre `statut === "sent"` même adresse normalisée. Confirm texte FR avant envoi.

## Port iOS — deck natif + background send

1. **UI** : deck gesture natif (pas WebView swipe) ; haptics send/later
2. **Skip** : Set persisté session (UserDefaults) pour survivre au background app
3. **Send status** :
   - Job queue locale : `pending → sending → sent | failed`
   - Ne pas attendre la réponse réseau pour animer la sortie de carte
   - Si échec : toast + remettre la carte ou file « À réessayer »
4. **409** : alert native « déjà contacté » → Envoyer quand même (`force`)
5. **Polling** 45 s aligné web pour sync worker auto
6. Précharger `for_swipe` (timeout 45 s) + cache disque slim prospects
