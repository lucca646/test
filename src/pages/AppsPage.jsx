import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  List,
  ListItem,
  Button,
  Glass,
} from "konsta/react";

export default function AppsPage() {
  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Apps" large transparent className="top-0 sticky" />

      <Block className="mt-2">
        <div className="hero-card hero-blue">
          <p className="hero-kicker">Page 3 · Apps</p>
          <h2>Apps pour vous</h2>
          <p>Grille et listes sous le verre du Tabbar.</p>
        </div>
      </Block>

      <BlockTitle>Essentiels</BlockTitle>
      <List strongIos outlineIos>
        <ListItem title="Photos" subtitle="Galerie" after={<Button small rounded>Ouvrir</Button>} />
        <ListItem title="Musique" subtitle="Streaming" after={<Button small rounded>Ouvrir</Button>} />
        <ListItem title="Plans" subtitle="Navigation" after={<Button small rounded>Ouvrir</Button>} />
      </List>

      <BlockTitle>Éditeur</BlockTitle>
      <Block>
        <Glass className="rounded-2xl p-4">
          <p className="m-0 text-[15px] font-semibold">Collection du jour</p>
          <p className="m-0 mt-1 text-[13px] opacity-70">
            Contenu derrière la barre pour juger le frost + la lentille.
          </p>
        </Glass>
      </Block>
    </Page>
  );
}
