import { LiquidGlassNav } from "liquid-glass-nav";
import {
  Today,
  TodayFill,
  Rocket,
  RocketFill,
  Layers,
  LayersFill,
  Gamecontroller,
  GamecontrollerFill,
  Search,
} from "framework7-icons/react/framework7-icons-react.esm.js";

const ITEMS = [
  {
    id: "/",
    label: "Aujourd'hui",
    icon: <Today className="w-6 h-6" />,
    iconActive: <TodayFill className="w-6 h-6" />,
  },
  {
    id: "/games/",
    label: "Jeux",
    icon: <Rocket className="w-6 h-6" />,
    iconActive: <RocketFill className="w-6 h-6" />,
  },
  {
    id: "/apps/",
    label: "Apps",
    icon: <Layers className="w-6 h-6" />,
    iconActive: <LayersFill className="w-6 h-6" />,
  },
  {
    id: "/arcade/",
    label: "Arcade",
    icon: <Gamecontroller className="w-6 h-6" />,
    iconActive: <GamecontrollerFill className="w-6 h-6" />,
  },
  {
    id: "/search/",
    label: "Recherche",
    icon: <Search className="w-6 h-6" />,
    iconActive: <Search className="w-6 h-6" />,
  },
];

/** Wrapper playground → plugin liquid-glass-nav */
export default function AppTabbar({ activePath, onSelect }) {
  return (
    <LiquidGlassNav
      items={ITEMS}
      activeId={activePath}
      onChange={onSelect}
      activeColor="#0a84ff"
    />
  );
}
