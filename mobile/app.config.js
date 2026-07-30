/**
 * Config Expo.
 * EXPO_GO=1 → mode anonyme (comme au début) : pas d’owner / projectId EAS,
 * pas de plugins natifs Dev Client / Live Activity. Nécessaire pour
 * `expo start --tunnel` en CI sans EXPO_TOKEN (les tokens robot bloquent ngrok).
 */
module.exports = ({ config }) => {
  const forExpoGo = process.env.EXPO_GO === "1";
  if (!forExpoGo) return config;

  const plugins = (config.plugins || []).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== "expo-dev-client" && name !== "expo-live-activity";
  });

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
