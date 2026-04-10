import fs from "fs";
import path from "path";

export function write(filePath, content = "") {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

export function dir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  if (fs.readdirSync(dirPath).length === 0) {
    write(path.join(dirPath, ".gitkeep"), "");
  }
}

export const exists  = (p) => fs.existsSync(p);
export const read    = (p) => fs.readFileSync(p, "utf8");

export function listDirs(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => fs.statSync(path.join(dirPath, f)).isDirectory());
}

export function detectLocales(projectRoot) {
  const dirs = listDirs(path.join(projectRoot, "src", "shared", "presentation", "i18n"));
  return dirs.length ? dirs : ["ar", "en"];
}

export function detectModules(projectRoot) {
  return listDirs(path.join(projectRoot, "src", "modules"));
}

export function getPackageManager(projectRoot) {
  if (exists(path.join(projectRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (exists(path.join(projectRoot, "yarn.lock")))      return "yarn";
  if (exists(path.join(projectRoot, "bun.lockb")))      return "bun";
  return "npm";
}
