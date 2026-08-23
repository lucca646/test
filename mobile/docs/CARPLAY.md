# CarPlay — COR·ALT

Interface voiture via **templates natifs Apple**, catégorie **Communication**.

| | |
|--|--|
| Catégorie Apple | **Communication** (`com.apple.developer.carplay-communication`) |
| Icône sur l’accueil CarPlay | Oui (après entitlement Apple) |
| UI | `TabBar` · Messages · Non lus → fiche `Contact` |
| Code | `lib/carplay/` + plugin `plugins/withCarPlay.js` |
| Dépendance | `react-native-carplay` 2.3.0 + patch bridgeless |

## Pourquoi Communication et pas Audio

L’app est un CRM SMS. La catégorie **Audio** exigerait qu’elle soit *« designed
primarily to provide audio playback services »* (Guidelines §1) — elle ne joue
aucun son. Demander `carplay-audio` = refus assuré à la demande d’entitlement.

Communication accepte deux profils : messagerie texte courte **ou** VoIP. On est
sur le premier. L’e-mail est explicitement exclu de la catégorie.

## Onglets

| Onglet | Template | Contenu |
|--------|----------|---------|
| Messages | `ListTemplate` | Conversations : nom + non-lus + heure |
| Non lus | `ListTemplate` | Idem, filtré sur `unread_count > 0` |
| (poussé) | `ContactTemplate` | Nom, numéro, boutons Appeler / Message |

Init : `setupCarPlay()` dans `app/_layout.tsx` (no-op hors iOS natif lié).

## Règles Apple appliquées dans le code

Extraites du *CarPlay Developer Guide* (juin 2026) — chacune est commentée à
l’endroit correspondant dans `lib/carplay/carPlayApp.ts`.

- **§6 — jamais de contenu de message à l’écran.** Les lignes ne portent que des
  métadonnées : nom, nombre de non-lus, horodatage. `last_message` n’est jamais
  lu. Idem pour les notifications : expéditeur seulement, jamais le texte.
- **§4 — uniquement des flux utiles en conduite.** Les anciens onglets *Accueil*,
  *Actions* (compteur, alerte de test) et *Infos* (résolution écran, diagnostic)
  ont été supprimés : c’était du debug, motif de rejet.
- **§2 — ne jamais renvoyer vers l’iPhone.** Aucun texte, même en cas d’erreur
  réseau, ne demande de manipuler le téléphone.
- **§7 — chaque template pour son usage.** Liste = choisir, fiche contact =
  agir sur une personne.
- **Profondeur ≤ 5** templates (root inclus). On en empile 2.
- **12 lignes max** : certaines voitures tronquent les listes, on plafonne.

### Templates autorisés en catégorie Communication

Action sheet · Alert · Grid · List · Tab bar · **Contact** · Information ·
Now playing (iOS 17+) · Voice control (iOS 27+).

❌ **Map, Point of interest, Search** — *« Attempting to use an unsupported
template triggers an exception at runtime. »* Ne pas les importer ici.

## Patch bridgeless (obligatoire)

`patches/react-native-carplay+2.3.0.patch`.

Upstream gate l’émission des évènements sur `RCTEventEmitter.bridge`, qui est
**toujours nil** sous New Architecture (active ici : Reanimated 4 l’impose).
Résultat sans le patch : brancher la voiture pendant que l’app tourne n’envoie
jamais `didConnect` → écran CarPlay vide. Le patch teste aussi
`callableJSModules`, le transport réel en bridgeless.

Le bug est toujours présent en `2.4.1-beta.0` : ne pas « corriger » en montant
de version.

## ⚠️ Entitlement restreint

Apple n’accorde `com.apple.developer.carplay-*` qu’après
[demande CarPlay](https://developer.apple.com/contact/carplay/) + acceptation du
*CarPlay Entitlement Addendum*. Review au cas par cas, **aucun SLA publié**.

| Contexte | État |
|----------|------|
| Build simulateur (`development-simulator`) | ✅ pas de signature, testable tout de suite |
| Build device / TestFlight / App Store | ❌ échoue à la signature sans approbation |

Une fois accordé : activer la capability sur l’App ID → régénérer le
provisioning profile → désactiver *Automatically manage signing*.

> **Pas de rollout progressif.** Apple : *« Once a CarPlay app entitlement is
> added to your app, your app icon will appear on the CarPlay home screen. You
> cannot selectively show or hide CarPlay for certain people. »*

## Builder & tester

```bash
npx eas-cli build -p ios --profile development-simulator
```

Puis dans Xcode : *I/O → External Displays → CarPlay*.

Device / store, **après** obtention de l’entitlement :

```bash
npx eas-cli build -p ios --profile production --auto-submit
```

## Reste à faire avant soumission App Store

- [ ] **Extension SiriKit** — Guidelines Communication §2 impose les 3 intents :
      `INSendMessageIntent`, `INSearchForMessagesIntent`,
      `INSetMessageAttributeIntent`. Nécessite une *Intents App Extension*
      native ; rien en JS ne peut y suppléer.
- [ ] Notifications CarPlay : option `carPlay` à l’autorisation + catégorie
      `allowInCarPlay`, expéditeur seulement dans le titre.
- [ ] Assets : `assets/carplay/contact.png` couvre la fiche contact ; les icônes
      d’onglet utilisent des SF Symbols (`message.fill`, `envelope.badge.fill`),
      recommandé par Apple et automatiquement clair/sombre.

## Notes

- `CarSceneDelegate.m` : `#import "RNCarPlay.h"` (sans `use_frameworks!`).
- Le scene manifest ne déclare **que** la scène CarPlay : y ajouter un
  `UIWindowSceneSessionRoleApplication` pointerait vers une classe delegate
  inexistante et casserait le lancement iPhone.
- Le cache des `ContactTemplate` n’est jamais vidé : `RNCPStore` est un
  singleton qui survit à la déconnexion, et la lib n’enlève pas ses listeners.
  Recréer une fiche connue ferait tirer `onButtonPressed` deux fois.
