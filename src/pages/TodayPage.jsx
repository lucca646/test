import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Button,
  Glass,
} from "konsta/react";
import DynamicIslandWeb from "../components/DynamicIslandWeb.jsx";

export default function TodayPage() {
  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Aujourd'hui" large transparent className="top-0 sticky" />

      <Block className="space-y-3 mt-2">
        <div className="hero-card hero-blue">
          <p className="hero-kicker">Miroir web · Liquid Glass</p>
          <h2>Version HTML / CSS</h2>
          <p>
            Même shell que l’app native (dock plugin + onglets), avec des
            animations CSS que tu peux régler ici.
          </p>
        </div>
      </Block>

      <BlockTitle>Playground île</BlockTitle>
      <Block>
        <DynamicIslandWeb />
      </Block>

      <BlockTitle>Plugins web</BlockTitle>
      <Block className="space-y-3">
        <Glass className="rounded-2xl p-4 space-y-2">
          <p className="text-[15px] font-semibold m-0">liquid-glass-nav</p>
          <p className="text-[13px] opacity-70 m-0 leading-snug">
            Dock flottant en bas — package local{" "}
            <code className="text-[12px] opacity-90">packages/liquid-glass-nav</code>{" "}
            (CSS + SVG filters).
          </p>
        </Glass>
        <Glass className="rounded-2xl p-4 space-y-2">
          <p className="text-[15px] font-semibold m-0">Konsta UI</p>
          <p className="text-[13px] opacity-70 m-0 leading-snug">
            Composants iOS (Navbar, Glass, List…) en React + Tailwind.
          </p>
        </Glass>
        <div className="flex flex-wrap gap-2">
          <Button rounded href="#island">
            Voir l’île
          </Button>
          <Button rounded tonal onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Haut de page
          </Button>
        </div>
      </Block>
    </Page>
  );
}
