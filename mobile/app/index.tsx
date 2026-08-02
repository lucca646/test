import { Redirect } from "expo-router";

/**
 * Cold start `coralt:///` → Accueil (plan du jour).
 */
export default function Index() {
  return <Redirect href="/accueil" />;
}
