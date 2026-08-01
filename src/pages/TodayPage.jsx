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

function WebappToday({ onNavigate }) {
  return (
    <div className="wa-home">
      <section className="wa-hero">
        <p className="wa-hero-kicker">Webapp · Coraia</p>
        <h1>Liquid Glass, dans le navigateur</h1>
        <p>
          Même produit que l’app iOS — ici en webapp : barre du haut, panels,
          pas de faux iPhone.
        </p>
        <div className="wa-actions">
          <button
            type="button"
            className="wa-btn wa-btn-primary"
            onClick={() => onNavigate?.("/arcade/")}
          >
            Ouvrir Arcade
          </button>
          <button
            type="button"
            className="wa-btn wa-btn-ghost"
            onClick={() => onNavigate?.("/apps/")}
          >
            Apps
          </button>
        </div>
      </section>

      <p className="wa-section-title">Modules</p>
      <div className="wa-cards">
        <article className="wa-card">
          <h3>Nav unique</h3>
          <p>Onglets depuis <code>app-nav</code> — web + iOS synchronisés.</p>
        </article>
        <article className="wa-card">
          <h3>OTA</h3>
          <p>Changements JS sans rebuild Store (iOS / bientôt Android).</p>
        </article>
        <article className="wa-card">
          <h3>Bridge</h3>
          <p>
            Lab île : <code>?lab=1</code> pour le playground natif.
          </p>
        </article>
      </div>
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
    return <WebappToday onNavigate={onNavigate} />;
  }

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Aujourd'hui" large transparent className="top-0 sticky" />

      <Block className="space-y-3 mt-2">
        <div className={`hero-card hero-blue platform-hero-${platform}`}>
          <p className="hero-kicker">LAB · {meta.label}</p>
          <h2>Playground {meta.label}</h2>
          <p>Skins iOS / Android pour tester le chrome natif.</p>
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
