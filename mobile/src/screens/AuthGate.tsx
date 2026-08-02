import { useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { colors } from "../theme";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";

/**
 * Gate auth DANS un onglet — NativeTabs reste toujours monté (pas de crash OTA).
 */
export default function AuthGate({
  children,
  requireActivated = false,
}: {
  children: ReactNode;
  requireActivated?: boolean;
}) {
  const { user, authReady, activated } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  if (!authReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!user) {
    return mode === "register" ? (
      <RegisterScreen onGoLogin={() => setMode("login")} />
    ) : (
      <LoginScreen onGoRegister={() => setMode("register")} />
    );
  }

  if (requireActivated && !activated) {
    // Compte non activé : on laisse quand même afficher Recherche ;
    // les écrans concernés font leur propre Redirect si besoin.
  }

  return <>{children}</>;
}
