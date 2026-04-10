import { execSync } from "child_process";

const runners = {
  npm:  "npx shadcn@latest",
  pnpm: "pnpm dlx shadcn@latest",
  yarn: "npx shadcn@latest",
  bun:  "bunx --bun shadcn@latest",
};

export function shadcnAdd(components, pm = "npm", cwd = process.cwd()) {
  const runner = runners[pm] ?? runners.npm;
  const list   = Array.isArray(components) ? components.join(" ") : components;
  execSync(`${runner} add ${list} -y`, { stdio: "inherit", cwd });
}

export function shadcnInit(pm = "npm", rtl = false, cwd = process.cwd()) {
  const runner = runners[pm] ?? runners.npm;
  const flags  = rtl ? "--rtl -y" : "-y";
  execSync(`${runner} init ${flags}`, { stdio: "inherit", cwd });
}
