export const PLAN_MAILING_MIN = 3;
export const PLAN_ENVOIS_MIN = 3;

export type CoraltUser = {
  plan?: number | string;
  is_admin?: boolean;
  account_activated?: boolean | number | string;
  email?: string;
  name?: string;
  phone?: string;
  gmail_connected?: boolean;
  [key: string]: unknown;
};

export function userPlan(user: CoraltUser | null | undefined) {
  return Number(user?.plan) || 1;
}

export function hasMailingAccess(user: CoraltUser | null | undefined) {
  return userPlan(user) >= PLAN_MAILING_MIN;
}

export function hasEnvoisAccess(user: CoraltUser | null | undefined) {
  return userPlan(user) >= PLAN_ENVOIS_MIN;
}
