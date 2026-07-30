import { coerceBool } from "./bool";
import type { CoraltUser } from "./planAccess";

export function isAccountActivated(user: CoraltUser | null | undefined) {
  if (!user) return false;
  if (user.is_admin) return true;
  return coerceBool(user.account_activated, false);
}
