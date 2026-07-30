import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Card,
  Button,
  Chip,
  Glass,
} from "konsta/react";
import { useState } from "react";

const CHIPS = ["Tout", "Action", "Puzzle", "Indie", "Apple Arcade"];

export default function ArcadePage() {
  const [chip, setChip] = useState("Apple Arcade");

  return (
    <Page>
      <Navbar title="Arcade" large transparent className="top-0 sticky" />

      <Block className="mt-2">
        <div className="hero-card hero-mint">
          <h2>Game Center</h2>
          <p>Cartes + chips dans une UI iOS 26 native-feeling.</p>
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

      <BlockTitle>Jeux</BlockTitle>
      <Block className="space-y-3">
        <Card
          header="Ocean Drift"
          footer={
            <Button rounded small>
              Jouer
            </Button>
          }
        >
          Navigation fluide, look verre dépoli, transitions Cover.
        </Card>
        <Card
          header="Neon Circuit"
          footer={
            <Button rounded small tonal>
              Voir
            </Button>
          }
        >
          Contraste fort derrière le Tabbar glass pour tester la réfraction.
        </Card>
        <Glass className="rounded-3xl p-5">
          <p className="m-0 text-[17px] font-semibold tracking-tight">Filtre actif</p>
          <p className="m-0 mt-1 text-[14px] opacity-70">{chip}</p>
        </Glass>
      </Block>
    </Page>
  );
}
