import { createContext, useContext, useMemo, useState } from "react";

/** @typedef {"ios" | "android" | "web"} PlatformId */

export const PLATFORMS = [
  {
    id: "ios",
    label: "iOS",
    hint: "Dynamic Island · dock Liquid Glass · Konsta iOS",
    konstaTheme: "ios",
    accent: "#0a84ff",
  },
  {
    id: "android",
    label: "Android",
    hint: "Material 3 · barre du bas · Konsta Material",
    konstaTheme: "material",
    accent: "#8ab4f8",
  },
  {
    id: "web",
    label: "Web",
    hint: "Chrome navigateur · onglets haut · layout desktop",
    konstaTheme: "ios",
    accent: "#3b82f6",
  },
];

const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {
  const [platform, setPlatform] = useState(() => {
    const q = new URLSearchParams(window.location.search).get("platform");
    if (q === "android" || q === "web" || q === "ios") return q;
    return "ios";
  });

  const meta = useMemo(
    () => PLATFORMS.find((p) => p.id === platform) || PLATFORMS[0],
    [platform],
  );

  const value = useMemo(
    () => ({
      platform,
      setPlatform: (id) => {
        setPlatform(id);
        const url = new URL(window.location.href);
        url.searchParams.set("platform", id);
        window.history.replaceState({}, "", url);
      },
      meta,
    }),
    [platform, meta],
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
