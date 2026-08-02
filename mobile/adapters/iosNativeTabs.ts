import { toNativeTriggers, NAV_TINT, type AppTab } from "app-nav";

/**
 * Adaptateur iOS — données app-nav → props NativeTabs / UITabBar Apple.
 * Ne remplace PAS le chrome : UIKit reste la source de rendu.
 */
export function mapIosNativeTabs(tabs?: AppTab[]) {
  return {
    tint: NAV_TINT,
    triggers: toNativeTriggers(tabs),
  };
}
