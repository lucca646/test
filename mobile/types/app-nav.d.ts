declare module "app-nav" {
  export type AppTab = {
    id: string;
    path: string;
    routeName: string;
    label: string;
    short: string;
    sf: string | { default: string; selected: string };
    f7: { default: string; active: string };
    ion: { default: string; active: string };
    badge?: string | null;
    role?: string;
    hidden?: boolean;
    side?: "left" | "right";
  };

  export const APP_TABS: AppTab[];
  export const NAV_TINT: string;
  export const NAV_SCHEMA_VERSION: number;
  export const HOME_SCHEMA_VERSION: number;
  export const HOME: {
    kicker: string;
    title: string;
    body: string;
    tint: [string, string] | string[];
  };
  export const ACTU_SCHEMA_VERSION: number;
  export const ACTU: {
    kicker: string;
    title: string;
    body: string;
    tint: [string, string] | string[];
  };
  export type ActuArticle = {
    id: string;
    source: string;
    category: string;
    title: string;
    excerpt: string;
    time: string;
    url?: string;
  };
  export const ACTU_ARTICLES: ActuArticle[];
  export const PLATFORM_IDS: string[];
  export const CAPABILITIES: Record<
    string,
    {
      chrome: string;
      icons: "sf" | "f7" | "ion";
      side: boolean;
      badge: boolean;
      island: boolean;
      nativeTabBar: boolean;
    }
  >;

  export function visibleTabs(): AppTab[];
  export function tabsBySide(): { left: AppTab[]; right: AppTab[] };
  export function allTabs(): AppTab[];
  export function getCapabilities(platformId: string): (typeof CAPABILITIES)[string] | null;
  export function iconPair(
    tab: AppTab,
    set: "sf" | "f7" | "ion",
  ): { default: string; active: string };
  export function toNativeTriggers(tabs?: AppTab[]): Array<{
    name: string;
    role: "search" | undefined;
    hidden: boolean;
    label: string;
    badge: string | null | undefined;
    sf: AppTab["sf"];
  }>;
  export function normalizeWebPath(path: string, tabs: AppTab[]): string;
  export function buildWebPathIndex(tabs: AppTab[]): Map<string, AppTab>;
  export function toWebSplitGroups(tabs: AppTab[]): {
    left: AppTab[];
    right: AppTab[];
  };
  export function assertNavCatalog(tabs: AppTab[]): void;
  export function validateNavCatalog(tabs: AppTab[]): {
    ok: boolean;
    errors: string[];
  };
}

declare module "app-nav/adapters/native" {
  export function toNativeTriggers(
    tabs?: import("app-nav").AppTab[],
  ): ReturnType<typeof import("app-nav").toNativeTriggers>;
}
