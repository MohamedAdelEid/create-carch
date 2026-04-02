#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import { write, dir, exists, detectLocales, detectModules } from "../utils/fs.js";
import { addNamespaceToModule, addSharedNamespace } from "../utils/config.js";
import { namespaceJsonTemplate } from "../templates/i18n/i18n.templates.js";

const base = process.cwd();

p.intro(pc.bgCyan(pc.black(" carch ")) + "  add:i18n — add a translation namespace");

const locales  = detectLocales(base);
const modules  = detectModules(base);

if (!locales.length) {
  p.log.error("No locales detected. Make sure you're inside a carch project.");
  process.exit(1);
}

// ── Prompts ───────────────────────────────────────────────────────────────────
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
        message: "Namespace name  (e.g. courses, hero, settings)",
        placeholder: "courses",
        validate: (v) => {
          if (!v?.trim()) return "Namespace is required";
          if (!/^[a-z0-9-]+$/.test(v.trim()))
            return "Use lowercase letters, numbers, and hyphens only";
        },
      }),

    files: () =>
      p.text({
        message: "File names inside the namespace  (comma-separated, without .json)",
        placeholder: "index  or  table, form, hero",
        initialValue: "index",
        validate: (v) => (!v?.trim() ? "At least one file is required" : undefined),
      }),
  },
  {
    onCancel: () => { p.cancel("Cancelled."); process.exit(0); },
  }
);

const namespace  = answers.namespace.trim().toLowerCase();
const fileNames  = answers.files.split(",").map((f) => f.trim().toLowerCase()).filter(Boolean);
const isShared   = answers.target === "shared";
const targetLabel = isShared ? "shared" : `modules/${answers.target}`;

// ── Preview ───────────────────────────────────────────────────────────────────
p.note(
  [
    `Target:     ${targetLabel}/i18n/`,
    `Namespace:  ${namespace}/`,
    `Files:      ${fileNames.map((f) => f + ".json").join(", ")}`,
    `Locales:    ${locales.join(", ")}`,
  ].join("\n"),
  "Will create"
);

const confirmed = await p.confirm({ message: "Create files?" });
if (!confirmed || p.isCancel(confirmed)) { p.cancel("Cancelled."); process.exit(0); }

const spinner = p.spinner();
spinner.start("Creating i18n files");

// ── Generate ──────────────────────────────────────────────────────────────────
const i18nRoot = isShared
  ? path.join(base, "src", "shared", "i18n")
  : path.join(base, "src", "modules", answers.target, "i18n");

for (const locale of locales) {
  const nsDir = path.join(i18nRoot, locale, namespace);
  dir(nsDir);
  for (const fileName of fileNames) {
    const filePath = path.join(nsDir, `${fileName}.json`);
    if (!exists(filePath)) {
      write(filePath, namespaceJsonTemplate(fileName));
    }
  }
}

// ── Update config ─────────────────────────────────────────────────────────────
let registered = false;
if (isShared) {
  registered = addSharedNamespace(base, namespace);
} else {
  registered = addNamespaceToModule(base, answers.target, namespace);
}

spinner.stop("Done");

const createdPaths = locales.map((locale) =>
  `  ${targetLabel}/i18n/${locale}/${namespace}/{${fileNames.join(", ")}}.json`
);

p.outro(
  [
    pc.green("Files created:"),
    ...createdPaths,
    "",
    registered
      ? pc.green(`Namespace "${namespace}" registered in module.config.ts`)
      : pc.dim(`Namespace "${namespace}" was already registered`),
  ].join("\n")
);
