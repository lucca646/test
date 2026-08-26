/**
 * Templates « présentés » par-dessus la pile : confirmation, accusé de
 * réception, dictée.
 *
 * Contrainte structurante : le constructeur de `Template`
 * (react-native-carplay) abonne six écouteurs à l'émetteur natif et ne les
 * retire jamais. Créer un template à chaque affichage fait donc grossir la
 * table d'écouteurs indéfiniment. Tous les templates d'ici sont créés une
 * seule fois puis réutilisés — c'est aussi la raison pour laquelle leurs
 * textes sont figés à la construction (aucune méthode `update…` native
 * n'existe pour les alertes et les feuilles d'action).
 */
import {
  ActionSheetTemplate,
  AlertTemplate,
  CarPlay,
  VoiceControlTemplate,
} from "react-native-carplay";

import { SCENES } from "../../src/home";
import { BAR } from "./icons";

/** Durée d'affichage d'un accusé de réception avant fermeture automatique. */
const ACK_MS = 2200;

/** Laps laissé à CarPlay pour refermer un overlay avant d'en présenter un autre. */
const SWAP_MS = 320;

type Overlay = AlertTemplate | ActionSheetTemplate | VoiceControlTemplate;

/**
 * Jeton de l'overlay affiché. Évite qu'une fermeture différée n'emporte un
 * template présenté entre-temps par autre chose.
 */
let presented: symbol | null = null;

/**
 * CarPlay n'affiche qu'un overlay à la fois : présenter par-dessus un autre
 * échoue en silence. Enchaîner deux scènes rapidement ferait donc disparaître
 * le second accusé de réception — on referme d'abord, puis on présente.
 */
function present(template: Overlay, token: symbol): void {
  const swap = presented !== null;
  presented = token;
  const show = () => {
    if (presented !== token) return;
    CarPlay.presentTemplate(template);
  };
  if (swap) {
    CarPlay.dismissTemplate();
    setTimeout(show, SWAP_MS);
  } else {
    show();
  }
}

function dismissIfStill(token: symbol): void {
  if (presented !== token) return;
  presented = null;
  CarPlay.dismissTemplate();
}

export function dismissOverlay(): void {
  presented = null;
  CarPlay.dismissTemplate();
}

// ---------------------------------------------------------------------------
// Accusé de réception
// ---------------------------------------------------------------------------

/**
 * Une alerte par scène, texte figé. Le détail chiffré (« 4 appareils mis à
 * jour ») n'est volontairement pas ici : le guide CarPlay demande le minimum
 * de texte à l'écran, il vit dans le journal de l'onglet « État ».
 */
const acks = new Map<string, AlertTemplate>();

function ackFor(sceneId: string): AlertTemplate | undefined {
  const cached = acks.get(sceneId);
  if (cached) return cached;

  const scene = SCENES.find((s) => s.id === sceneId);
  if (!scene) return undefined;

  const short = scene.titleVariants[scene.titleVariants.length - 1];
  const template = new AlertTemplate({
    id: `cp-ack-${sceneId}`,
    titleVariants: [`${short} — c'est fait`, `${short} ✓`],
    actions: [{ id: "ok", title: "OK", style: "default" }],
    onActionButtonPressed: () => dismissOverlay(),
  });
  acks.set(sceneId, template);
  return template;
}

/** Affiche l'accusé d'une scène, refermé tout seul au bout de `ACK_MS`. */
export function acknowledge(sceneId: string): void {
  const template = ackFor(sceneId);
  if (!template) return;
  const token = Symbol(sceneId);
  present(template, token);
  setTimeout(() => dismissIfStill(token), ACK_MS);
}

// ---------------------------------------------------------------------------
// Confirmation
// ---------------------------------------------------------------------------

const sheets = new Map<string, ActionSheetTemplate>();

/**
 * Feuille de confirmation pour les scènes marquées `confirm`. Le callback est
 * mémorisé à part : le template, lui, ne change plus après sa création.
 */
let onConfirmed: (() => void) | null = null;

function sheetFor(sceneId: string): ActionSheetTemplate | undefined {
  const cached = sheets.get(sceneId);
  if (cached) return cached;

  const scene = SCENES.find((s) => s.id === sceneId);
  if (!scene) return undefined;

  const template = new ActionSheetTemplate({
    id: `cp-confirm-${sceneId}`,
    title: scene.titleVariants[0],
    message: scene.summary,
    actions: [
      { id: "cancel", title: "Annuler", style: "cancel" },
      { id: "go", title: "Confirmer", style: "destructive" },
    ],
    onActionButtonPressed: ({ id }) => {
      const run = id === "go" ? onConfirmed : null;
      onConfirmed = null;
      dismissOverlay();
      run?.();
    },
  });
  sheets.set(sceneId, template);
  return template;
}

export function confirm(sceneId: string, then: () => void): void {
  const template = sheetFor(sceneId);
  if (!template) {
    then();
    return;
  }
  onConfirmed = then;
  present(template, Symbol(sceneId));
}

// ---------------------------------------------------------------------------
// Dictée
// ---------------------------------------------------------------------------

/**
 * ⚠️ Démonstration du template, pas une vraie reconnaissance vocale.
 *
 * `CPVoiceControlTemplate` est prévu pour être affiché PENDANT une prise de
 * son : il faut le brancher sur `SFSpeechRecognizer` (et déclarer
 * `NSSpeechRecognitionUsageDescription` + `NSMicrophoneUsageDescription`)
 * avant toute soumission à Apple. En l'état il enchaîne ses états sur une
 * minuterie, pour donner à voir le rendu à l'écran de la voiture.
 */
const voice = new VoiceControlTemplate({
  id: "cp-voice",
  voiceControlStates: [
    {
      identifier: "listening",
      titleVariants: ["Je vous écoute", "Écoute"],
      image: BAR.mic,
      repeats: true,
    },
    {
      identifier: "working",
      titleVariants: ["Un instant…", "…"],
      image: BAR.mic,
      repeats: true,
    },
  ],
});

export function startVoice(then: () => void): void {
  const token = Symbol("voice");
  // Pas d'`activateVoiceControlState` ici : « the Voice Control template will
  // begin on the first state specified », et l'appeler avant que le template
  // soit présenté n'a de toute façon aucun effet (CPVoiceControlTemplate.h).
  present(voice, token);
  setTimeout(() => {
    if (presented !== token) return;
    voice.activateVoiceControlState("working");
    setTimeout(() => {
      if (presented !== token) return;
      dismissIfStill(token);
      then();
    }, 1100);
  }, 1800);
}
