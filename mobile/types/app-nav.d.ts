declare module "app-nav" {
  export type AppTab = {
    id: string;
    path: string;
    routeName: string;
    label: string;
    short: string;
    sf: string | { default: string; selected: string };
    f7: { default: string; active: string };
    badge?: string | null;
    role?: string;
    hidden?: boolean;
  };

  export const APP_TABS: AppTab[];
  export const NAV_TINT: string;
  export const HOME: {
    kicker: string;
    title: string;
    body: string;
    tint: [string, string] | string[];
  };
  export function visibleTabs(): AppTab[];
  export function allTabs(): AppTab[];
}
