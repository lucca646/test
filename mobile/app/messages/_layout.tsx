import { Stack } from "expo-router";
import { MessagesAuthProvider } from "../../src/messages/MessagesAuthContext";
import { useColors } from "../../src/theme";

/** Pile Messages : liste (sans header natif, large title custom) → fil (header natif). */
export default function MessagesLayout() {
  const c = useColors();
  return (
    <MessagesAuthProvider>
      <Stack
        screenOptions={{
          headerTintColor: c.accent,
          headerStyle: { backgroundColor: c.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="[key]" options={{ headerShown: true, title: "" }} />
      </Stack>
    </MessagesAuthProvider>
  );
}
