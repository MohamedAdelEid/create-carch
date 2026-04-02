/**
 * i18n file templates
 */

/** Empty namespace JSON file */
export function namespaceJsonTemplate(namespace) {
  return JSON.stringify({ [namespace]: {} }, null, 2) + "\n";
}
