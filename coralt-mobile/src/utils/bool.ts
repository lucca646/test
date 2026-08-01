export function coerceBool(value: unknown, defaultValue = false): boolean {
  if (value === true || value === 1 || value === "1" || value === "true")
    return true;
  if (value === false || value === 0 || value === "0" || value === "false")
    return false;
  if (value == null) return defaultValue;
  return Boolean(value);
}
