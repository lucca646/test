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

  // Entitlement APNs "production" pour TestFlight/App Store (obligatoire pour
  // que les push arrivent réellement), "development" pour dev-client/simulateur
  // (sandbox APNs) — sinon les notifs remote ne se déclenchent jamais en review.
  const withNotifMode = (plugins) =>
    plugins.map((plugin) =>
      Array.isArray(plugin) && plugin[0] === "expo-notifications"
        ? [plugin[0], { ...plugin[1], mode: storeFacing ? "production" : "development" }]
        : plugin,
    );

  if (!forExpoGo && !storeFacing) {
    return { ...config, plugins: withNotifMode(config.plugins || []) };
  }

  const drop = new Set(
    forExpoGo
      ? ["expo-dev-client", "expo-live-activity"]
      : ["expo-dev-client"],
  );

  const plugins = withNotifMode(config.plugins || []).filter((plugin) => {
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
