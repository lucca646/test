import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  List,
  ListItem,
  Searchbar,
  Preloader,
} from "konsta/react";
import { useMemo, useState } from "react";

const ITEMS = [
  "Liquid Glass",
  "Tabbar iOS 26",
  "Navbar transparente",
  "Framework7 Cover",
  "Framework7 Fade",
  "Framework7 Parallax",
  "Konsta UI Glass",
  "Segmented control",
  "Toggle",
  "List inset",
  "Despia publish",
];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ITEMS;
    return ITEMS.filter((item) => item.toLowerCase().includes(needle));
  }, [q]);

  return (
    <Page>
      <Navbar title="Recherche" large transparent className="top-0 sticky" />

      <Block className="mt-2">
        <Searchbar
          value={q}
          onInput={(e) => setQ(e.target.value)}
          onClear={() => setQ("")}
          placeholder="Rechercher un composant"
          disableButton={false}
        />
      </Block>

      <BlockTitle>
        Résultats {q ? `· ${results.length}` : ""}
      </BlockTitle>

      {results.length === 0 ? (
        <Block className="text-center opacity-60 py-8">
          <Preloader className="mb-3" />
          <p>Aucun résultat</p>
        </Block>
      ) : (
        <List strongIos outlineIos>
          {results.map((item) => (
            <ListItem key={item} title={item} link="#" />
          ))}
        </List>
      )}
    </Page>
  );
}
