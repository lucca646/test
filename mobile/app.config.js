/**
 * Config Expo.
 * - EXPO_GO=1 → mode anonyme : pas d’owner / projectId EAS, pas de plugins
 *   Dev Client / Live Activity / CarPlay (tunnel CI sans EXPO_TOKEN).
 * - EAS profile production|preview → retire expo-dev-client (app autonome
 *   TestFlight / install link, sans shell Dev Client).
 * - CarPlay templates (icône + UI native voiture) : ON par défaut.
 *   Entitlement Apple restreint — désactiver avec CARPLAY=0 si la signature
 *   échoue tant que l’approbation n’est pas accordée (voir docs/CARPLAY.md).
 */
module.exports = ({ config }) => {
  const forExpoGo = process.env.EXPO_GO === "1";
  const profile = process.env.EAS_BUILD_PROFILE || "";
  const storeFacing =
    profile === "production" || profile === "preview";
  // ON par défaut ; CARPLAY=0 pour un build sans entitlement.
  const keepCarPlay = process.env.CARPLAY !== "0";

  const stripPlugins = (cfg, names) => {
    const set = new Set(names);
    return {
      ...cfg,
      plugins: (cfg.plugins || []).filter(
        (plugin) => !set.has(Array.isArray(plugin) ? plugin[0] : plugin),
      ),
    };
  };

  const withNotifMode = (plugins) =>
    plugins.map((plugin) =>
      Array.isArray(plugin) && plugin[0] === "expo-notifications"
        ? [
            plugin[0],
            {
              ...plugin[1],
              mode: storeFacing ? "production" : "development",
            },
          ]
        : plugin,
    );

  let out = {
    ...config,
    plugins: withNotifMode(config.plugins || []),
  };

  if (!keepCarPlay || forExpoGo) {
    out = stripPlugins(out, ["./plugins/withCarPlay"]);
  }

  if (!forExpoGo && !storeFacing) {
    return out;
  }

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
