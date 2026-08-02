/** @typedef {import("./tabs.js").AppTab} AppTab */

/** Current nav catalog schema version — bump when breaking shape changes. */
export const NAV_SCHEMA_VERSION = 1;

const VALID_SIDES = new Set(["left", "right"]);
const VALID_ROLES = new Set(["search"]);

/**
 * Collect validation errors for a nav catalog (non-throwing).
 * @param {AppTab[]} tabs
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateNavCatalog(tabs) {
  /** @type {string[]} */
  const errors = [];

  if (!Array.isArray(tabs)) {
    return { ok: false, errors: ["tabs must be an array"] };
  }

  const ids = new Set();
  const paths = new Set();
  const routeNames = new Set();

  tabs.forEach((tab, index) => {
    const prefix = `tab[${index}]`;

    if (!tab || typeof tab !== "object") {
      errors.push(`${prefix}: must be an object`);
      return;
    }

    if (typeof tab.id !== "string" || tab.id.length === 0) {
      errors.push(`${prefix}: id must be a non-empty string`);
    } else if (ids.has(tab.id)) {
      errors.push(`${prefix}: duplicate id "${tab.id}"`);
    } else {
      ids.add(tab.id);
    }

    if (typeof tab.path !== "string" || tab.path.length === 0) {
      errors.push(`${prefix}: path must be a non-empty string`);
    } else if (paths.has(tab.path)) {
      errors.push(`${prefix}: duplicate path "${tab.path}"`);
    } else {
      paths.add(tab.path);
    }

    if (typeof tab.routeName !== "string" || tab.routeName.length === 0) {
      errors.push(`${prefix}: routeName must be a non-empty string`);
    } else if (routeNames.has(tab.routeName)) {
      errors.push(`${prefix}: duplicate routeName "${tab.routeName}"`);
    } else {
      routeNames.add(tab.routeName);
    }

    if (tab.sf === undefined || tab.sf === null) {
      errors.push(`${prefix} (${tab.id ?? "?"}): missing sf icon`);
    }

    if (!tab.f7 || typeof tab.f7 !== "object") {
      errors.push(`${prefix} (${tab.id ?? "?"}): missing f7 icon pair`);
    } else {
      if (typeof tab.f7.default !== "string" || tab.f7.default.length === 0) {
        errors.push(`${prefix} (${tab.id ?? "?"}): f7.default must be a non-empty string`);
      }
      if (typeof tab.f7.active !== "string" || tab.f7.active.length === 0) {
        errors.push(`${prefix} (${tab.id ?? "?"}): f7.active must be a non-empty string`);
      }
    }

    if (!tab.ion || typeof tab.ion !== "object") {
      errors.push(`${prefix} (${tab.id ?? "?"}): missing ion icon pair`);
    } else {
      if (typeof tab.ion.default !== "string" || tab.ion.default.length === 0) {
        errors.push(`${prefix} (${tab.id ?? "?"}): ion.default must be a non-empty string`);
      }
      if (typeof tab.ion.active !== "string" || tab.ion.active.length === 0) {
        errors.push(`${prefix} (${tab.id ?? "?"}): ion.active must be a non-empty string`);
      }
    }

    if (tab.side !== undefined && !VALID_SIDES.has(tab.side)) {
      errors.push(
        `${prefix} (${tab.id ?? "?"}): side must be "left", "right", or undefined (got ${JSON.stringify(tab.side)})`,
      );
    }

    if (tab.role !== undefined && !VALID_ROLES.has(tab.role)) {
      errors.push(
        `${prefix} (${tab.id ?? "?"}): role must be "search" or undefined (got ${JSON.stringify(tab.role)})`,
      );
    }
  });

  return { ok: errors.length === 0, errors };
}

/**
 * Assert a nav catalog is valid; throws with all error details on failure.
 * @param {AppTab[]} tabs
 * @throws {Error}
 */
export function assertNavCatalog(tabs) {
  const { ok, errors } = validateNavCatalog(tabs);
  if (!ok) {
    throw new Error(
      `Invalid nav catalog (schema v${NAV_SCHEMA_VERSION}):\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }
}
