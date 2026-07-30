import { Page, Navbar } from "framework7-react";
import {
  Block,
  BlockTitle,
  List,
  ListItem,
  Toggle,
  Range,
  Button,
  Glass,
  Stepper,
  Segmented,
  SegmentedButton,
} from "konsta/react";
import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [blur, setBlur] = useState(70);
  const [textSize, setTextSize] = useState(100);
  const [accounts, setAccounts] = useState(2);
  const [theme, setTheme] = useState("dark");

  return (
    <Page name="settings" className="page-glass">
      <Navbar title="Réglages" large transparent />

      <Block className="mt-2">
        <div className="hero-card hero-slate">
          <p className="hero-kicker">Page 4 · Settings</p>
          <h2>Préférences</h2>
          <p>Toggles, steppers et sliders Apple.</p>
        </div>
      </Block>

      <BlockTitle>Apparence</BlockTitle>
      <Block>
        <Segmented strong round>
          <SegmentedButton active={theme === "light"} onClick={() => setTheme("light")}>
            Clair
          </SegmentedButton>
          <SegmentedButton active={theme === "dark"} onClick={() => setTheme("dark")}>
            Sombre
          </SegmentedButton>
          <SegmentedButton active={theme === "auto"} onClick={() => setTheme("auto")}>
            Auto
          </SegmentedButton>
        </Segmented>
      </Block>

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
        <ListItem
          title="Comptes liés"
          after={
            <Stepper
              value={accounts}
              onPlus={() => setAccounts((v) => Math.min(v + 1, 5))}
              onMinus={() => setAccounts((v) => Math.max(v - 1, 0))}
            />
          }
        />
      </List>

      <BlockTitle>Liquid Glass</BlockTitle>
      <Block className="space-y-3">
        <Glass className="rounded-2xl p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] font-semibold">Blur</span>
              <span className="text-[13px] opacity-60">{blur}</span>
            </div>
            <Range
              value={blur}
              min={0}
              max={100}
              step={1}
              onInput={(e) => setBlur(Number(e.target.value))}
              onChange={(e) => setBlur(Number(e.target.value))}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] font-semibold">Taille texte</span>
              <span className="text-[13px] opacity-60">{textSize}%</span>
            </div>
            <Range
              value={textSize}
              min={80}
              max={140}
              step={5}
              onInput={(e) => setTextSize(Number(e.target.value))}
              onChange={(e) => setTextSize(Number(e.target.value))}
            />
          </div>
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
          subtitle="Routing pages"
          after="v9"
          link="https://framework7.io"
          target="_blank"
          external
        />
        <ListItem
          title="Despia"
          subtitle="One-click publish"
          link="https://despia.com"
          target="_blank"
          external
        />
      </List>

      <Block className="space-y-3 pb-10">
        <Button rounded large>
          Publier avec Despia
        </Button>
        <Button rounded large tonal href="https://despia.com" target="_blank">
          Ouvrir despia.com
        </Button>
        <Button rounded large outline>
          Réinitialiser
        </Button>
      </Block>
    </Page>
  );
}
