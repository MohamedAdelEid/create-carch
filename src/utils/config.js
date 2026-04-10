import fs from "fs";
import path from "path";
import { write, exists } from "./fs.js";

export function readModuleNamespaces(projectRoot, moduleName) {
  const file = path.join(projectRoot, "src", "modules", moduleName, "module.config.ts");
  if (!exists(file)) return [];
  const match = fs.readFileSync(file, "utf8").match(/i18nNamespaces:\s*\[([^\]]*)\]/);
  if (!match) return [];
  return match[1].split(",").map((s) => s.replace(/['"]/g, "").trim()).filter(Boolean);
}

export function addNamespaceToModule(projectRoot, moduleName, namespace) {
  const file = path.join(projectRoot, "src", "modules", moduleName, "module.config.ts");
  if (!exists(file)) return false;
  let content = fs.readFileSync(file, "utf8");
  const current = readModuleNamespaces(projectRoot, moduleName);
  if (current.includes(namespace)) return false;
  content = content.replace(
    /i18nNamespaces:\s*\[([^\]]*)\]/,
    (_, inner) => {
      const trimmed = inner.trim();
      return `i18nNamespaces: [${trimmed ? `${trimmed}, "${namespace}"` : `"${namespace}"`}]`;
    },
  );
  write(file, content);
  return true;
}

export function addSharedNamespace(projectRoot, namespace) {
  const file = path.join(projectRoot, "src", "config", "i18n.ts");
  if (!exists(file)) return false;
  let content = fs.readFileSync(file, "utf8");
  if (content.includes(`"${namespace}"`)) return false;
  content = content.replace(
    /const sharedNs\s*=\s*\[([^\]]*)\]/,
    (_, inner) => {
      const trimmed = inner.trim();
      return `const sharedNs = [${trimmed ? `${trimmed}, "${namespace}"` : `"${namespace}"`}]`;
    },
  );
  write(file, content);
  return true;
}
