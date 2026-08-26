/**
 * État du domicile + du véhicule, et actions qui le modifient.
 *
 * Aucun réseau : les appareils sont simulés en mémoire, avec une latence
 * volontaire pour que l'UI CarPlay montre son indicateur d'activité (le
 * `Promise` retourné par `onItemSelect` pilote le spinner natif). Brancher un
 * vrai back-end revient à remplacer `apply()` par un appel HTTP — le reste de
 * l'app n'a pas à changer.
 *
 * Le store est un `ExternalStore` compatible `useSyncExternalStore` : un
 * instantané immuable, régénéré uniquement quand quelque chose bouge, pour que
 * React ne re-rende pas dans le vide.
 */

export type DeviceKind =
  | "bulb"
  | "gate"
  | "garage"
  | "thermo"
  | "shield"
  | "bolt"
  | "plug";

export type Zone = "home" | "vehicle";

export interface Device {
  id: string;
  name: string;
  zone: Zone;
  /** Pièce ou emplacement, affiché en sous-titre. */
  place: string;
  kind: DeviceKind;
  on: boolean;
  /** Mesure remontée par l'appareil quand il est actif (« 21 °C », « 64 % »). */
  reading?: string;
}

export interface Scene {
  id: string;
  /**
   * Titres du plus long au plus court. CarPlay retient le premier qui tient
   * dans la place disponible — elle varie d'une voiture à l'autre.
   */
  titleVariants: string[];
  icon: "home" | "departure" | "gate" | "garage" | "bulb" | "thermo" | "shield" | "power";
  /** Une ligne, reprise dans la confirmation et dans le journal. */
  summary: string;
  /** État visé ; un appareil absent de la table n'est pas touché. */
  targets?: Record<string, boolean>;
  /** Appareils dont on inverse l'état (portail, garage…). */
  toggles?: string[];
  /** Tous les appareils cités passent à `false` — ignore `targets`/`toggles`. */
  allOff?: boolean;
  /** Passe par une feuille de confirmation avant d'agir. */
  confirm?: boolean;
}

export interface Entry {
  at: number;
  text: string;
}

export interface HomeState {
  devices: Device[];
  /** Scène en cours, pour griser l'UI iPhone pendant l'exécution. */
  running: string | null;
  /** Journal des actions, la plus récente en tête. */
  log: Entry[];
  outsideTemp: number;
  cabinTemp: number;
  syncedAt: number;
}

// ---------------------------------------------------------------------------
// Données
// ---------------------------------------------------------------------------

const INITIAL_DEVICES: Device[] = [
  { id: "hall", name: "Entrée", zone: "home", place: "Rez-de-chaussée", kind: "bulb", on: false },
  { id: "living", name: "Salon", zone: "home", place: "Rez-de-chaussée", kind: "bulb", on: false },
  { id: "outdoor", name: "Éclairage extérieur", zone: "home", place: "Allée", kind: "bulb", on: false },
  { id: "gate", name: "Portail", zone: "home", place: "Allée", kind: "gate", on: false },
  { id: "garage", name: "Porte de garage", zone: "home", place: "Garage", kind: "garage", on: false },
  { id: "heating", name: "Chauffage", zone: "home", place: "Maison", kind: "thermo", on: false },
  { id: "alarm", name: "Alarme", zone: "home", place: "Maison", kind: "shield", on: true },
  { id: "preheat", name: "Préchauffage habitacle", zone: "vehicle", place: "Véhicule", kind: "thermo", on: false },
  { id: "charge", name: "Charge", zone: "vehicle", place: "Borne garage", kind: "bolt", on: true },
  { id: "socket", name: "Prise garage", zone: "vehicle", place: "Garage", kind: "plug", on: true },
];

export const SCENES: Scene[] = [
  {
    id: "arrival",
    titleVariants: ["Arrivée maison", "Arrivée"],
    icon: "home",
    summary: "Portail et garage ouverts, entrée allumée, chauffage relancé",
    targets: { gate: true, garage: true, hall: true, outdoor: true, heating: true, alarm: false },
  },
  {
    id: "departure",
    titleVariants: ["Départ maison", "Départ"],
    icon: "departure",
    summary: "Tout éteint côté maison, alarme armée",
    targets: {
      hall: false, living: false, outdoor: false, heating: false,
      gate: false, garage: false, alarm: true,
    },
  },
  {
    id: "gate",
    titleVariants: ["Ouvrir le portail", "Portail"],
    icon: "gate",
    summary: "Bascule le portail",
    toggles: ["gate"],
  },
  {
    id: "garage",
    titleVariants: ["Ouvrir le garage", "Garage"],
    icon: "garage",
    summary: "Bascule la porte de garage",
    toggles: ["garage"],
  },
  {
    id: "lights",
    titleVariants: ["Lumières maison", "Lumières"],
    icon: "bulb",
    summary: "Bascule l'ensemble des éclairages",
    toggles: ["hall", "living", "outdoor"],
  },
  {
    id: "heating",
    titleVariants: ["Chauffage maison", "Chauffage"],
    icon: "thermo",
    summary: "Bascule le chauffage et le préchauffage habitacle",
    toggles: ["heating", "preheat"],
  },
  {
    id: "alarm",
    titleVariants: ["Armer l'alarme", "Alarme"],
    icon: "shield",
    summary: "Bascule l'alarme",
    toggles: ["alarm"],
  },
  {
    id: "allOff",
    titleVariants: ["Tout couper", "Tout"],
    icon: "power",
    summary: "Coupe tous les appareils, alarme comprise",
    allOff: true,
    confirm: true,
  },
];

