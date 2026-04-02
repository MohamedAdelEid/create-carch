import fs from "fs";
import path from "path";
import { write, exists } from "./fs.js";

/**
 * Read the i18nNamespaces array from a module.config.ts
 * Returns [] if file not found or can't parse
 */
export function readModuleNamespaces(projectRoot, moduleName) {
  const configPath = path.join(
    projectRoot,
    "src",
    "modules",
    moduleName,
    "module.config.ts"
  );
  if (!exists(configPath)) return [];
  const content = fs.readFileSync(configPath, "utf8");
  const match = content.match(/i18nNamespaces:\s*\[([^\]]*)\]/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.replace(/['"]/g, "").trim())
    .filter(Boolean);
}

/**
 * Add a namespace to a module's module.config.ts i18nNamespaces array
 * Does nothing if already present
 */
export function addNamespaceToModule(projectRoot, moduleName, namespace) {
  const configPath = path.join(
    projectRoot,
    "src",
    "modules",
    moduleName,
    "module.config.ts"
  );
  if (!exists(configPath)) return false;

  let content = fs.readFileSync(configPath, "utf8");
  const current = readModuleNamespaces(projectRoot, moduleName);

  if (current.includes(namespace)) return false; // already registered

  // insert namespace into the array
  content = content.replace(
    /i18nNamespaces:\s*\[([^\]]*)\]/,
    (_, inner) => {
      const trimmed = inner.trim();
      const updated = trimmed
        ? `${trimmed}, "${namespace}"`
        : `"${namespace}"`;
      return `i18nNamespaces: [${updated}]`;
    }
  );

  write(configPath, content);
  return true;
}

/**
 * Add a namespace to shared i18n config (shared/i18n namespaces are
 * registered in config/i18n.ts as the sharedNs array)
 */
export function addSharedNamespace(projectRoot, namespace) {
  const configPath = path.join(projectRoot, "src", "config", "i18n.ts");
  if (!exists(configPath)) return false;

  let content = fs.readFileSync(configPath, "utf8");

  // already registered?
  if (content.includes(`"${namespace}"`)) return false;

  content = content.replace(
    /const sharedNs\s*=\s*\[([^\]]*)\]/,
    (_, inner) => {
      const trimmed = inner.trim();
      const updated = trimmed
        ? `${trimmed}, "${namespace}"`
        : `"${namespace}"`;
      return `const sharedNs = [${updated}]`;
    }
  );

  write(configPath, content);
  return true;
}
