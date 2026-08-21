/**
 * Config Expo.
 * - EXPO_GO=1 → mode anonyme : pas d’owner / projectId EAS, pas de plugins
 *   Dev Client / Live Activity (tunnel CI sans EXPO_TOKEN).
 * - EAS profile production|preview → retire expo-dev-client (app autonome
 *   TestFlight / install link, sans shell Dev Client).
 * - CARPLAY=0 → retire le plugin CarPlay (entitlement Apple restreint). Utile
 *   tant qu'Apple n'a pas accordé l'entitlement : le build signe et s'installe
 *   sur iPhone (sans CarPlay). Mettre CARPLAY=1 / défaut une fois approuvé.
 */
module.exports = ({ config }) => {
  const forExpoGo = process.env.EXPO_GO === "1";
  const profile = process.env.EAS_BUILD_PROFILE || "";
  const storeFacing = profile === "production" || profile === "preview";
  const dropCarPlay = process.env.CARPLAY === "0";

  const stripPlugins = (cfg, names) => {
    const set = new Set(names);
    return {
      ...cfg,
      plugins: (cfg.plugins || []).filter(
        (plugin) => !set.has(Array.isArray(plugin) ? plugin[0] : plugin),
      ),
    };
  };

  let out = config;
  if (dropCarPlay) out = stripPlugins(out, ["./plugins/withCarPlay"]);

  if (!forExpoGo && !storeFacing) return out;

  // CarPlay = module natif + entitlement : impossible en Expo Go (anonyme).
  const drop = forExpoGo
    ? ["expo-dev-client", "expo-live-activity", "./plugins/withCarPlay"]
    : ["expo-dev-client"];
  out = stripPlugins(out, drop);

  if (storeFacing && !forExpoGo) {
    return out;
  }

  const extra = { ...(out.extra || {}) };
  if (extra.eas) {
    const { projectId: _projectId, ...easRest } = extra.eas;
    extra.eas = easRest;
  }

  const { owner: _owner, ...rest } = out;
  return { ...rest, extra };
};