/** Latence simulée d'un aller-retour vers une passerelle domotique. */
const LATENCY_MS = 700;

/** Nombre d'entrées gardées dans le journal. */
const LOG_SIZE = 12;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let state: HomeState = {
  devices: INITIAL_DEVICES.map((d) => ({ ...d })),
  running: null,
  log: [],
  outsideTemp: 14,
  cabinTemp: 11,
  syncedAt: Date.now(),
};

const listeners = new Set<() => void>();

export function getState(): HomeState {
  return state;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Remplace l'instantané et prévient les abonnés. `patch` est superficiel. */
function commit(patch: Partial<HomeState>): void {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

function withReadings(devices: Device[]): Device[] {
  return devices.map((d) => {
    if (d.kind === "thermo") {
      const target = d.zone === "vehicle" ? 20 : 19;
      return { ...d, reading: d.on ? `${target} °C` : undefined };
    }
    if (d.kind === "bolt") {
      return { ...d, reading: d.on ? "en charge · 64 %" : "64 %" };
    }
    return d;
  });
}

function push(text: string): Entry[] {
  return [{ at: Date.now(), text }, ...state.log].slice(0, LOG_SIZE);
}

export function device(id: string): Device | undefined {
  return state.devices.find((d) => d.id === id);
}

export function devicesIn(zone: Zone): Device[] {
  return state.devices.filter((d) => d.zone === zone);
}

export function activeCount(): number {
  return state.devices.filter((d) => d.on).length;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function applyMap(next: Record<string, boolean>): void {
  commit({
    devices: withReadings(
      state.devices.map((d) => (d.id in next ? { ...d, on: next[d.id] } : d)),
    ),
    syncedAt: Date.now(),
  });
}

export function setDevice(id: string, on: boolean): void {
  const d = device(id);
  if (!d || d.on === on) return;
  applyMap({ [id]: on });
  commit({ log: push(`${d.name} · ${on ? "activé" : "coupé"}`) });
}

export function toggleDevice(id: string): void {
  const d = device(id);
  if (d) setDevice(id, !d.on);
}

/**
 * Applique une scène. Retourne un couple titre/détail prêt à afficher.
 * Le délai est là pour exercer les indicateurs d'activité de CarPlay ; il
 * disparaîtra le jour où un vrai appel réseau prendra sa place.
 */
export async function runScene(id: string): Promise<{ title: string; detail: string }> {
  const scene = SCENES.find((s) => s.id === id);
  if (!scene) return { title: "Action inconnue", detail: "" };

  commit({ running: id });
  await new Promise((r) => setTimeout(r, LATENCY_MS));

  const next: Record<string, boolean> = {};
  if (scene.allOff) {
    state.devices.forEach((d) => {
      next[d.id] = false;
    });
  } else if (scene.toggles) {
    // Un groupe se bascule d'un bloc : si au moins un est allumé, tout s'éteint.
    const anyOn = scene.toggles.some((did) => device(did)?.on);
    scene.toggles.forEach((did) => {
      next[did] = !anyOn;
    });
  }
  Object.assign(next, scene.targets ?? {});

  const changed = Object.keys(next).filter((did) => device(did)?.on !== next[did]);
  applyMap(next);

  const short = scene.titleVariants[scene.titleVariants.length - 1];
  const detail = changed.length
    ? `${changed.length} appareil${changed.length > 1 ? "s" : ""} mis à jour`
    : "Rien à changer, tout était déjà en place";

  commit({ running: null, log: push(`${short} · ${detail}`) });
  return { title: short, detail };
}

// ---------------------------------------------------------------------------
// Rafraîchissement ambiant
// ---------------------------------------------------------------------------

/**
 * Le CarPlay Developer Guide interdit aux apps « driving task » de rafraîchir
 * leurs données plus d'une fois toutes les 10 secondes. On tient 15 s, avec de
 * la marge : c'est un plancher, pas une cible.
 */
const AMBIENT_MS = 15_000;

let timer: ReturnType<typeof setInterval> | null = null;

function drift(value: number, target: number): number {
  const delta = target - value;
  if (Math.abs(delta) < 0.3) return target;
  return Math.round((value + delta * 0.35) * 10) / 10;
}

export function startAmbient(): void {
  if (timer) return;
  timer = setInterval(() => {
    const heating = device("heating")?.on;
    const preheat = device("preheat")?.on;
    commit({
      outsideTemp: drift(state.outsideTemp, 14),
      cabinTemp: drift(state.cabinTemp, preheat ? 20 : heating ? 16 : 11),
      syncedAt: Date.now(),
      devices: withReadings(state.devices),
    });
  }, AMBIENT_MS);
}

export function stopAmbient(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

/** Force une synchro, sans attendre le prochain tick. */
export function refresh(): void {
  commit({ syncedAt: Date.now(), devices: withReadings(state.devices) });
}

export function formatTime(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Les lectures initiales (température, charge) doivent exister dès le premier
// rendu, sinon la première ligne du template Information arrive vide.
state = { ...state, devices: withReadings(state.devices) };
