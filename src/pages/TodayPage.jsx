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
} from "konsta/react";
import { useState } from "react";

export default function TodayPage() {
  const [period, setPeriod] = useState("week");

  return (
    <Page>
      <Navbar title="Aujourd'hui" large transparent className="top-0 sticky" />

      <Block className="space-y-3 mt-2">
        <div className="hero-card hero-blue">
          <h2>Horizon</h2>
          <p>Fond coloré pour faire lire le Liquid Glass iOS 26.</p>
        </div>
        <div className="hero-card hero-orange">
          <h2>Arcade</h2>
          <p>Transitions Framework7 · Cover / Fade / Parallax.</p>
        </div>
      </Block>

      <BlockTitle>Actions</BlockTitle>
      <Block className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button rounded>Continuer</Button>
          <Button rounded tonal>
            Explorer
          </Button>
          <Button rounded outline>
            Plus tard
          </Button>
        </div>

        <Glass className="rounded-2xl p-4">
          <p className="text-[15px] font-semibold m-0 mb-1">Surface Glass</p>
          <p className="text-[13px] opacity-70 m-0">
            Composant <code>Glass</code> Konsta UI — même matériau que Navbar /
            Tabbar.
          </p>
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

      <BlockTitle>Liste</BlockTitle>
      <List strongIos outlineIos>
        <ListItem title="Favoris" after={<Badge>12</Badge>} link="#" media="★" />
        <ListItem title="Nouveautés" after="3" link="#" media="✦" />
        <ListItem title="Collections" link="#" media="◎" />
      </List>
    </Page>
  );
}
