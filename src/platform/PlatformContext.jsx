import { createContext, useContext, useMemo, useState } from "react";

/** @typedef {"ios" | "android" | "web"} PlatformId */

export const PLATFORMS = [
  {
    id: "web",
    label: "Web",
    hint: "Layout navigateur — onglets en haut",
    konstaTheme: "ios",
    accent: "#3b82f6",
  },
  {
    id: "ios",
    label: "iOS",
    hint: "Lab · Dynamic Island · dock Liquid Glass",
    konstaTheme: "ios",
    accent: "#0a84ff",
  },
  {
    id: "android",
    label: "Android",
    hint: "Lab · Material 3",
    konstaTheme: "material",
    accent: "#8ab4f8",
  },
];

const PlatformContext = createContext(null);

function readQuery() {
  return new URLSearchParams(window.location.search);
}

/**
 * Mode lab (?lab=1) : bascule iOS / Android / Web pour le playground.
 * Sinon : toujours la version web adaptée (pas de sélecteur).
 */
export function PlatformProvider({ children }) {
  const [lab] = useState(() => {
    const q = readQuery();
    return q.get("lab") === "1" || q.get("demo") === "platforms";
  });

  const [platform, setPlatform] = useState(() => {
    const q = readQuery();
    if (lab) {
      const p = q.get("platform");
      if (p === "android" || p === "web" || p === "ios") return p;
      return "ios";
    }
    return "web";
  });

  const meta = useMemo(
    () => PLATFORMS.find((p) => p.id === platform) || PLATFORMS[0],
    [platform],
  );

  const value = useMemo(
    () => ({
      platform,
      lab,
      setPlatform: (id) => {
        if (!lab) return; // prod web : pas de bascule
        setPlatform(id);
        const url = new URL(window.location.href);
        url.searchParams.set("platform", id);
        url.searchParams.set("lab", "1");
        window.history.replaceState({}, "", url);
      },
      meta,
    }),
    [platform, meta, lab],
  );

  return (
    <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform hors PlatformProvider");
  return ctx;
}
