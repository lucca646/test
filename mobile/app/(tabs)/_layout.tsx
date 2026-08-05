import {
  NativeTabs,
  Icon,
  Label,
} from "expo-router/unstable-native-tabs";
import { useColors } from "../../src/theme";

/**
 * NativeTabs — app Messages COR·ALT (SMS).
 * Messages → Stats → Profil → Paramètres.
 * Le fil de conversation (`app/thread/[key].tsx`) vit hors de ce groupe
 * pour masquer la barre d'onglets quand on est dans une conversation.
 */
export default function TabsLayout() {
  const c = useColors();

  // Suit l'accent du thème choisi dans Paramètres (au lieu de l'ancien bleu
  // fixe importé de `app-nav`) — la barre d'onglets est l'élément le plus
  // visible en permanence, elle doit refléter le thème sélectionné.
  const tint = c.accent;

  return (
    <NativeTabs
      tintColor={tint}
      labelStyle={{ fontSize: 10, fontWeight: "600" }}
      blurEffect={c.tabBlur}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index" hidden>
        <Label> </Label>
        <Icon sf="message" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="messages">
        <Label>Messages</Label>
        <Icon sf={{ default: "message", selected: "message.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <Label>Stats</Label>
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profil">
        <Label>Profil</Label>
        <Icon
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="parametres">
        <Label>Paramètres</Label>
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
