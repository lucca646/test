import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { useMessagesAuth } from "./MessagesAuthContext";
import MessagesLoginScreen from "./LoginScreen";
import { useColors } from "../theme";

export default function MessagesAuthGate({ children }: { children: ReactNode }) {
  const { user, authReady } = useMessagesAuth();
  const c = useColors();

  if (!authReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  if (!user) return <MessagesLoginScreen />;

  return <>{children}</>;
}
