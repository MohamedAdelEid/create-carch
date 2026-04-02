#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import { write, dir, exists, detectLocales } from "../utils/fs.js";
import { toPascal } from "../utils/naming.js";
import { moduleConfigTemplate, roleLayoutTemplate, rolePageTemplate } from "../templates/module/module.config.template.js";
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

p.intro(pc.bgCyan(pc.black(" carch ")) + `  add:module ${pc.bold(moduleName)}`);

if (exists(root)) {
  p.log.error(`Module "${moduleName}" already exists.`);
  process.exit(1);
}

const spinner = p.spinner();
spinner.start(`Creating module ${moduleName}`);

// presentation
dir(path.join(root, "presentation", "pages"));
dir(path.join(root, "presentation", "components"));
dir(path.join(root, "presentation", "assets", "images"));
dir(path.join(root, "presentation", "icons"));

// domain
dir(path.join(root, "domain", "entities"));
dir(path.join(root, "domain", "types"));

// application
dir(path.join(root, "application", "hooks"));
dir(path.join(root, "application", "services"));

// infrastructure
dir(path.join(root, "infrastructure", "api"));
dir(path.join(root, "infrastructure", "integrations"));

// i18n — detect existing locales, seed dashboard namespace
for (const locale of locales) {
  const nsDir = path.join(root, "i18n", locale, "dashboard");
  dir(nsDir);
  write(path.join(nsDir, "index.json"), namespaceJsonTemplate("dashboard"));
}

// module.config.ts
write(path.join(root, "module.config.ts"), moduleConfigTemplate(moduleName));

// app route group
write(path.join(base, "src", "app", `(${moduleName})`, "layout.tsx"),      roleLayoutTemplate(moduleName, pascal, true));
write(path.join(base, "src", "app", `(${moduleName})`, "dashboard", "page.tsx"), rolePageTemplate(moduleName, pascal));

spinner.stop(`Module ${pc.bold(moduleName)} created`);

p.outro(
  [
    pc.green("Done!"),
    `  src/modules/${moduleName}/`,
    `  src/app/(${moduleName})/`,
    "",
    pc.yellow("!") + ` Register in ${pc.bold("src/config/modules.ts")}:`,
    `  import { ${moduleName}Module } from "@/modules/${moduleName}/module.config";`,
    `  // add ${moduleName}Module to appModules array`,
    "",
    pc.dim(`Add translations:  carch add:i18n`),
  ].join("\n")
);
