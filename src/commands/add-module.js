#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import { write, dir, exists, detectLocales } from "../utils/fs.js";
import { toPascal } from "../utils/naming.js";
import {
  moduleConfigTemplate, roleLayoutTemplate, roleDashboardPageTemplate,
} from "../templates/module/module.templates.js";
import { namespaceJsonTemplate } from "../templates/i18n/i18n.templates.js";

const moduleName = process.argv[3];

if (!moduleName) {
  console.error(pc.red("Usage: carch add:module <moduleName>"));
  process.exit(1);
}

const base    = process.cwd();
const root    = path.join(base, "src", "modules", moduleName);
const pascal  = toPascal(moduleName);
const locales = detectLocales(base);
const hasDashboard = exists(
  path.join(base, "src", "shared", "presentation", "layouts", "DashboardLayout.tsx"),
);

p.intro(pc.bgCyan(pc.black(" carch ")) + `  add:module ${pc.bold(moduleName)}`);

if (exists(root)) {
  p.log.error(`Module "${moduleName}" already exists.`);
  process.exit(1);
}

const spinner = p.spinner();
spinner.start(`Creating module ${moduleName}`);

dir(path.join(root, "presentation", "pages"));
dir(path.join(root, "presentation", "components"));
dir(path.join(root, "presentation", "assets", "images"));

for (const locale of locales) {
  const nsDir = path.join(root, "presentation", "i18n", locale, "dashboard");
  dir(nsDir);
  write(path.join(nsDir, "index.json"), namespaceJsonTemplate("dashboard"));
}

dir(path.join(root, "domain", "entities"));
dir(path.join(root, "domain", "types"));
dir(path.join(root, "application", "hooks"));
dir(path.join(root, "application", "services"));
dir(path.join(root, "infrastructure", "api"));
dir(path.join(root, "infrastructure", "integrations"));

write(path.join(root, "module.config.ts"), moduleConfigTemplate(moduleName));

write(
  path.join(base, "src", "app", `(${moduleName})`, "layout.tsx"),
  roleLayoutTemplate(moduleName, pascal, hasDashboard),
);
write(
  path.join(base, "src", "app", `(${moduleName})`, "dashboard", "page.tsx"),
  roleDashboardPageTemplate(moduleName, pascal),
);

spinner.stop(`Module ${pc.bold(moduleName)} created`);

p.outro([
  pc.green("Done!"),
  `  src/modules/${moduleName}/`,
  `  src/app/(${moduleName})/`,
  "",
  pc.yellow("!") + ` Register in ${pc.bold("src/config/modules.ts")}:`,
  `  import { ${moduleName}Module } from "@/modules/${moduleName}/module.config";`,
  `  // add ${moduleName}Module to appModules`,
].join("\n"));
