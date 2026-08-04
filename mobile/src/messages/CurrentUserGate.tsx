import type { ReactNode } from "react";
import { useCurrentUser } from "./CurrentUserContext";
import UserPickerScreen from "./UserPickerScreen";

export default function CurrentUserGate({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  if (!user) return <UserPickerScreen />;
  return <>{children}</>;
}
