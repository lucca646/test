# Page Entreprises (`/entreprises`) — EntreprisesPage

Surface liste des prospects / fiches entreprises du compte. Web : `frontend/src/pages/EntreprisesPage.jsx`.

## Rôle

1. Afficher la base **entreprises** du compte (via `GET /api/plan3/sheet-prospects`, lecture `entreprises.db`).
2. Filtrer / chercher / trier côté client (`ProspectsTableView` + `mailingProspects.js`).
3. CRUD léger : ajout manuel, édition fiche, note, suivi « Répondu », suppression, relance enrichissement.
4. Plan 3 : vérification / envoi mail (`MailVerifyModal`) + polling liste pendant les envois.

La page **n’appelle pas** directement `/api/entreprises-db/*` pour le listing (sauf création via `createEntreprise` → `POST /api/entreprises-db/rows`). Le reste passe par `/api/plan3/sheet-prospects*`.

## Chargement & cache

```
Mount (user.email)
  → readProspectsCache(email)  // sessionStorage coralt_prospects_v1:<email>
  → si cache : setRows immédiat + loadRows({ background: true })
  → sinon : loadRows() spinner plein

loadRows
  → fetchSheetProspects(email)  // pagination client limit=1000
  → setRows + setDbSyncedAt(mirror.synced_at | entreprises_db.last_updated_at)
  → writeProspectsCache(email, prospects, mirror)

Plan ≥ 3 (mailingEnabled)
  → useProspectsPolling(45 s, fetchOnMount: false)
  → même writeProspectsCache
```

| Clé cache | Contenu |
|-----------|---------|
| `coralt_prospects_v1:<email>` | `{ prospects, mirror, savedAt }` — page Entreprises |
| `coralt_swipe_prospects_v1:<email>` | Même forme, mode Envois (`forSwipe`) |

Quota : la liste complète (~5 Mo+) peut échouer silencieusement à l’écriture `sessionStorage`.

## Droits par plan (UI)

Source : `frontend/src/utils/planAccess.js`.

| Capacité | Plan 1 | Plan 2 | Plan 3 |
|----------|--------|--------|--------|
| Liste entreprises | oui (onglets filtrés masqués → vue « Tout ») | oui | oui |
| Onglet « Envoyé » | non | oui | oui |
| Onglet « À contacter » | oui (si onglets visibles) | oui | oui |
| Toggle manuel statut OK ↔ SENT | non | **oui** | non (mailing) |
| Bouton « Vérifier » / modal mail | non | non | **oui** |
| Afficher objet/corps généré (détail) | non | non | **oui** |
| Polling 45 s | non | non | **oui** (`hasMailingAccess`) |
| Enrichissement auto backend | non (`ENRICH_MIN_PLAN=2`) | oui | oui |

`entreprisesHideValidateTab()` retourne toujours `false` (onglet « À contacter » jamais forcé-caché).

## Filtres & recherche (client)

Onglets `PROSPECT_FILTER_TABS` :

| `id` | Règle |
|------|--------|
| `all` | Tout sauf `statut === "no_contact"` |
| `pending` | `statut === "pending"` (status DB vide → à enrichir) |
| `in_progress` | `statut === "in_progress"` (status DB `GO`) |
| `validate` | `validate` \| `done` ; filtre email valide **activé par défaut** |
| `sent` | `statut === "sent"` |
| `repondu` | `repondu === "yes"` |

- Recherche textuelle : tokens sur entreprise / ville / email / contact / numéro / lien / label statut (sans accents).
- Tri colonnes : entreprise, ville, email, téléphone, site, statut, répondu.
- Défaut onglet : `validate` si onglets visibles ; `all` si plan 1 (`hideFilterTabs`).

## Mapping statut UI ← colonne DB `status`

`gsheet_reader.STATUS_MAP` + `_resolve_statut` (via `db_row_to_prospect_dict`) :

| DB `status` | UI `statut` | Label |
|-------------|-------------|--------|
| `""` (vide) | `pending` | À traiter |
| `GO` | `in_progress` | En cours |
| `OK` | `validate` | À contacter |
| `VALIDATED` | `validated` | Validé |
| `SENT` / `SEND` / `ENVOYÉ` | `sent` | Envoyé |
| `NO CONTACT` (+ variantes) | `no_contact` | Non contactable |
| `NO CONTACT` **mais** email ou tél. valide | `validate` (+ `statutWasNoContact`) | À contacter |

