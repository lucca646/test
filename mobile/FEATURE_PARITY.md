# Parité fonctionnelle PWA Messages ↔ App iOS (React Native)

Document **définitif** d’audit, établi par relecture directe du code (PWA + RN + backend), sans s’appuyer sur des résumés antérieurs.

| | |
|---|---|
| **PWA** | `/root/evolution-api/mcp/imessage-ui/` (`app.js`, `index.html`, `styles.css`, `offline-cache.js`, `sw.js`) |
| **Backend** | `/root/evolution-api/mcp/src/imessage-server.ts` (+ `conversations-from-db.ts`, `stats.ts`) |
| **App RN** | `/root/test/mobile/src/messages/` |
| **Date** | 2026-08-04 |

**Légende statut RN** : ✅ Fait · 🟡 Partiel · ❌ Absent

**Effort** : Faible (UI / câblage API existante) · Moyen (écran / état / plusieurs endpoints) · Élevé (flux complexe, temps réel, push, SAV…)

**Priorité** : Haute (usage quotidien messagerie commerciale) · Moyenne · Basse

---

## Tableau exhaustif

### 1. Liste des conversations

| # | Nom | Référence PWA | Endpoint(s) backend | Statut RN | Effort | Priorité |
|---|-----|---------------|---------------------|-----------|--------|----------|
| 1 | Titre large « Messages » + liste scrollable | `index.html:48-51` ; `app.js:2916-3047` (`renderContactsList`) | `GET /api/contacts?sim=` — `imessage-server.ts:285` (PWA) ; RN utilise `GET /api/conversations` — `imessage-server.ts:540` / `api.ts:192-194` | ✅ `ConversationsListScreen.tsx:104-154` | — | — |
| 2 | Filtre dédié « Non lus » (bouton toggle, pas seulement tri) | `index.html:112-119` ; `app.js:1682-1687`, `1413-1440` (`showUnreadOnly` / `getVisibleContacts`) | Filtrage client sur `unreadSimCount` / `unread_count` (données déjà dans listes) | ❌ absent de `ConversationsListScreen.tsx` | Faible | Haute |
| 3 | Filtre select « Étiquette : Toutes » | `index.html:108-111` ; `app.js:2884-2914` (`populateLabelFilter`), `1426-1436` | Données labels dans `GET /api/contacts` / `GET /api/conversations` ; catalogue `GET /api/labels?sim=` — `imessage-server.ts:630` | ❌ | Faible | Haute |
| 4 | Onglets SIM (pills, pastille verte connectée, actif) | `index.html:83-91` ; `app.js:2373-2455` (`renderSimTabs`), CSS `.sim-dot` `styles.css:2917-2925` | `GET /api/sims` — `imessage-server.ts:1719` | 🟡 `ConversationsListScreen.tsx:122-126` : `Segmented` + labels SIM, **sans** pastille verte `connected`, **sans** badge brouillons, **sans** swipe horizontal dédié | Moyen | Haute |
| 5 | Swipe horizontal entre onglets SIM | `index.html:82` ; `app.js:2016-2057` (`setupSimTabsSwipe`) | — (UI) | ❌ Segmented tactile seulement | Faible | Basse |
| 6 | Barre statut SIM (réseau, signal, lien brouillons) | `index.html:89-91` ; `app.js:2457-2480` (`updateSimStatusBar`) | `GET /api/sims` | 🟡 infos SIM dans `ParametresScreen.tsx:56-76` seulement, pas sous les tabs | Faible | Moyenne |
| 7 | Gauge / tooltip limites d’usage sur tabs SIM | `app.js:2170-2450` (`fetchSimLimits`, `showSimLimitsTooltip`) | `GET /api/sims/:simId/limits` — `imessage-server.ts:1825` | ❌ | Moyen | Moyenne |
| 8 | Recherche live (icône + placeholder « Rechercher ») | `index.html:95-105` ; `app.js:1674-1676`, `1415-1424` | — (client) | ✅ `ConversationsListScreen.tsx:108-120` (live sur nom/tél) ; icône emoji 🔍 vs SVG PWA | Faible (fidélité visuelle) | Haute |
| 9 | Badge non-lu : pastille bleue 8×8 circulaire à gauche | `app.js:3016`, `2948-2957` ; `styles.css:1197-1205` (`.unread-dot`) | Compteur `unread_count` / `unreadSimCount` | ✅ `ConversationRow.tsx:38`, `94-98` (8×8, `borderRadius: 4`, accent) | — | — |
| 10 | Aperçu dernier message + troncature | `app.js:2992`, `3024` (`lastMessageText`, 1 ligne CSS) | Texte brut API (PWA **ne préfixe pas** « Vous : ») | 🟡 `ConversationRow.tsx:20-23`, `57-65` : préfixe **« Vous : »** côté RN (plus que la PWA) ; `numberOfLines={2}` vs ~1 ligne PWA | Faible | Moyenne |
| 11 | Chips étiquettes CRM sous l’aperçu | `app.js:3003-3008`, `3032` | Labels dans résumé conversation | ✅ `ConversationRow.tsx:66-79` (max 3) | — | — |
| 12 | Horodatage liste (aujourd’hui / jour / date) | `app.js:2946`, `3021` (`formatDate`) | `last_date` / `lastMessageTime` | ✅ `format.ts:37-49` + `ConversationRow.tsx:53-55` | — | — |
| 13 | Avatar initiales + couleur stable | `app.js:2994-2995`, `3017` | — | ✅ `format.ts:1-26` + `ConversationRow.tsx:39-41` | — | — |
| 14 | Swipe sur **ligne** de conversation (delete / actions) | **N’existe pas** en PWA (clic seul `app.js:3045`) | Soft-delete existe : `DELETE /api/conversations/:key` — `imessage-server.ts:826-827` mais **non branché UI liste** | ❌ (et hors scope PWA) | — | Basse |
| 15 | Badge brouillon modem sur ligne (`conv-draft-badge`) | `app.js:3010-3013`, `2959-2983` | `GET /api/sims/:simId/drafts` — `imessage-server.ts:3386` | ❌ | Moyen | Haute |
| 16 | Pull-to-refresh / rechargement liste | Polling 20s `app.js:1112-1121` | `GET /api/contacts` ou `/api/conversations` | ✅ `RefreshControl` `ConversationsListScreen.tsx:144-146` + poll 8s L20, L66-68 | — | — |
| 17 | Tri : non-lus SIM en tête (API conversations) / récence (contacts) | PWA : récence `app.js:1442-1447` ; API conv : `(unread_count > 0) DESC` `conversations-from-db.ts:51` | — | ✅ via `GET /api/conversations` | — | — |
| 18 | Bouton « Nouveau message » / création contact | `index.html:62-65` ; modal `292-315` ; `app.js:3897-3935` | `POST /api/contacts?sim=` — `imessage-server.ts:155` | ❌ | Moyen | Moyenne |

