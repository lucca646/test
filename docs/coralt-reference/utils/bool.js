/** Booléen fiable (API SQLite : 0/1, parfois chaînes). */
export function coerceBool(value, defaultValue = false) {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;
  if (value == null) return defaultValue;
  return Boolean(value);
}
