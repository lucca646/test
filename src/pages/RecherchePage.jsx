import { HOME } from "app-nav";

/** Lab web — miroir de l’onglet Recherche iOS COR·ALT. */
export default function RecherchePage() {
  return (
    <div className="page page-coralt">
      <p className="page-kicker">{HOME.kicker}</p>
      <h1 className="page-title">Recherche</h1>
      <p className="page-body">
        Onboarding & file APE × zone. L’app iOS lance les recherches via l’API
        COR·ALT.
      </p>
    </div>
  );
}
