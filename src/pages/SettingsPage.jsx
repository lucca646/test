import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  List,
  ListItem,
  Toggle,
  Range,
  Button,
  Glass,
} from "konsta/react";
import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [blur, setBlur] = useState(70);

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Réglages" large transparent className="top-0 sticky" />

      <BlockTitle className="mt-4">Apparence</BlockTitle>
      <List strongIos outlineIos>
        <ListItem
          title="Notifications"
          after={
            <Toggle
              checked={notifications}
              onChange={() => setNotifications((v) => !v)}
            />
          }
        />
        <ListItem
          title="Haptics"
          after={<Toggle checked={haptics} onChange={() => setHaptics((v) => !v)} />}
        />
        <ListItem
          title="Réduire les mouvements"
          after={
            <Toggle
              checked={reduceMotion}
              onChange={() => setReduceMotion((v) => !v)}
            />
          }
        />
      </List>

      <BlockTitle>Intensité glass</BlockTitle>
      <Block>
        <Glass className="rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-semibold">Blur</span>
            <span className="text-[13px] opacity-60">{blur}</span>
          </div>
          <Range
            value={blur}
            min={0}
            max={100}
            step={1}
            onChange={(e) => setBlur(Number(e.target.value))}
          />
        </Glass>
      </Block>

      <BlockTitle>Stack</BlockTitle>
      <List strongIos outlineIos>
        <ListItem
          title="Konsta UI"
          subtitle="iOS 26 Liquid Glass"
          after="v5"
          link="https://konstaui.com/"
          target="_blank"
          external
        />
        <ListItem
          title="Framework7"
          subtitle="Routing + transitions natives"
          after="v9"
          link="https://framework7.io"
          target="_blank"
          external
        />
        <ListItem
          title="Despia"
          subtitle="One-click publish mobile"
          link="https://despia.com"
          target="_blank"
          external
        />
      </List>

      <Block className="space-y-3 pb-8">
        <Button rounded large>
          Publier avec Despia
        </Button>
        <Button rounded large tonal href="https://despia.com" target="_blank">
          Ouvrir despia.com
        </Button>
      </Block>
    </Page>
  );
}
