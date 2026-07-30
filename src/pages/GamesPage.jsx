import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Chip,
  Glass,
  List,
  ListItem,
  Button,
} from "konsta/react";
import { useState } from "react";

const CHIPS = ["Tout", "Action", "Aventure", "Puzzle", "Sport"];

export default function GamesPage() {
  const [chip, setChip] = useState("Tout");

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Jeux" large transparent className="top-0 sticky" />

      <Block className="mt-2">
        <div className="hero-card hero-orange">
          <p className="hero-kicker">Page 2 · Jeux</p>
          <h2>Jeux à (re)découvrir</h2>
          <p>Liste style App Store derrière le dock.</p>
        </div>
      </Block>

      <BlockTitle>Catégories</BlockTitle>
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

      <BlockTitle>Populaires</BlockTitle>
      <List strongIos outlineIos>
        <ListItem title="Solitaire by MobilityWare" after={<Button small rounded>Obtenir</Button>} />
        <ListItem title="Flow Free+" after={<Button small rounded>Obtenir</Button>} />
        <ListItem title="Monument Valley" after={<Button small rounded>Obtenir</Button>} />
        <ListItem title="Stardew Valley" after={<Button small rounded>Obtenir</Button>} />
      </List>
    </Page>
  );
}
