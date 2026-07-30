import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Card,
  Button,
  Chip,
  Glass,
  Range,
  Segmented,
  SegmentedButton,
  Toggle,
  List,
  ListItem,
} from "konsta/react";
import { useState } from "react";

const CHIPS = ["Tout", "Action", "Puzzle", "Indie", "Apple Arcade"];

export default function ArcadePage() {
  const [chip, setChip] = useState("Apple Arcade");
  const [volume, setVolume] = useState(55);
  const [difficulty, setDifficulty] = useState("normal");
  const [cloudSave, setCloudSave] = useState(true);

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Arcade" large transparent className="top-0 sticky" />

      <Block className="mt-2 space-y-3">
        <div className="hero-card hero-mint">
          <p className="hero-kicker">Page 2 · Arcade</p>
          <h2>Game Center</h2>
          <p>Chips, volume slider et cards.</p>
        </div>
        <div className="hero-card hero-orange">
          <h2>Neon Circuit</h2>
          <p>Contraste chaud pour le verre du Tabbar.</p>
        </div>
      </Block>

      <BlockTitle>Filtres</BlockTitle>
      <Block className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <Chip
            key={c}
            className="cursor-pointer"
            colors={
              chip === c
                ? { fillBgIos: "bg-primary", fillTextIos: "text-white" }
                : undefined
            }
            onClick={() => setChip(c)}
          >
            {c}
          </Chip>
        ))}
      </Block>

      <BlockTitle>Audio</BlockTitle>
      <Block>
        <Glass className="rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-semibold">Volume</span>
            <span className="text-[13px] opacity-60">{volume}%</span>
          </div>
          <Range
            value={volume}
            min={0}
            max={100}
            step={1}
            onInput={(e) => setVolume(Number(e.target.value))}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
          <div className="mt-4">
            <p className="text-[13px] opacity-60 mb-2 m-0">Difficulté</p>
            <Segmented strong round>
              {["easy", "normal", "hard"].map((d) => (
                <SegmentedButton
                  key={d}
                  active={difficulty === d}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </SegmentedButton>
              ))}
            </Segmented>
          </div>
        </Glass>
      </Block>

      <BlockTitle>Jeux · {chip}</BlockTitle>
      <Block className="space-y-3">
        <Card
          header="Ocean Drift"
          footer={
            <div className="flex gap-2">
              <Button rounded small>
                Jouer
              </Button>
              <Button rounded small tonal>
                Trailer
              </Button>
            </div>
          }
        >
          Cloud {cloudSave ? "on" : "off"} · {difficulty}
        </Card>
      </Block>

      <List strongIos outlineIos>
        <ListItem
          title="Sauvegarde iCloud"
          after={<Toggle checked={cloudSave} onChange={() => setCloudSave((v) => !v)} />}
        />
      </List>
    </Page>
  );
}
