import { useCallback, useRef } from "react";
import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Button,
  Glass,
} from "konsta/react";
import { HOME } from "app-nav";
import DynamicIslandWeb from "../components/DynamicIslandWeb.jsx";
import IslandBridgePanel from "../components/IslandBridgePanel.jsx";
import { useIslandBridge } from "../bridge/useIslandBridge.js";
import { usePlatform } from "../platform/PlatformContext.jsx";

/** Même structure que mobile/app/index — contenu HOME partagé. */
function WebappToday() {
  return (
    <div className="wa-home">
      <section
        className="wa-hero"
        style={{
          background: `linear-gradient(145deg, ${HOME.tint[0]}, ${HOME.tint[1]} 55%, #0b0b12)`,
        }}
      >
        <p className="wa-hero-kicker">{HOME.kicker}</p>
        <h1>{HOME.title}</h1>
        <p>{HOME.body}</p>
      </section>

      <p className="wa-section-title">Sur l’île</p>
      <DynamicIslandWeb />
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
