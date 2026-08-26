/**
 * Images servies aux templates CarPlay.
 *
 * `react-native-carplay` fait passer toute valeur dont la clé finit par
 * « image » dans `resolveAssetSource` : un `require()` classique suffit, Metro
 * choisit @2x ou @3x selon l'écran. Les fichiers sont produits par
 * `tools/make-icons.py` — glyphes blancs sur fond transparent, CarPlay les
 * teinte lui-même selon le thème de la voiture.
 */
import type { ImageSourcePropType } from "react-native";

import type { DeviceKind, Scene } from "../../src/home";

/** 60 × 60 pt — maximum d'Apple pour un `CPGridButton`. */
export const GRID: Record<Scene["icon"], ImageSourcePropType> = {
  home: require("../../assets/carplay/grid/home.png"),
  departure: require("../../assets/carplay/grid/departure.png"),
  gate: require("../../assets/carplay/grid/gate.png"),
  garage: require("../../assets/carplay/grid/garage.png"),
  bulb: require("../../assets/carplay/grid/bulb.png"),
  thermo: require("../../assets/carplay/grid/thermo.png"),
  shield: require("../../assets/carplay/grid/shield.png"),
  power: require("../../assets/carplay/grid/power.png"),
};

/** 44 × 44 pt — `CPListItem.maximumImageSize`. */
export const LIST: Record<DeviceKind, ImageSourcePropType> = {
  bulb: require("../../assets/carplay/list/bulb.png"),
  gate: require("../../assets/carplay/list/gate.png"),
  garage: require("../../assets/carplay/list/garage.png"),
  thermo: require("../../assets/carplay/list/thermo.png"),
  shield: require("../../assets/carplay/list/shield.png"),
  bolt: require("../../assets/carplay/list/bolt.png"),
  plug: require("../../assets/carplay/list/plug.png"),
};

/** ~30 × 30 pt — boutons de barre de navigation. */
export const BAR = {
  refresh: require("../../assets/carplay/bar/refresh.png") as ImageSourcePropType,
  mic: require("../../assets/carplay/bar/mic.png") as ImageSourcePropType,
};
