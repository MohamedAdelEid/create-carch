#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import { execSync } from "child_process";
import { write, exists, detectLocales, getPackageManager } from "../utils/fs.js";
import {
  dashboardLayoutTemplate,
  appSidebarTemplate,
  dashboardHeaderTemplate,
} from "../templates/dashboard/dashboard.templates.js";

const base = process.cwd();
const pm   = getPackageManager(base);

const runners = {
  npm:  "npx shadcn@latest",
  pnpm: "pnpm dlx shadcn@latest",
  yarn: "npx shadcn@latest",
  bun:  "bunx --bun shadcn@latest",
};
const runner = runners[pm] ?? runners.npm;

p.intro(pc.bgCyan(pc.black(" carch ")) + "  add:dashboard — setup dashboard layout");

const isModular = exists(path.join(base, "src", "modules"));
const locales   = detectLocales(base);
const hasRtlLocale = locales.some((l) => ["ar", "he", "fa", "ur"].includes(l));

let rtlSupport = hasRtlLocale;
if (!hasRtlLocale) {
  const answer = await p.confirm({
    message:      "Enable RTL support?",
    initialValue: false,
  });
  if (p.isCancel(answer)) { p.cancel("Cancelled."); process.exit(0); }
  rtlSupport = answer;
}

if (hasRtlLocale) {
  p.log.info("RTL support enabled automatically (detected RTL locale).");
}

const spinner = p.spinner();

spinner.start("Initializing shadcn/ui");
try {
  const rtlFlag = rtlSupport ? " --rtl" : "";
  execSync(`${runner} init -y${rtlFlag}`, { stdio: "pipe", cwd: base });
  spinner.stop("shadcn/ui initialized");
} catch (err) {
  spinner.stop("shadcn/ui init failed");
  p.log.error(err.message);
  process.exit(1);
}

spinner.start("Installing sidebar components");
try {
  execSync(`${runner} add sidebar breadcrumb separator -y`, { stdio: "pipe", cwd: base });
  spinner.stop("Components installed");
} catch (err) {
  spinner.stop("Component install failed");
  p.log.error(err.message);
  process.exit(1);
}

spinner.start("Writing dashboard layout files");

const layoutsRoot = isModular
  ? path.join(base, "src", "shared", "presentation", "layouts", "dashboard")
  : path.join(base, "src", "presentation", "layouts", "dashboard");

write(path.join(layoutsRoot, "DashboardLayout.tsx"), dashboardLayoutTemplate(isModular, rtlSupport));
write(path.join(layoutsRoot, "AppSidebar.tsx"),      appSidebarTemplate(isModular));
write(path.join(layoutsRoot, "DashboardHeader.tsx"), dashboardHeaderTemplate());

const mainLayoutPath = isModular
  ? path.join(base, "src", "shared", "presentation", "layouts", "DashboardLayout.tsx")
  : path.join(base, "src", "presentation", "layouts", "DashboardLayout.tsx");

write(
  mainLayoutPath,
  `export { DashboardLayout } from "./dashboard/DashboardLayout";\n`,
);

spinner.stop("Dashboard layout created");

p.outro([
  pc.green("Done!"),
  "",
  `  ${layoutsRoot.replace(base + path.sep, "")}/`,
  "    DashboardLayout.tsx",
  "    AppSidebar.tsx",
  "    DashboardHeader.tsx",
  "",
  rtlSupport
    ? pc.dim("RTL support enabled — sidebar switches side based on locale.")
    : pc.dim("LTR only. Run carch add:dashboard again to enable RTL if needed."),
  "",
  pc.dim("Setup auth:  carch add:auth"),
].join("\n"));
