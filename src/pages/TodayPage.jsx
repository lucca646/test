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

export default function TodayPage() {
  const { platform, meta } = usePlatform();
  const dispatchRef = useRef(null);

  const onBind = useCallback((api) => {
    dispatchRef.current = api?.dispatch ?? null;
  }, []);

  const { status, peers, runScript } = useIslandBridge({
    enabled: platform === "ios" || platform === "web",
    onCommand: (cmd) => {
      dispatchRef.current?.(cmd);
    },
  });

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Aujourd'hui" large transparent className="top-0 sticky" />

      <Block className="space-y-3 mt-2">
        <div className={`hero-card hero-blue platform-hero-${platform}`}>
          <p className="hero-kicker">Même base · {meta.label}</p>
          <h2>Rendu {meta.label}</h2>
          <p>
            Contenu identique — chrome, nav et thème Konsta changent avec le
            sélecteur iOS / Android / Web.
          </p>
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
              <p className="text-[15px] font-semibold m-0">Pas de Dynamic Island</p>
              <p className="text-[13px] opacity-70 m-0 leading-snug">
                Sur Android on garde le même contenu applicatif, avec barre
                Material 3 et thème Konsta <code>material</code>.
              </p>
            </Glass>
          </Block>
        </>
      )}

      {platform === "web" && (
        <>
          <BlockTitle>Layout web</BlockTitle>
          <Block>
            <Glass className="rounded-2xl p-4 space-y-2">
              <p className="text-[15px] font-semibold m-0">Navigateur</p>
              <p className="text-[13px] opacity-70 m-0 leading-snug">
                Onglets en haut, cadre type desktop — utile pour valider le
                responsive sans rebuild natif.
              </p>
            </Glass>
          </Block>
        </>
      )}

      <BlockTitle>Stack commune</BlockTitle>
      <Block className="space-y-3">
        <Glass className="rounded-2xl p-4 space-y-2">
          <p className="text-[15px] font-semibold m-0">Pages partagées</p>
          <p className="text-[13px] opacity-70 m-0 leading-snug">
            Today / Jeux / Apps / Arcade / Recherche — un seul code, 3 skins.
          </p>
        </Glass>
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
