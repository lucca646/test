import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode; label?: string };
type State = { error: Error | null };

/** Empêche un écran de faire crasher toute l’app en boucle. */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[AppErrorBoundary]", this.props.label, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.box}>
          <Text style={styles.title}>Écran en pause</Text>
          <Text style={styles.body}>
            Un module a planté. Tu peux réessayer sans réinstaller l’app.
          </Text>
          <Text style={styles.detail} numberOfLines={4}>
            {this.state.error.message}
          </Text>
          <Pressable
            style={styles.btn}
            onPress={() => this.setState({ error: null })}
          >
            <Text style={styles.btnText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    margin: 16,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "rgba(255,69,58,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,69,58,0.4)",
    gap: 8,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  body: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 20 },
  detail: { color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 16 },
  btn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#0a84ff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
