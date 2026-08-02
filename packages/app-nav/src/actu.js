/**
 * Contenu partagé « Actu » — articles de presse (web + iOS).
 * Modifier ici → les deux clients suivent.
 */
export const ACTU_SCHEMA_VERSION = 1;

export const ACTU = {
  kicker: "PRESSE · CORAIA",
  title: "Actu",
  body: "Sélection d’articles — même fil web et iOS.",
  tint: ["#FF9F0A", "#FF453A"],
};

/** @typedef {{
 *   id: string,
 *   source: string,
 *   category: string,
 *   title: string,
 *   excerpt: string,
 *   time: string,
 *   url?: string,
 * }} ActuArticle
 */

/** @type {ActuArticle[]} */
export const ACTU_ARTICLES = [
  {
    id: "a1",
    source: "Les Échos",
    category: "Tech",
    title: "Apple accélère sur le Liquid Glass dans iOS",
    excerpt:
      "L’interface verre dépoli s’étend aux onglets et aux widgets. Les éditeurs adaptent déjà leurs apps.",
    time: "Il y a 2 h",
  },
  {
    id: "a2",
    source: "Le Monde",
    category: "Économie",
    title: "L’OTA change la donne pour les apps natives",
    excerpt:
      "Mettre à jour le JS sans passer par le Store réduit le délai entre idée et déploiement.",
    time: "Il y a 5 h",
  },
  {
    id: "a3",
    source: "Numerama",
    category: "Mobile",
    title: "UITabBar : pourquoi le natif reste roi",
    excerpt:
      "Accessibilité, blur système, badges — les composants Apple restent la référence UX.",
    time: "Hier",
  },
  {
    id: "a4",
    source: "01net",
    category: "Culture",
    title: "La presse se lit aussi dans la poche",
    excerpt:
      "Formats courts, sources claires, lecture offline : le fil d’actu redevient un réflexe.",
    time: "Hier",
  },
  {
    id: "a5",
    source: "MacGeneration",
    category: "Tech",
    title: "Coraia unifie web et iPhone sur un JS central",
    excerpt:
      "Catalogue d’onglets partagé, bridge île, OTA : une seule source, plusieurs interpréteurs.",
    time: "Il y a 2 j",
  },
];
