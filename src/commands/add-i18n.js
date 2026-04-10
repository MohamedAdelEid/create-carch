#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import { write, dir, exists, detectLocales, detectModules } from "../utils/fs.js";
import { addNamespaceToModule, addSharedNamespace } from "../utils/config.js";
import { namespaceJsonTemplate } from "../templates/i18n/i18n.templates.js";

const base    = process.cwd();
const locales = detectLocales(base);
const modules = detectModules(base);

p.intro(pc.bgCyan(pc.black(" carch ")) + "  add:i18n — add a translation namespace");

if (!locales.length) {
  p.log.error("No locales detected. Make sure you are inside a carch project.");
  process.exit(1);
}

const answers = await p.group(
  {
    target: () =>
      p.select({
        message: "Where to add the translation?",
        options: [
          { value: "shared", label: "shared  (used across all modules)" },
          ...modules.map((m) => ({ value: m, label: `module: ${m}` })),
        ],
      }),

    namespace: () =>
      p.text({
        message:  "Namespace name",
        placeholder: "courses",
        validate: (v) => {
          if (!v?.trim()) return "Required";
          if (!/^[a-z0-9-]+$/.test(v.trim())) return "Lowercase, numbers, hyphens only";
        },
      }),

    files: () =>
      p.text({
        message:      "File names inside the namespace  (space or comma separated, without .json)",
        placeholder:  "index  or  table form hero",
        initialValue: "index",
        validate:     (v) => (!v?.trim() ? "At least one file is required" : undefined),
      }),
  },
  { onCancel: () => { p.cancel("Cancelled."); process.exit(0); } },
);

const namespace = answers.namespace.trim().toLowerCase();
const fileNames = answers.files.split(/[\s,]+/).map((f) => f.trim().toLowerCase()).filter(Boolean);
const isShared  = answers.target === "shared";

const spinner = p.spinner();
spinner.start("Creating i18n files");

const i18nRoot = isShared
  ? path.join(base, "src", "shared", "presentation", "i18n")
  : path.join(base, "src", "modules", answers.target, "presentation", "i18n");

for (const locale of locales) {
  const nsDir = path.join(i18nRoot, locale, namespace);
  dir(nsDir);
  for (const fileName of fileNames) {
    const filePath = path.join(nsDir, `${fileName}.json`);
    if (!exists(filePath)) write(filePath, namespaceJsonTemplate(fileName));
  }
}

const registered = isShared
  ? addSharedNamespace(base, namespace)
  : addNamespaceToModule(base, answers.target, namespace);

spinner.stop("Done");

p.outro([
  pc.green("Files created:"),
  ...locales.map((l) =>
    `  ${isShared ? "shared" : `modules/${answers.target}`}/presentation/i18n/${l}/${namespace}/{${fileNames.join(", ")}}.json`,
  ),
  "",
  registered
    ? pc.green(`Namespace "${namespace}" registered automatically`)
    : pc.dim(`Namespace "${namespace}" was already registered`),
].join("\n"));
