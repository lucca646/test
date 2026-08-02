import { HOME } from "app-nav";

/** Lab web — miroir de l’onglet Envois iOS COR·ALT. */
export default function EnvoisPage() {
  return (
    <div className="page page-coralt">
      <p className="page-kicker">{HOME.kicker}</p>
      <h1 className="page-title">Envois</h1>
      <p className="page-body">
        Deck swipe candidatures (plan 3). Disponible nativement dans l’app iOS.
      </p>
    </div>
  );
}
