import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  List,
  ListItem,
  Searchbar,
  Button,
  Glass,
  Range,
  Chip,
  Segmented,
  SegmentedButton,
} from "konsta/react";
import { useMemo, useState } from "react";

const ITEMS = [
  { title: "Liquid Glass", tag: "UI" },
  { title: "Tabbar iOS 26", tag: "Nav" },
  { title: "Navbar transparente", tag: "Nav" },
  { title: "Slider Range", tag: "Form" },
  { title: "Boutons rounded", tag: "Form" },
  { title: "Konsta UI Glass", tag: "UI" },
  { title: "Segmented control", tag: "Form" },
  { title: "Toggle", tag: "Form" },
  { title: "Despia publish", tag: "Ship" },
];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("all");
  const [radius, setRadius] = useState(40);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ITEMS.filter((item) => {
      const matchQ = !needle || item.title.toLowerCase().includes(needle);
      const matchScope = scope === "all" || item.tag.toLowerCase() === scope;
      return matchQ && matchScope;
    });
  }, [q, scope]);

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Recherche" large transparent className="top-0 sticky" />

      <Block className="mt-2 space-y-3">
        <div className="hero-card hero-purple">
          <p className="hero-kicker">Page 3 · Search</p>
          <h2>Explorer</h2>
          <p>Searchbar + filtres + slider de rayon — page distincte.</p>
        </div>

        <Searchbar
          value={q}
          onInput={(e) => setQ(e.target.value)}
          onClear={() => setQ("")}
          placeholder="Rechercher un composant"
          disableButton={false}
        />
      </Block>

      <BlockTitle>Portée</BlockTitle>
      <Block>
        <Segmented strong round>
          {[
            ["all", "Tout"],
            ["ui", "UI"],
            ["form", "Form"],
            ["nav", "Nav"],
          ].map(([id, label]) => (
            <SegmentedButton key={id} active={scope === id} onClick={() => setScope(id)}>
              {label}
            </SegmentedButton>
          ))}
        </Segmented>
      </Block>

      <BlockTitle>Rayon</BlockTitle>
      <Block>
        <Glass className="rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-semibold">Distance</span>
            <span className="text-[13px] opacity-60">{radius} km</span>
          </div>
          <Range
            value={radius}
            min={1}
            max={100}
            step={1}
            onInput={(e) => setRadius(Number(e.target.value))}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
          <div className="mt-3 flex gap-2">
            <Button rounded small onClick={() => setRadius(10)}>
              10
            </Button>
            <Button rounded small tonal onClick={() => setRadius(40)}>
              40
            </Button>
            <Button rounded small outline onClick={() => setRadius(100)}>
              100
            </Button>
          </div>
        </Glass>
      </Block>

      <BlockTitle>
        Résultats · {results.length}
      </BlockTitle>
      <List strongIos outlineIos>
        {results.map((item) => (
          <ListItem
            key={item.title}
            title={item.title}
            after={<Chip className="!m-0">{item.tag}</Chip>}
            link="#"
          />
        ))}
      </List>
    </Page>
  );
}