### 2. Fil de conversation

| # | Nom | Référence PWA | Endpoint(s) backend | Statut RN | Effort | Priorité |
|---|-----|---------------|---------------------|-----------|--------|----------|
| 19 | Ouverture fil + chargement messages | `app.js:3053-3116`, `3213-3261` | PWA : `GET /api/contacts/:number/messages?sim=` — `imessage-server.ts:427` ; RN : `GET /api/conversations/:key` — `imessage-server.ts:541` / `api.ts:197-202` | ✅ `ThreadScreen.tsx:71-99` | — | — |
| 20 | Marquer conversation lue à l’ouverture | `app.js:3109`, `3874-3880` | PWA : `POST /api/contacts/:number/read` — `imessage-server.ts:830` ; RN : `POST /api/conversations/:key/read` — `imessage-server.ts:625` / `api.ts:205-209` | ✅ `ThreadScreen.tsx:91` | — | — |
| 21 | Séparateurs de jour (Aujourd’hui / Hier / date longue) | `app.js:3406-3416` | — | ✅ `format.ts:52-67` + `ThreadScreen.tsx:36-53`, `200-201` | — | — |
| 22 | Bulles in/out + couleur bot (vert) vs UI (bleu) | `app.js:3419-3434`, `3439` | PWA messages incluent `sentBy`/`cost` (`imessage-server.ts:445-467`) ; **`/api/conversations/:key` n’expose ni `sentBy` ni `cost`** (`conversations-from-db.ts:167-236`) | 🟡 `MessageBubble.tsx:14-31` : logique `sentBy !== "ui"` présente mais `sentBy` rarement fourni par l’endpoint RN → presque tout out = bot | Moyen | Haute |
| 23 | Réactions emoji sur bulle | `app.js:3453-3462` | Champ `reaction` ; SSE `message_reaction` `app.js:1344-1348` ; `GET /api/events` `imessage-server.ts:1143` | ✅ `MessageBubble.tsx:34-44`, `66-83` (fidèle : badge absolu, bordure fond) | — | — |
| 24 | Statut « Distribué » sur dernier message sortant | `app.js:3501-3510` | — (UI) | 🟡 `MessageBubble.tsx:46-50` : affiche toujours « Distribué · heure » si `showStatus` & out — **pas** de cas « Non envoyé » | Faible | Haute |
| 25 | Statut « Non envoyé » + badge `!` brouillon modem | `app.js:3282-3337`, `3496-3500` ; modal `index.html:458-475` | `GET/DELETE /api/sims/:simId/drafts…` ; `POST …/resend` — `imessage-server.ts:3386-3422` | ❌ | Élevé | Haute |
| 26 | Coût par message (groupe minute) + total `.chat-cost-total` | `index.html:169` ; `app.js:3586-3598`, `3474-3479` ; CSS `styles.css:2239-2248` | `cost` via `GET /api/contacts/:number/messages` | ❌ (endpoint détail conv sans `cost`) | Moyen | Moyenne |
| 27 | Header cliquable → modal fiche contact | `index.html:158-169` ; `app.js:1838-1844`, `4084-4208` | Voir §3 | ❌ header titre stack seulement `ThreadScreen.tsx:153-178` | Moyen | Haute |
| 28 | Bouton Avancement trame `n/6` (PVMD-EA) + modal checklist | `index.html:171-175`, `509-524` ; `app.js:3120-3207` | `GET /api/contacts/:number/tram` — `imessage-server.ts:2056` | ❌ | Moyen | Haute |
| 29 | Bouton « Signaler le bot » + modal raisons | `index.html:179-184`, `477-507` ; `app.js:37-51`, report flow | `POST /api/contacts/:number/bot-report` — `imessage-server.ts:2103` | ❌ | Élevé | Haute |
| 30 | Panneau SAV collapsible (timeline, diagnostic, juri, actions) | `index.html:199-250` ; `app.js:4567-4883+` | `GET …/bot-report/active` `:2229` ; `GET /api/bot-reports/:id` `:2274` ; `POST …/status` `:2321` ; `POST …/resolve` `:2344` | ❌ | Élevé | Moyenne |
| 31 | Bouton Relancer (si label « À relancer ») + popover templates `{prenom}` | `index.html:257-269` ; `app.js:3634-3827` | `GET/POST /api/relaunch/templates` — `imessage-server.ts:3112-3136` ; `DELETE …/:id` `:3149` | ❌ | Moyen | Haute |
| 32 | Correcteur « Aa » (proofread) | `index.html:271-273` ; `app.js:3758-3790` | `POST /api/compose/proofread` — `imessage-server.ts:3136` | ❌ | Faible | Moyenne |
| 33 | Composer auto-resize (max ~140px / 6 lignes) | `app.js:3625-3631` ; input `index.html:275-276` | — | 🟡 `ThreadScreen.tsx:219-226`, `279-286` : `multiline` + `maxHeight: 120`, pas de resize dynamique hauteur contenu | Faible | Moyenne |
| 34 | Bouton micro ↔ flèche d’envoi selon texte | `index.html:277-280` ; `app.js:3604-3622` | — | 🟡 toujours flèche `↑` (`ThreadScreen.tsx:228-241`) ; désactivée si vide — **pas** d’icône micro | Faible | Basse |
| 35 | Envoi SMS | `app.js:3829+` | `POST /api/contacts/:number/send?sim=` — `imessage-server.ts:1488` / `api.ts:212-222` | ✅ `ThreadScreen.tsx:104-120` | — | — |
| 36 | Toggle SIM lu / non lu sur dernier message entrant | `app.js:3513-3527`, `3548-3583` | `POST /api/contacts/:number/messages/:messageId/read_sim` — `imessage-server.ts:966` | ❌ | Moyen | Moyenne |
| 37 | Bannière RDV Cal.com (ambre) | `index.html:187-193` ; `app.js:4466-4494` ; CSS `styles.css:1484-1510` | Champ `calRdvAt` sur `GET /api/contacts` ; SSE `contact_updated` | ❌ (`/api/conversations/:key` n’expose pas `calRdvAt`) | Moyen | Haute |
| 38 | Bannière bot OFF (orange) + « Voir le signalement » | `index.html:252-254` ; `app.js:4497-4539` | `GET/POST /api/contacts/:number/bot` — `imessage-server.ts:2043`, `2072` | 🟡 bannière présente `ThreadScreen.tsx:180-186` ; pas de lien SAV | Faible | Haute |
| 39 | Toggle bot ON/OFF dans header fil | PWA : dans **modal profil** (`index.html:361-368`) + bannière ; pas de pill header | `POST /api/contacts/:number/bot` | ✅ pill header `ThreadScreen.tsx:157-175`, `129-143` — **complémentaire** à la fiche contact PWA (redondant si fiche ajoutée) | — | — |
| 40 | Swipe retour liste / conversation suivante (mobile) | `app.js:1534-1670` (`setupChatSwipeBack`) | — | ❌ (back natif stack) | Moyen | Basse |
| 41 | Navigation clavier ↑↓ entre conversations | `app.js:1511-1532` | — | ❌ (N/A iOS) | — | Basse |
| 42 | Linkify URLs dans bulles | `app.js:3441` (`linkifyMessageHtml`) | — | ❌ texte brut | Faible | Moyenne |
| 43 | Polling fil actif | PWA 20s global `app.js:1118-1120` + SSE | — | ✅ 4s `ThreadScreen.tsx:30`, `92-94` | — | — |

