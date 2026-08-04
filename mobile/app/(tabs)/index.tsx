import { Redirect } from "expo-router";

/**
 * Cold start `coralt:///` → Messages.
 */
export default function Index() {
  return <Redirect href="/messages" />;
}
