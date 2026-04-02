/**
 * Naming utilities
 * All string transformation helpers used across generators
 */

export const toPascal = (s) =>
  s.replace(/(^\w|-\w)/g, (m) => m.replace("-", "").toUpperCase());

export const toCamel = (s) =>
  toPascal(s).replace(/^\w/, (c) => c.toLowerCase());

export const toKebab = (s) =>
  s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase().replace(/\s+/g, "-");

export const toPlural = (s) => {
  if (s.endsWith("y")) return s.slice(0, -1) + "ies";
  if (s.endsWith("s")) return s;
  return s + "s";
};

/**
 * Returns all naming variants for a given raw string
 * e.g. "live-session" →
 *   pascal: "LiveSession"
 *   camel:  "liveSession"
 *   kebab:  "live-session"
 *   plural: "live-sessions"
 *   pluralPascal: "LiveSessions"
 */
export const nameVariants = (raw) => {
  const kebab = toKebab(raw);
  const pascal = toPascal(raw);
  const camel = toCamel(raw);
  const plural = toPlural(kebab);
  const pluralPascal = toPascal(plural);
  const pluralCamel = toCamel(plural);
  return { kebab, pascal, camel, plural, pluralPascal, pluralCamel };
};
