# Feature — Contrôle mailing (campagne / worker)

Sources : `api/mailing.js` (`saveMailingControl`, `fetchMailingStatus`, `savePlan3Settings`), `mailing_worker.py`, `mailing_send.py`, `utils/mailingConfirmations.js`, `utils/sendTimeslot.js`  
Routes : `POST /api/plan3/mailing-control`, `GET /api/plan3/mailing-status`, `POST /api/plan3/settings`

## Rôle

Piloter l’**envoi automatique** (worker daemon) et le diagnostic campagne. Distinct du compose (templates/prompts → `mailing-compose`).

## Flags utilisateur (`users`)

| Champ | Valeurs | Effet |
|-------|---------|--------|
| `mail_sending_enabled` | 0/1 | Worker n’envoie que si `1` **et** `plan >= 3` **et** Gmail connecté |
| `send_mode` | `manual` \| `auto` | Voir éligibilité ci-dessous |
| `mail_test_mode` | 0/1 | Redirige vers `MAIL_TEST_EMAIL` (défaut `coraia.contact@gmail.com`) ; créneaux toujours appliqués |
| `mail_use_ai` | 0/1 | Compose (voir templates-prompts) — impact hints diagnostic |
| `send_timeslot` | JSON jours | **Plage globale** effective via `send_timeslot.get_effective_send_timeslot()` (admin / app_settings), pas seulement le champ user |

## Éligibilité worker (`list_sendable_prospects`)

Commun : mail généré (subject+body), pas `sent`/`no_contact`, e-mail valide (sauf test), pas déjà envoyé à la même adresse.

| `send_mode` | Statuts UI envoyables |
|-------------|------------------------|
| `manual` | `validated` uniquement |
| `auto` | `validate`, `done`, `validated` |

Tick : toutes les `MAIL_TICK_SECONDS` (défaut 20 s) ; **1 mail max par user et par tick** + délai `MAIL_ROW_DELAY_SECONDS` (2 s).

## API

### `POST /api/plan3/mailing-control`

Body partiel :

```json
{
  "email": "…",
  "mail_sending_enabled": true,
  "mail_test_mode": false,
  "send_mode": "manual"
}
```

Réponse : `{ status, user }` (user sérialisé).

### `GET /api/plan3/mailing-status`

Diagnostic `mailing_campaign_status` : `worker_running`, flags, `timeslot_allowed`, `timeslot_message`, `sendable_count`, `counts`, `hints[]`.

### `POST /api/plan3/settings`

Étend `send_mode` / `mail_test_mode` + critères recherche ; peut relancer sync modèle générique en background.

## UI web actuelle

- **Admin** : `saveMailingControl` pour `mail_test_mode` ; `send_mode` éditable via modal user admin
- Helpers confirm (`confirmEnableSending`, `confirmEnableAutoValidation`) **présentés** dans `mailingConfirmations.js` mais **non branchés** dans les pages src actuelles — à réutiliser côté iOS avant d’activer envois / auto
- Créneaux : Admin planification globale + `isSendAllowedNow` / `sendTimeslotStatusMessage` (fuseau `Europe/Paris`)

## Gates envoi manuel (swipe / Entreprises)

Même pipeline `send_prospect_mail` :

1. `plan >= 3` sinon 403  
2. Créneau global OK sinon 403 `outside_timeslot`  
3. Gmail connecté + scopes label prêts  
4. Blacklist  
5. Anti-doublon adresse (409 `already_sent` sauf `force`)  
6. CV PDF obligatoire (PJ)  
7. POST `:8020/send-email`

## Port iOS

- Écran / section **Campagne** : toggles Envois actifs, Mode test, Manual/Auto + message créneau
- Avant ON envois / auto : dialoques issus de `mailingConfirmations.js`
- Afficher `GET mailing-status` (hints) plutôt que inventer la logique
- Envois swipe restent **synchrones API** ; worker = background serveur — iOS affiche seulement le statut (polling)
