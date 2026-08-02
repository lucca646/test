import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  Chip,
  List,
  ListItem,
} from "konsta/react";
import { useMemo, useState } from "react";
import { ACTU, ACTU_ARTICLES } from "app-nav";
import { usePlatform } from "../platform/PlatformContext.jsx";

function WebappActu({ articles, category, setCategory, categories }) {
  return (
    <div className="wa-home">
      <section
        className="wa-hero"
        style={{
          background: `linear-gradient(145deg, ${ACTU.tint[0]}, ${ACTU.tint[1]} 55%, #0b0b12)`,
        }}
      >
        <p className="wa-hero-kicker">{ACTU.kicker}</p>
        <h1>{ACTU.title}</h1>
        <p>{ACTU.body}</p>
      </section>

      <p className="wa-section-title">Rubriques</p>
      <div className="wa-actu-chips">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`wa-actu-chip${category === c ? " is-on" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="wa-section-title">À la une</p>
      <div className="wa-actu-list">
        {articles.map((a) => (
          <article key={a.id} className="wa-actu-card">
            <header className="wa-actu-meta">
              <span className="wa-actu-source">{a.source}</span>
              <span className="wa-actu-cat">{a.category}</span>
              <span className="wa-actu-time">{a.time}</span>
            </header>
            <h3>{a.title}</h3>
            <p>{a.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function ActuPage() {
  const { lab } = usePlatform();
  const categories = useMemo(
    () => ["Tout", ...new Set(ACTU_ARTICLES.map((a) => a.category))],
    [],
  );
  const [category, setCategory] = useState("Tout");
  const articles =
    category === "Tout"
      ? ACTU_ARTICLES
      : ACTU_ARTICLES.filter((a) => a.category === category);

  if (!lab) {
    return (
      <WebappActu
        articles={articles}
        category={category}
        setCategory={setCategory}
        categories={categories}
      />
    );
  }

  return (
    <Page colors={{ bgIos: "bg-transparent", bgMaterial: "bg-transparent" }}>
      <Navbar title="Actu" large transparent className="top-0 sticky" />

      <Block className="mt-2">
        <div
          className="hero-card"
          style={{
            background: `linear-gradient(145deg, ${ACTU.tint[0]}, ${ACTU.tint[1]})`,
          }}
        >
          <p className="hero-kicker">{ACTU.kicker}</p>
          <h2>{ACTU.title}</h2>
          <p>{ACTU.body}</p>
        </div>
      </Block>

      <BlockTitle>Rubriques</BlockTitle>
      <Block className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Chip
            key={c}
            className="cursor-pointer"
            colors={
              category === c
                ? { fillBgIos: "bg-primary", fillTextIos: "text-white" }
                : undefined
            }
            onClick={() => setCategory(c)}
          >
            {c}
          </Chip>
        ))}
      </Block>

      <BlockTitle>À la une</BlockTitle>
      <List strongIos outlineIos>
        {articles.map((a) => (
          <ListItem
            key={a.id}
            title={a.title}
            subtitle={`${a.source} · ${a.category}`}
            text={a.excerpt}
            after={a.time}
          />
        ))}
      </List>
    </Page>
  );
}
