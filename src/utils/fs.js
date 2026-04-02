import fs from "fs";
import path from "path";

/** Write a file, creating parent directories as needed */
export function write(filePath, content = "") {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

/** Create a directory with a .gitkeep so git tracks it */
export function dir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  // only add .gitkeep if empty
  if (fs.readdirSync(dirPath).length === 0) {
    write(path.join(dirPath, ".gitkeep"), "");
  }
}

/** Check if a path exists */
export function exists(p) {
  return fs.existsSync(p);
}

/** Read a file as string */
export function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

/** List subdirectories of a path */
export function listDirs(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => fs.statSync(path.join(dirPath, f)).isDirectory());
}

/**
 * Detect existing locales from shared/i18n or modules/<name>/i18n
 * Falls back to ["ar", "en"] if not found
 */
export function detectLocales(projectRoot) {
  const sharedI18n = path.join(projectRoot, "src", "shared", "i18n");
  const dirs = listDirs(sharedI18n);
  return dirs.length ? dirs : ["ar", "en"];
}

/**
 * Detect all existing module names from src/modules/
 */
export function detectModules(projectRoot) {
  const modulesDir = path.join(projectRoot, "src", "modules");
  return listDirs(modulesDir);
}
