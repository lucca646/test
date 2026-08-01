/**
 * Config Expo.
 * - EXPO_GO=1 → mode anonyme : pas d’owner / projectId EAS, pas de plugins
 *   Dev Client / Live Activity (tunnel CI sans EXPO_TOKEN).
 * - EAS profile production|preview → retire expo-dev-client (app autonome
 *   TestFlight / install link, sans shell Dev Client).
 */
module.exports = ({ config }) => {
  const forExpoGo = process.env.EXPO_GO === "1";
  const profile = process.env.EAS_BUILD_PROFILE || "";
  const storeFacing =
    profile === "production" || profile === "preview";

  if (!forExpoGo && !storeFacing) return config;

  const drop = new Set(
    forExpoGo
      ? ["expo-dev-client", "expo-live-activity"]
      : ["expo-dev-client"],
  );

  const plugins = (config.plugins || []).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return !drop.has(name);
  });

  if (storeFacing && !forExpoGo) {
    return { ...config, plugins };
  }

  const extra = { ...(config.extra || {}) };
  if (extra.eas) {
    const { projectId: _projectId, ...easRest } = extra.eas;
    extra.eas = easRest;
  }

  const { owner: _owner, ...rest } = config;
  return {
    ...rest,
    plugins,
    extra,
  };
};