### 3. Fiche contact / modal détails

| # | Nom | Référence PWA | Endpoint(s) backend | Statut RN | Effort | Priorité |
|---|-----|---------------|---------------------|-----------|--------|----------|
| 44 | Modal Détails (avatar, tél, nom) | `index.html:318-331` ; `app.js:4084-4095` | — | ❌ | Moyen | Haute |
| 45 | Édition nom / LinkedIn / email / résumé projet | `index.html:335-357` ; `app.js:4218-4248` | `POST /api/contacts/:number/status` — `imessage-server.ts:3191` (+ champs profil) | ❌ | Moyen | Moyenne |
| 46 | Switch Bot IA ON/OFF dans fiche | `index.html:361-368` ; save via status/bot | `POST /api/contacts/:number/bot` et/ou status | 🟡 déjà dans header thread (voir #39) — fiche absente | Faible (si fiche) | Haute |
| 47 | Statut CRM radios `STATUS_LABEL_ORDER` + extras checkboxes | `app.js:3973-3991`, `4140-4203` | `GET /api/labels?sim=` `:630` ; `POST /api/contacts/:number/status` `:3191` | ❌ | Moyen | Haute |
| 48 | Catégorie contact (mapping label ↔ category) | `app.js:3941-3971`, `4051-4054` | Idem status | ❌ (champ `category` typé dans `api.ts:58` mais non édité) | Moyen | Haute |
| 49 | Supprimer le contact | `index.html:382` ; `app.js:4305` | `DELETE /api/contacts/:number` — `imessage-server.ts:3344` | ❌ | Faible | Basse |

### 4. Stats

| # | Nom | Référence PWA | Endpoint(s) backend | Statut RN | Effort | Priorité |
|---|-----|---------------|---------------------|-----------|--------|----------|
| 50 | Écran / modal Statistiques | `index.html:67-70`, `390-437` ; `app.js:5328-5694` | `GET /api/stats` — `imessage-server.ts:3294` / `api.ts:241-251` | ✅ onglet dédié `StatsScreen.tsx` | — | — |
| 51 | Filtres période (chips + dates custom + SIM) | `index.html:400-420` ; `app.js:5280-5322` | Query `from`/`to`/`sim` | 🟡 `StatsScreen.tsx:12-17`, `332-339` : 7/14/30/mois — **pas** Aujourd’hui / Tout / date pickers | Moyen | Moyenne |
| 52 | Onglet Vue d’ensemble | `index.html:425` ; `app.js:5566-5583` | `/api/stats` | ✅ `StatsScreen.tsx:61-120` | — | — |
| 53 | Onglet Volume | `index.html:426` ; `app.js:5585-5598` | idem | ✅ `StatsScreen.tsx:123-152` | — | — |
| 54 | Onglet Funnel | `index.html:427` ; `app.js:5600-5618` | idem | 🟡 `StatsScreen.tsx:155-193` : catégories + labels ; **pas** matrice catégorie×SIM ni PVMDEA | Moyen | Moyenne |
| 55 | Onglet RDV / Conversion | `index.html:428` ; `app.js:5621-5654` | idem | ✅ `StatsScreen.tsx:196-238` | — | — |
| 56 | Onglet **Détail** (5e : tableau journalier) | `index.html:429` ; `app.js:5351`, `5656-5662` | idem | ❌ seulement 4 catégories `StatsScreen.tsx:19-24` | Faible | Moyenne |
| 57 | Graphiques barres volume / RDV | `app.js:5394-5458` | — | 🟡 listes `Row` au lieu de barres | Moyen | Basse |
| 58 | Historique blocages quota SIM | Données dans `stats.ts:620` (`simLimitBlocks`) + `GET /api/limits/blocks` `imessage-server.ts:3317` | **Aucune UI PWA** dans `renderStatsDashboard` (données API seulement) | ❌ (PWA UI aussi absente) | Moyen | Basse |

### 5. Auth, compte, identité

| # | Nom | Référence PWA | Endpoint(s) backend | Statut RN | Effort | Priorité |
|---|-----|---------------|---------------------|-----------|--------|----------|
| 59 | Login session (identifiant / MDP / rester connecté) | `index.html:526-552` ; `app.js:717-755` | `POST /api/auth/login` ; `GET /api/auth/me` | 🟡 `UserPickerScreen.tsx` + `CurrentUserContext.tsx:16-25` : identité **locale** + Bearer `MESSAGES_API_TOKEN` (`config.ts:30-44`) — pas de session user | Élevé | Haute* |
| 60 | Compte : sessions, change MDP, logout | `index.html:555-600` ; `app.js:542-815` | `/api/auth/account`, `change-password`, `logout` | 🟡 `ProfilScreen.tsx` affiche id/rôle + « Changer d’utilisateur » | Moyen | Moyenne |
| 61 | Restriction SIMs par utilisateur | `app.js:2079-2092`, `646` | Auth user `simIds` | ❌ tous les SIMs API | Moyen | Moyenne |

\*Priorité Haute si multi-vendeurs en prod ; sinon Moyenne tant que token serveur suffit.

### 6. Offline, cache, temps réel, thème, push

| # | Nom | Référence PWA | Endpoint(s) backend | Statut RN | Effort | Priorité |
|---|-----|---------------|---------------------|-----------|--------|----------|
| 62 | Mode offline : bandeau + pastille titre | `index.html:37`, `50` ; `app.js:327-442`, `offline-cache.js` | — | 🟡 cache mémoire SWR `cache.ts:1-20` ; **pas** de bandeau hors-ligne ni IndexedDB | Moyen | Haute |
| 63 | Service Worker / shell offline | `sw.js` ; `app.js:1097-1098` | `GET /sw.js` `imessage-server.ts:126` | ❌ (N/A native ; AsyncStorage possible) | Moyen | Moyenne |
| 64 | SSE temps réel `new_message` / `message_reaction` / `contact_updated` | `app.js:1328-1365` | `GET /api/events` — `imessage-server.ts:1143-1163` | 🟡 polling seul (8s liste / 4s fil) — **SSE possible** via polyfill (`react-native-sse` / EventSource) mais **pas obligatoire** : polling actuel acceptable ; SSE = latence + batterie | Moyen | Moyenne |
| 65 | Polling secours contacts / SIMs | `app.js:1109-1121` (20s / 40s) | — | ✅ | — | — |
| 66 | Thème clair/sombre (toggle + `localStorage "theme"`) | `index.html:56-60` ; `app.js:1067-1081`, `1694-1697` | — | 🟡 `theme.ts:123-126` : suit **uniquement** `useColorScheme` système — **pas** de override local | Faible | Basse |
| 67 | Push Web (VAPID) + banner notif in-app | `app.js:889-1005`, `index.html:605` | `GET /api/mobile/vapid-public-key` ; `POST /api/mobile/device` ; `GET /api/mobile/notifications` | ❌ `ParametresScreen.tsx:85-88` « Push (bientôt) » | Élevé | Haute |
| 68 | Deep link `?contact=&sim=` / SW message | `app.js:1010-1065` | — | ❌ | Moyen | Moyenne |
| 69 | Safe-area / clavier visualViewport | `app.js:1127-1322` | — | ✅ `useSafeAreaInsets` + `KeyboardAvoidingView` `ThreadScreen.tsx:148-151` | — | — |

### 7. Autres écrans / transverses PWA

| # | Nom | Référence PWA | Endpoint(s) backend | Statut RN | Effort | Priorité |
|---|-----|---------------|---------------------|-----------|--------|----------|
| 70 | Inbox propositions RAG / jurisprudence | `index.html:72-76`, `440-456` ; `app.js:1700`, `5001+` | `GET /api/bot-reports?status=…` — `imessage-server.ts:2248` | ❌ | Élevé | Basse |
| 71 | Modal brouillons SIM (liste, renvoi, suppression) | `index.html:458-475` ; `app.js:2648-2785` | drafts endpoints ci-dessus | ❌ | Moyen | Haute |
| 72 | Badge brouillons sur tab SIM | `app.js:2394-2409` | `draftCount` dans `GET /api/sims` | ❌ (champ typé `api.ts:73` non affiché) | Faible | Haute |
| 73 | Écran Paramètres (SIMs + build) | ( dispersé PWA : statut SIM + compte ) | `GET /api/sims` | ✅ `ParametresScreen.tsx` | — | — |
| 74 | Écran Profil vendeur | modal compte PWA | — | ✅ `ProfilScreen.tsx` (local) | — | — |
| 75 | Warm cache messages (~40 fils) | `app.js:2863-2881` | messages API | ❌ | Moyen | Basse |

---

## Notes d’architecture (écarts API)

| Sujet | Détail |
|-------|--------|
| **Deux façades liste/fil** | PWA : `GET /api/contacts` + `GET /api/contacts/:number/messages` (riches : `cost`, `sentBy`, `calRdvAt`, `readSim`). RN : `GET /api/conversations` + `/:key` (plus pauvre : pas `cost`/`sentBy`/`calRdvAt`). |
| **Fidélité bulles bot** | Pour colorer bot vs UI correctement, enrichir `buildConversationDetail` **ou** basculer le fil RN sur `/api/contacts/:number/messages`. |
| **SSE vs polling RN** | Backend SSE déjà là. Sur iOS, EventSource n’est pas natif : polyfill possible. Recommandation : **garder le polling** pour v1 ; ajouter SSE si la latence perçue gêne. |
| **« Vous : »** | Présent côté RN uniquement ; la PWA affiche le texte brut du dernier SMS. |

---

## Endpoints manquants côté backend

**Aucun endpoint listé ci-dessus n’est absent** de `imessage-server.ts` pour les fonctionnalités PWA recensées.

Évolutions backend **souhaitables** (pas bloquantes si on réutilise les routes contacts) :

1. **Enrichir** `GET /api/conversations/:key` (`conversations-from-db.ts`) avec `sentBy`, `cost`, `calRdvAt` / `cal_rdv_at` — sinon coût total, couleurs bot/UI et bannière RDV restent difficiles sans second appel.
2. Optionnel : exposer `simLimitBlocks` dans l’UI stats (déjà dans payload `GET /api/stats` via `stats.ts:620`) — pas un nouvel endpoint.

Endpoints **déjà disponibles** pour l’implémentation RN (rappel) :

| Méthode | Chemin | Ligne `imessage-server.ts` |
|---------|--------|----------------------------|
| GET | `/api/contacts` | 285 |
| POST | `/api/contacts` | 155 |
| GET | `/api/contacts/:number/messages` | 427 |
| POST | `/api/contacts/:number/read` | 830 |
| POST | `/api/contacts/:number/messages/:messageId/read_sim` | 966 |
| POST | `/api/contacts/:number/send` | 1488 |
| GET/POST | `/api/contacts/:number/bot` | 2043 / 2072 |
| GET | `/api/contacts/:number/tram` | 2056 |
| POST | `/api/contacts/:number/bot-report` | 2103 |
| GET | `/api/contacts/:number/bot-report/active` | 2229 |
| GET/POST/DELETE | `/api/bot-reports…` | 2248+ |
| GET | `/api/labels` | 630 |
| POST | `/api/contacts/:number/status` | 3191 |
| GET/POST/DELETE | `/api/relaunch/templates…` | 3112+ |
| POST | `/api/compose/proofread` | 3136 |
| GET | `/api/sims` | 1719 |
| GET | `/api/sims/:simId/limits` | 1825 |
| GET/DELETE/POST | `/api/sims/:simId/drafts…` | 3386+ |
| GET | `/api/stats` | 3294 |
| GET | `/api/limits/blocks` | 3317 |
| GET | `/api/events` (SSE) | 1143 |
| GET/POST | `/api/conversations…` | 540+ |
| Auth / mobile push | `/api/auth/*`, `/api/mobile/*` | (modules auth) |

---

## Synthèse des comptes

| Statut RN | Nombre |
|-----------|--------|
| ✅ Fait | **23** |
| 🟡 Partiel | **17** |
| ❌ Absent | **35** |
| **Total fonctionnalités recensées** | **75** |

*(#41 navigation clavier desktop compté ❌/Basse ; #14 swipe ligne confirmé absent côté PWA aussi.)*

---

## Plan d’implémentation suggéré

Ordre : **priorité Haute**, puis **effort croissant**. Exclut les items déjà ✅.

### À implémenter (endpoints déjà disponibles)

1. **Filtre Non lus** (#2) — Faible  
2. **Filtre Étiquette** (#3) — Faible  
3. **Badge brouillons sur tab SIM** (#72) — Faible  
4. **Correcteur Aa / proofread** (#32) — Faible  
5. **Linkify URLs dans bulles** (#42) — Faible  
6. **Fidélité statut Distribué / Non envoyé** (#24) — Faible (après drafts)  
7. **Pastille SIM connectée + polish tabs** (#4 partiel) — Moyen  
8. **Avancement trame n/6** (#28) — Moyen  
9. **Header → fiche contact + labels CRM + catégorie** (#27, #44, #47, #48, #46) — Moyen  
10. **Bannière RDV Cal.com** (#37) — Moyen *(utiliser contacts ou enrichir détail)*  
11. **Relancer + templates `{prenom}`** (#31) — Moyen  
12. **Modal brouillons + badges fil/liste** (#25, #71, #15) — Moyen→Élevé  
13. **Couleurs bot/UI fiables** (#22) — Moyen *(enrichir API conversations **ou** GET messages contacts)*  
14. **Coût total conversation** (#26) — Moyen *(dépend de #13)*  
15. **Toggle read_sim** (#36) — Moyen  
16. **Bandeau offline** (#62) — Moyen  
17. **Stats onglet Détail** (#56) — Faible  
18. **Signaler le bot + panneau SAV** (#29, #30) — Élevé  
19. **Push notifications natives** (#67) — Élevé  
20. **Auth session réelle multi-vendeur** (#59, #61) — Élevé  

### Ensuite (priorité Moyenne / Basse)

21. Nouveau contact (#18)  
22. Gauge limites SIM (#7)  
23. SSE optionnel (#64)  
24. Périodes stats / funnel riche (#51, #54)  
25. Thème override local (#66)  
26. Deep links (#68)  
27. Inbox RAG (#70)  
28. Historique blocages quota UI (#58)  
29. Micro↔send icon (#34), swipe chat (#40), delete contact (#49)  

### Bloquées côté backend

**Aucune** fonctionnalité PWA n’est bloquée par un endpoint manquant.

Sous-liste « dépend d’un enrichissement API recommandé (non bloquant) » :

- Bannière RDV + coût total + sentBy fiables **si** on refuse d’appeler `/api/contacts/:number/messages` en parallèle → alors enrichir `buildConversationDetail` (#37, #26, #22).
