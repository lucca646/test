import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Button,
  Glass,
  List,
  ListItem,
  Badge,
  Segmented,
  SegmentedButton,
  Range,
  Stepper,
  Toggle,
} from "konsta/react";
import { useState } from "react";

export default function TodayPage() {
  const [period, setPeriod] = useState("week");
  const [brightness, setBrightness] = useState(72);
  const [count, setCount] = useState(3);
  const [focus, setFocus] = useState(true);

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Aujourd'hui" large transparent className="top-0 sticky" />

      <Block className="space-y-3 mt-2">
        <div className="hero-card hero-blue">
          <p className="hero-kicker">Page 1 · Today</p>
          <h2>Bonjour</h2>
          <p>Résumé du jour — boutons, slider et stepper iOS.</p>
        </div>
      </Block>

      <BlockTitle>Raccourcis</BlockTitle>
      <Block className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button rounded>Continuer</Button>
          <Button rounded tonal>
            Planifier
          </Button>
          <Button rounded outline>
            Plus tard
          </Button>
          <Button rounded clear>
            Ignorer
          </Button>
        </div>

        <Glass className="rounded-2xl p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] font-semibold">Luminosité</span>
              <span className="text-[13px] opacity-60">{brightness}%</span>
            </div>
            <Range
              value={brightness}
              min={0}
              max={100}
              step={1}
              onInput={(e) => setBrightness(Number(e.target.value))}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold">Rappels</span>
            <Stepper
              value={count}
              onPlus={() => setCount((v) => Math.min(v + 1, 12))}
              onMinus={() => setCount((v) => Math.max(v - 1, 0))}
            />
          </div>
        </Glass>
      </Block>

      <BlockTitle>Période</BlockTitle>
      <Block>
        <Segmented strong round>
          <SegmentedButton active={period === "day"} onClick={() => setPeriod("day")}>
            Jour
          </SegmentedButton>
          <SegmentedButton active={period === "week"} onClick={() => setPeriod("week")}>
            Semaine
          </SegmentedButton>
          <SegmentedButton active={period === "month"} onClick={() => setPeriod("month")}>
            Mois
          </SegmentedButton>
        </Segmented>
      </Block>

      <BlockTitle>Focus</BlockTitle>
      <List strongIos outlineIos>
        <ListItem
          title="Mode Focus"
          after={<Toggle checked={focus} onChange={() => setFocus((v) => !v)} />}
        />
        <ListItem title="Favoris" after={<Badge>12</Badge>} link />
        <ListItem title="Nouveautés" after="3" link />
      </List>
    </Page>
  );
}
