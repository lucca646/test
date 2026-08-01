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

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Aujourd'hui" large transparent className="top-0 sticky" />

      <Block className="space-y-3 mt-2">
        <div className={`hero-card hero-blue platform-hero-${platform}`}>
          <p className="hero-kicker">LIQUID GLASS · WEB</p>
          <h2>Version web</h2>
          <p>
            Navigation en haut, layout navigateur. Les skins iOS / Android
            restent dans le lab (<code>?lab=1</code>).
          </p>
        </div>
      </Block>

      {!lab && (
        <>
          <BlockTitle>Expérience web</BlockTitle>
          <Block>
            <Glass className="rounded-2xl p-4 space-y-2">
              <p className="text-[15px] font-semibold m-0">Adapté au navigateur</p>
              <p className="text-[13px] opacity-70 m-0 leading-snug">
                Onglets en haut · mêmes pages (Aujourd’hui, Jeux, Arcade, Apps)
                · source nav unique <code>app-nav</code>.
              </p>
            </Glass>
          </Block>
        </>
      )}

      {lab && (platform === "ios" || platform === "web") && (
        <>
          <BlockTitle>Playground île + bridge (lab)</BlockTitle>
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

      {lab && platform === "android" && (
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

      <BlockTitle>Stack</BlockTitle>
      <Block className="space-y-3">
        <Glass className="rounded-2xl p-4 space-y-2">
          <p className="text-[15px] font-semibold m-0">Pages partagées</p>
          <p className="text-[13px] opacity-70 m-0 leading-snug">
            Même contenu applicatif — le chrome suit la plateforme ({meta.label}
            ).
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
