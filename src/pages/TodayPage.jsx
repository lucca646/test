import { useCallback, useRef } from "react";
import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Button,
  Glass,
} from "konsta/react";
import DynamicIslandWeb from "../components/DynamicIslandWeb.jsx";
import IslandBridgePanel from "../components/IslandBridgePanel.jsx";
import { useIslandBridge } from "../bridge/useIslandBridge.js";
import { usePlatform } from "../platform/PlatformContext.jsx";

function SiteToday({ onNavigate }) {
  return (
    <div className="site-page">
      <section className="site-hero">
        <p className="site-hero-kicker">Coraia · Liquid Glass</p>
        <h1>Le verre, sans la contrainte de l’App Store.</h1>
        <p>
          Une vitrine web pour le même produit — navigation de site, pas une
          copie d’application iPhone dans le navigateur.
        </p>
        <button
          type="button"
          className="site-cta"
          onClick={() => onNavigate?.("/arcade/")}
        >
          Voir Arcade
        </button>
      </section>

      <section className="site-section">
        <h2>Une base, plusieurs surfaces</h2>
        <p>
          Le catalogue d’onglets vit dans un seul module JS. Le site web, l’app
          iOS et bientôt Android le lisent — sans dupliquer la barre.
        </p>
        <div className="site-grid">
          <article>
            <h3>Web</h3>
            <p>Header, typo éditoriale, pages larges.</p>
          </article>
          <article>
            <h3>iOS</h3>
            <p>UITabBar native + île ActivityKit.</p>
          </article>
          <article>
            <h3>OTA</h3>
            <p>Les changements de nav partent en update JS.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default function TodayPage({ onNavigate } = {}) {
  const { platform, meta, lab } = usePlatform();
  const dispatchRef = useRef(null);

  const onBind = useCallback((api) => {
    dispatchRef.current = api?.dispatch ?? null;
  }, []);

  const { status, peers, runScript } = useIslandBridge({
    enabled: lab && (platform === "ios" || platform === "web"),
    onCommand: (cmd) => {
      dispatchRef.current?.(cmd);
    },
  });

  if (!lab) {
    return <SiteToday onNavigate={onNavigate} />;
  }

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Aujourd'hui" large transparent className="top-0 sticky" />

      <Block className="space-y-3 mt-2">
        <div className={`hero-card hero-blue platform-hero-${platform}`}>
          <p className="hero-kicker">LAB · {meta.label}</p>
          <h2>Playground {meta.label}</h2>
          <p>Skins iOS / Android / Web pour tester le chrome natif.</p>
        </div>
      </Block>

      {(platform === "ios" || platform === "web") && (
        <>
          <BlockTitle>Playground île + bridge</BlockTitle>
          <Block>
            <DynamicIslandWeb onBind={onBind} />
            <IslandBridgePanel
              status={status}
              peers={peers}
              onRun={(script) => runScript(script)}
              connectedHint="npm run bridge:island"
            />
          </Block>
        </>
      )}

      {platform === "android" && (
        <>
          <BlockTitle>Surface Material</BlockTitle>
          <Block>
            <Glass className="rounded-2xl p-4 space-y-2">
              <p className="text-[15px] font-semibold m-0">Lab Android</p>
              <p className="text-[13px] opacity-70 m-0 leading-snug">
                Barre Material 3 · thème Konsta material.
              </p>
            </Glass>
          </Block>
        </>
      )}

      <Block className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button rounded>Action primaire</Button>
          <Button rounded tonal>
            Secondaire
          </Button>
        </div>
      </Block>
    </Page>
  );
}
