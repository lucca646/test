/**
 * Config Expo.
 * - EXPO_GO=1 → mode anonyme : pas d’owner / projectId EAS, pas de plugins
 *   Dev Client / Live Activity (tunnel CI sans EXPO_TOKEN).
 * - EAS profile production|preview → retire expo-dev-client (app autonome
 *   TestFlight / install link, sans shell Dev Client).
 * - CarPlay « templates » (icône dédiée sur l'écran d'accueil CarPlay) =
 *   entitlement Apple RESTREINT (approbation requise). OFF par défaut pour que
 *   le build signe et s'installe ; réactiver avec CARPLAY=1 une fois
 *   l'entitlement accordé. La présence audio « Now Playing » dans la voiture
 *   fonctionne SANS cet entitlement (voir docs/CARPLAY.md).
 */
module.exports = ({ config }) => {
  const forExpoGo = process.env.EXPO_GO === "1";
  const profile = process.env.EAS_BUILD_PROFILE || "";
  const storeFacing = profile === "production" || profile === "preview";
  const keepCarPlay = process.env.CARPLAY === "1";

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
  if (!keepCarPlay) out = stripPlugins(out, ["./plugins/withCarPlay"]);

  if (!forExpoGo && !storeFacing) return out;

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
