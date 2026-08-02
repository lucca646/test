import { HOME } from "app-nav";

/** Lab web — miroir de l’onglet Profil iOS COR·ALT. */
export default function ParametresPage() {
  return (
    <div className="page page-coralt">
      <p className="page-kicker">{HOME.kicker}</p>
      <h1 className="page-title">Profil</h1>
      <p className="page-body">
        Compte, plan, déconnexion — écran Paramètres de la réplique iOS COR·ALT.
      </p>
    </div>
  );
}