`statutSheet` = valeur brute DB si non vide.

## Actions page → API

| Action UI | Client | Endpoint |
|-----------|--------|----------|
| Refresh / load | `fetchSheetProspects` | `GET /api/plan3/sheet-prospects?email&limit&offset` |
| Ajouter | `createEntreprise` | `POST /api/entreprises-db/rows` |
| Éditer fiche | `updateProspectFields` | `POST /api/plan3/sheet-prospects/update` |
| Note perso | `updateProspectNotePerso` | `POST /api/plan3/sheet-prospects/note-perso` |
| Répondu | `updateProspectRepondu` | `POST /api/plan3/sheet-prospects/repondu` |
| Toggle statut (plan 2) | `updateSheetProspectStatus` | `POST /api/plan3/sheet-prospects/status` (`sent` \| `to_contact`) |
| Relancer enrichissement | `restartSheetProspect` | status `action: "relancer"` → `status=""` |
| Supprimer | `deleteSheetProspect` | `DELETE /api/plan3/sheet-prospects` |
| Sauver mail | `saveProspectMail` | `POST /api/plan3/sheet-prospects/mail` |
| Envoyer mail | `sendProspectMail` | `POST /api/plan3/sheet-prospects/send` |
| Supprimer brouillon mail | `deleteProspectMail` | `DELETE /api/plan3/sheet-prospects/mail` |
| Blacklist | `addBlacklist` | `POST /api/plan3/blacklist` |

Création manuelle (`AddProspectModal`) : champs `entreprise*`, `contact`, `email`, `numero`, `ville`, `site`. Si email `@` ou téléphone → `status: "OK"`, sinon `status: ""` (file enrichissement).

## Objet prospect (UI)

Champs principaux renvoyés par `db_row_to_prospect_dict` :

```json
{
  "id": 12,
  "row_index": 12,
  "entreprises_db_id": 12,
  "entreprise": "Acme SAS",
  "email": "contact@acme.fr",
  "ville": "Lorient",
  "numero": "0612345678",
  "contact": "Marie Dupont",
  "statut": "validate",
  "statutSheet": "OK",
  "lien": "https://acme.fr",
  "hasEmail": true,
  "hasPhone": true,
  "repondu": "no",
  "notePerso": "…",
  "mailSubject": "…",
  "mailBody": "…",
  "adresse": "…",
  "taille": "…",
  "secteur": "…",
  "info": "…",
  "siren": "…",
  "sheet_id": "20260519195303241",
  "updated_at": "2026-08-01T12:00:00Z"
}
```

`row_index` UI = **id SQLite** (`entreprises.id`), pas un index Sheet.

## Port iOS

- Liste native : `UITableView` / `UICollectionView` (diffable data source) ; sections = onglets filtre ou un seul segment « Tout » (plan 1).
- Cache offline léger : remplacer `sessionStorage` par **AsyncStorage** (même clé `coralt_prospects_v1:`) + TTL ; recharger en arrière-plan au foreground.
- SSE `/api/entreprises-db/stream` optionnel (visionneuse admin) — la page web utilise le polling plan3, pas le SSE.
- Optimistic UI déjà présente (statut, répondu, send) : reproduire avec rollback sur erreur.
- Confirmations `window.confirm` → `UIAlertController`.
- Auth : session cookie web → Bearer (voir `api/http-client.md`) ; création peut rester sur `/api/entreprises-db/rows` avec session ou clé.

## Fichiers source (COR·ALT)

- `frontend/src/pages/EntreprisesPage.jsx`
- `frontend/src/components/ProspectsTableView.jsx`, `ProspectDetailModal.jsx`, `AddProspectModal.jsx`, `MailVerifyModal.jsx`
- `frontend/src/api/entreprises.js`, `mailing.js`
- `frontend/src/utils/prospectsCache.js`, `planAccess.js`, `mailingProspects.js`
- `frontend/src/hooks/useProspectsPolling.js`
- `coralt_web/routes/plan3.py` (`sheet-prospects*`)
- `entreprises_db_routes.py`, `entreprises_db.py`
