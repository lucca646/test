/** Known platform identifiers for nav chrome routing. */
export const PLATFORM_IDS = [
  "web-live",
  "web-lab-ios",
  "web-lab-android",
  "web-lab-web",
  "ios-native",
  "android-native",
];

/** Per-platform nav chrome capabilities (pure data — no React). */
export const CAPABILITIES = {
  "web-live": {
    chrome: "split-bottom",
    icons: "f7",
    side: true,
    /** Plus de caméra centrale — nav COR·ALT 2+2 */
    centerPromoted: false,
    badge: true,
    island: false,
    nativeTabBar: false,
  },
  "web-lab-ios": {
    chrome: "liquid-glass",
    icons: "f7",
    side: false,
    badge: false,
    island: true,
    nativeTabBar: false,
  },
  "web-lab-android": {
    chrome: "material",
    icons: "ion",
    side: false,
    badge: false,
    island: false,
    nativeTabBar: false,
  },
  "web-lab-web": {
    chrome: "top-nav",
    icons: "f7",
    side: false,
    badge: false,
    island: false,
    nativeTabBar: false,
  },
  "ios-native": {
    chrome: "uitabbar",
    icons: "sf",
    side: false,
    badge: true,
    island: true,
    nativeTabBar: true,
  },
  "android-native": {
    chrome: "material",
    icons: "ion",
    side: false,
    badge: true,
    island: false,
    nativeTabBar: false,
  },
};

/**
 * Look up capabilities for a platform id.
 * @param {string} platformId
 * @returns {typeof CAPABILITIES[keyof typeof CAPABILITIES] | null}
 */
export function getCapabilities(platformId) {
  return CAPABILITIES[platformId] || null;
}
