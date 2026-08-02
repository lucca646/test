# Base SQLite — file de recherche

Base utilisateurs : `users.db` (chemin runtime `USERS_DB` / `coralt_paths`).  
Init : `search_queue.init_search_queue_db()`.

Schéma vérifié en lecture seule sur `/root/alternance/users.db` (également présent en `data/dev/users.db`).

---

## `search_campaigns`

| Colonne | Type | Défaut | Rôle |
|---------|------|--------|------|
| `id` | INTEGER PK | auto | ID campagne |
| `user_email` | TEXT NOT NULL | | Propriétaire |
| `fingerprint` | TEXT NOT NULL | | Hash critères (APE×zones×tailles) |
| `geo_query` | TEXT | `''` | Requête libre |
| `geo_label` | TEXT | `''` | Libellé affichage |
| `naf_codes_json` | TEXT NOT NULL | | JSON array codes |
| `taille_min` | INTEGER | 5 | |
| `taille_max` | INTEGER | 1000 | |
| `secteur` | TEXT | `''` | Libellé métier / secteur |
| `status` | TEXT | `'pending'` | Voir `search-queue.md` |
| `total_items` | INTEGER | 0 | Dénormalisé |
| `success_count` | INTEGER | 0 | |
| `failed_count` | INTEGER | 0 | |
| `skipped_count` | INTEGER | 0 | |
| `created_at` | TEXT NOT NULL | ISO UTC | |
| `updated_at` | TEXT NOT NULL | | |
| `completed_at` | TEXT | NULL | Quand plus de pending |
| `profil_candidat` | TEXT | `''` | Snapshot texte profil (migration ALTER) |
| `code_themes_json` | TEXT | `''` | Présent en prod (extension) |

**Index :**

- `idx_search_campaigns_user (user_email, created_at DESC)`
- `idx_search_campaigns_fingerprint (user_email, fingerprint)`

---

## `search_queue_items`

| Colonne | Type | Défaut | Rôle |
|---------|------|--------|------|
| `id` | INTEGER PK | | |
| `campaign_id` | INTEGER NOT NULL | | FK logique → campaigns |
| `user_email` | TEXT NOT NULL | | Dénormalisé |
| `ape_code` | TEXT NOT NULL | | Lot `"62.01Z, 62.02A"` |
| `postal_code` | TEXT | `''` | CP référence si connu |
| `ville` | TEXT NOT NULL | | Motif envoyé à n8n |
| `geo_label` | TEXT | `''` | |
| `status` | TEXT | `'pending'` | pending/running/success/skipped/failed/cancelled |
| `attempts` | INTEGER | 0 | Incrémenté à chaque prise en charge |
| `error_message` | TEXT | `''` | |
| `response_kind` | TEXT | `''` | created/existing/… |
| `prospects_added` | INTEGER | NULL | Depuis réponse n8n |
| `created_at` | TEXT NOT NULL | | |
| `started_at` | TEXT | | |
| `finished_at` | TEXT | | |

**Index :**

- `idx_search_queue_pending (status, created_at)`
- `idx_search_queue_campaign (campaign_id)`

---

## `search_request_cache`

Anti-doublon **par code APE unitaire** (pas par lot).

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | INTEGER PK | |
| `user_email` | TEXT NOT NULL | |
| `ape_code` | TEXT NOT NULL | Un seul code |
| `postal_code` | TEXT NOT NULL DEFAULT `''` | |
| `ville` | TEXT NOT NULL DEFAULT `''` | Motif |
| `taille_min` / `taille_max` | INTEGER NOT NULL | |
| `completed_at` | TEXT NOT NULL | |
| `campaign_id` | INTEGER | Dernière campagne liée |

**Contrainte UNIQUE :** `(user_email, ape_code, postal_code, ville, taille_min, taille_max)`.

Hit cache si `completed_at` dans les `SEARCH_CACHE_DAYS` derniers jours.

---

## Colonnes `users` liées

| Colonne | Rôle |
|---------|------|
| `gsheet_url` | Sheet prospects (mis à jour si n8n crée un sheet) |
| `search_domain` | Texte profil |
| `search_naf_codes` | Codes sélectionnés |
| `search_profile_json` | Blob JSON onboarding + APE + geo |
| `search_geo_zones` | Motifs stockés (string) |
| `search_enabled` | 0 = recherches bloquées |
| `search_queue_paused` | 1 = worker skip |
| `search_analysis_limit` | Quota (sinon défaut env) |
| `competence_highlight` | Phrase mailing |

Le compteur `analyzed_companies_count` (exposé dans `/state`) est dérivé côté logique quota (pas forcément une colonne du même nom — vérifier `users` / settings selon version).

---

## Compteurs runtime (API, non colonnes)

Recalculés depuis les items :

```
total, success_count, failed_count, skipped_count, cancelled_count,
pending_count (= pending + running),
done_count = success + failed + skipped + cancelled,
progress_pct = 100 * done / total
```

---

## Port iOS

Pas d’accès SQLite direct : tout passe par l’API. Utiliser `campaign.id` + `fingerprint` pour associer l’UI locale à la campagne serveur. Ne pas recréer le cache côté device.
