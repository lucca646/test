import { Redirect } from "expo-router";

/**
 * Deep link / cold start `coralt:///` → onglet Entreprises.
 * Sans ce fichier : « Unmatched Route ».
 */
export default function Index() {
  return <Redirect href="/entreprises" />;
}
