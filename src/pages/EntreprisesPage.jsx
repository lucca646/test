import { HOME } from "app-nav";

/** Lab web — miroir de l’onglet Entreprises iOS COR·ALT. */
export default function EntreprisesPage() {
  return (
    <div className="page page-coralt">
      <p className="page-kicker">{HOME.kicker}</p>
      <h1 className="page-title">Entreprises</h1>
      <p className="page-body">
        Liste + fiche détail (réplique iOS). Sur iPhone : onglet Entreprises dans
        Coraia Glass / Expo.
      </p>
    </div>
  );
}
