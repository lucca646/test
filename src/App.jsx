import { useState } from "react";
import { LiquidGlassFilters } from "./LiquidGlassFilter.jsx";
import GlassDock from "./GlassDock.jsx";

export default function App() {
  const [tab, setTab] = useState("arcade");

  return (
    <>
      <LiquidGlassFilters />
      <div className="stage">
        <header className="stage-header">
          <p className="eyebrow">Repo test</p>
          <h1>Liquid Glass</h1>
          <p className="lede">
            Dock flottant avec lentille SDF, aberration chromatique et specular.
            Ouvre dans Chrome pour la réfraction live.
          </p>
        </header>

        <section className="cards" aria-label="Fond décoratif">
          <article className="card card--blue">
            <h2>Horizon</h2>
            <p>Carte bleue pour faire lire la réfraction.</p>
          </article>
          <article className="card card--orange">
            <h2>Arcade</h2>
            <p>Contraste chaud derrière la goutte de verre.</p>
          </article>
          <article className="card card--mint">
            <h2>Recherche</h2>
            <p>Change d’onglet pour voir la lentille glisser.</p>
          </article>
        </section>

        <p className="hint">
          Onglet actif : <strong>{tab}</strong>
        </p>
      </div>

      <GlassDock activeId={tab} onChange={setTab} />
    </>
  );
}
