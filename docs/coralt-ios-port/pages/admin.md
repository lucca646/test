# AdminPage — Administration

> **Hors scope MVP iOS.** Documenté pour référence ; Coraia Glass ne porte pas cette UI dans le MVP.

Sources COR·ALT (lecture seule) : `frontend/src/pages/AdminPage.jsx`, composants `AdminServicesPanel`, `AdminSignupCodesPanel`, `AdminUserEditModal`.

## Accès

| Couche | Règle |
|--------|--------|
| Route | `/admin` |
| Gate React | `AdminGate` dans `App.jsx` — redirige vers `/recherche` si `!user \|\| !isAdmin` |
| Nav | Entrée `adminOnly: true` dans `navConfig.js` — visible seulement si `isAdmin` |
| Backend | `ADMIN_EMAIL` (.env) ; `is_admin_email` / `require_admin_user` (session cookie `coralt_session`) |

`isAdmin` côté front = `Boolean(user?.is_admin)` (AuthContext), aligné sur l’email admin serveur.

## Onglets UI

| id | Label | Rôle |
|----|-------|------|
| `control` | Contrôle | Liste utilisateurs : toggles recherche / enrichissement, quota analyse, Gmail, détail expansible |
| `services` | Services | `AdminServicesPanel` — statut / power / restart workers (systemd + threads Flask + build frontend) |
| `db` | Base données | Lien vers visionneuse `/db/entreprises` (nouvel onglet) |
| `planification` | Planification | Plages horaires globales (`WeeklyScheduler`) + mode test campagne admin |
| `mail_prompt` | Trame mail | CRUD prompts IA (`fetchPrompts` / `savePrompt` / `deletePrompt` — API mailing, pas admin) |
| `users` | Utilisateurs | Table brute + édition modal + codes d’inscription |
| `templates` | Modèles | Lecture table `email_templates` |
| `blacklist` | Liste noire | Lecture table `blacklisted_emails` |
| `webhooks` | Intégrations | Info seule (config serveur hors UI) |
| `timing` | Délais | Réglages délais enrichissement / file recherche (autosave) |

Lien rapide : aperçu formules → `/plans` (`PlansGate` / `ActivationPage` en preview admin).

## Actions principales (onglet Contrôle)

- Toggle `search_enabled` par utilisateur → `PATCH .../search-enabled`
- Toggle `enrichment_enabled` (plan ≥ 2) → `PATCH .../enrichment-enabled`
- Affichage quota `analyzed_companies_count / search_analysis_limit`
- Alerte si `enrichment_daemon_running === false`

## Édition / suppression (onglet Utilisateurs)

- Modal `AdminUserEditModal` → `PATCH /api/admin/users/:id` (`updates`)
- Suppression (sauf compte admin) → `DELETE /api/admin/users/:id` (purge modèles, prompts, blacklist, entreprises, recherche)
- Panneau codes d’inscription → API `signup-codes`

## Auth front → API

Le client passe `admin_email` en query/body (email de la session). L’autorisation réelle est la **session Flask** (`require_admin_user`), pas ce paramètre.

## Port iOS

- Ne pas implémenter AdminPage ni navigation admin dans le MVP.
- Architecture cible client : **Bearer token** (voir [api/http-client.md](../api/http-client.md)) ; le web actuel utilise cookies `credentials: "include"`.
