export function namespaceJsonTemplate(namespace) {
  return JSON.stringify({ [namespace]: {} }, null, 2) + "\n";
}
