#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import { setTimeout as sleep } from "timers/promises";
import { write, dir, exists } from "../utils/fs.js";
import { toPascal } from "../utils/naming.js";
import {
  tsconfigTemplate,
  nextConfigTemplate,
  envLocalTemplate,
  gitignoreTemplate,
  rootLayoutTemplate,
  middlewareTemplate,
  moduleTypesTemplate,
  modulesConfigTemplate,
  i18nConfigTemplate,
  envTemplate,
  cnTemplate,
  toastTemplate,
  formatTemplate,
  httpClientTemplate,
  queryProviderTemplate,
  appProvidersTemplate,
  dashboardLayoutTemplate,
  globalsCssTemplate,
  sharedApiTypesTemplate,
  sharedCommonTypesTemplate,
  useDebounceTemplate,
  packageJsonTemplate,
} from "../templates/project/project.templates.js";
import {
  moduleConfigTemplate,
  roleLayoutTemplate,
  rolePageTemplate,
} from "../templates/module/module.config.template.js";
import { namespaceJsonTemplate } from "../templates/i18n/i18n.templates.js";

console.clear();
p.intro(pc.bgCyan(pc.black(" carch ")) + "  Clean Architecture scaffold for Next.js");

// ── Prompts ───────────────────────────────────────────────────────────────────
const config = await p.group(
  {
    projectName: () =>
      p.text({
        message: "Project name",
        placeholder: "my-app",
        validate: (v) => (!v?.trim() ? "Project name is required" : undefined),
      }),

    architecture: () =>
      p.select({
        message: "Architecture",
        options: [
          {
            value: "modular",
            label: "Modular Clean Architecture",
            hint: "multiple independent modules, each with its own layers",
          },
          {
            value: "clean",
            label: "Clean Architecture",
            hint: "single app with presentation / domain / application / infrastructure",
          },
        ],
      }),

    modules: ({ results }) => {
      if (results.architecture !== "modular") return;
      return p.text({
        message: "Modules  (comma-separated)",
        placeholder: "admin, teacher, student, school, parent",
        validate: (v) => (!v?.trim() ? "Add at least one module" : undefined),
      });
    },

    locales: () =>
      p.text({
        message: "Locales  (comma-separated language codes)",
        placeholder: "ar, en, fr",
        initialValue: "ar, en",
        validate: (v) => (!v?.trim() ? "Add at least one locale" : undefined),
      }),

    defaultLocale: ({ results }) => {
      const list = results.locales
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      return p.select({
        message: "Default locale",
        options: list.map((l) => ({ value: l, label: l })),
      });
    },

    auth: () =>
      p.confirm({
        message: "Add next-auth?  (JWT + httpOnly cookie)",
        initialValue: true,
      }),

    dataFetching: () =>
      p.select({
        message: "Data fetching",
        options: [
          { value: "tanstack-query", label: "TanStack Query + Axios" },
          { value: "swr", label: "SWR + Axios" },
          { value: "axios", label: "Axios only" },
        ],
      }),

    uiLib: () =>
      p.select({
        message: "UI library",
        options: [
          { value: "shadcn", label: "shadcn/ui + Tailwind v4" },
          { value: "tailwind", label: "Tailwind v4 only" },
          { value: "none", label: "None" },
        ],
      }),

    extras: () =>
      p.multiselect({
        message: "Extras",
        options: [
          { value: "rhf-zod",        label: "React Hook Form + Zod",  hint: "forms & validation" },
          { value: "tanstack-table", label: "TanStack Table",          hint: "complex tables" },
          { value: "framer-motion",  label: "Framer Motion",           hint: "animations" },
          { value: "sonner",         label: "Sonner",                  hint: "toast notifications" },
        ],
        initialValues: ["rhf-zod", "tanstack-table", "sonner"],
        required: false,
      }),

    packageManager: () =>
      p.select({
        message: "Package manager",
        options: [
          { value: "npm",  label: "npm"  },
          { value: "pnpm", label: "pnpm" },
          { value: "bun",  label: "bun"  },
          { value: "yarn", label: "yarn" },
        ],
      }),
  },
  {
    onCancel: () => { p.cancel("Cancelled."); process.exit(0); },
  }
);

// ── Parse lists ───────────────────────────────────────────────────────────────
config.modulesList = config.modules
  ? config.modules.split(",").map((m) => m.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean)
  : [];
config.localesList = config.locales
  .split(",").map((l) => l.trim().toLowerCase()).filter(Boolean);

// ── Summary ───────────────────────────────────────────────────────────────────
p.note(
  [
    `${pc.bold("Project")}       ${config.projectName}`,
    `${pc.bold("Architecture")}  ${config.architecture === "modular" ? "Modular Clean Architecture" : "Clean Architecture"}`,
    config.modulesList.length ? `${pc.bold("Modules")}       ${config.modulesList.join(", ")}` : null,
    `${pc.bold("Locales")}       ${config.localesList.join(", ")}  (default: ${config.defaultLocale})`,
    `${pc.bold("Auth")}          ${config.auth ? "next-auth" : "none"}`,
    `${pc.bold("Data")}          ${config.dataFetching}`,
    `${pc.bold("UI")}            ${config.uiLib}`,
    `${pc.bold("Extras")}        ${config.extras.length ? config.extras.join(", ") : "none"}`,
    `${pc.bold("Package mgr")}   ${config.packageManager}`,
  ].filter(Boolean).join("\n"),
  "Summary"
);

const confirmed = await p.confirm({ message: "Create project?" });
if (!confirmed || p.isCancel(confirmed)) { p.cancel("Cancelled."); process.exit(0); }

// ── Scaffold ──────────────────────────────────────────────────────────────────
const spinner = p.spinner();
spinner.start("Scaffolding project");

try {
  await buildProject(config);
  await sleep(300);
  spinner.stop("Project created");
} catch (err) {
  spinner.stop("Failed");
  p.log.error(err.message);
  process.exit(1);
}

p.outro(
  [
    pc.bold("Next steps:"),
    `  cd ${config.projectName}`,
    `  ${config.packageManager} install`,
    `  ${config.packageManager === "npm" ? "npm run" : config.packageManager} dev`,
    "",
    pc.dim("Add a module:   carch add:module <name>"),
    pc.dim("Generate CRUD:  carch add:crud <module> <entity>"),
    pc.dim("Add i18n file:  carch add:i18n"),
  ].join("\n")
);

// ── Build ─────────────────────────────────────────────────────────────────────
async function buildProject(cfg) {
  const base = path.resolve(process.cwd(), cfg.projectName);
  const { modulesList, localesList, defaultLocale, auth, extras } = cfg;

  // public/
  dir(path.join(base, "public", "fonts"));
  dir(path.join(base, "public", "images"));
  dir(path.join(base, "public", "icons"));

  // app/
  write(path.join(base, "src", "app", "layout.tsx"), rootLayoutTemplate(defaultLocale));
  write(path.join(base, "src", "app", "not-found.tsx"), `export default function NotFound() {\n  return <div>404 — Not found</div>;\n}\n`);
  write(path.join(base, "src", "app", "(auth)", "login", "page.tsx"),
    `export { LoginPage as default } from "@/modules/auth/presentation/pages/LoginPage";\n`);

  // modules
  const allModules = cfg.architecture === "modular" ? [...modulesList, "auth"] : [];
  for (const mod of allModules) {
    scaffoldModuleDirs(base, mod, localesList);
  }

  // shared
  scaffoldSharedDirs(base, localesList);

  // config
  write(path.join(base, "src", "config", "env.ts"),          envTemplate());
  write(path.join(base, "src", "config", "module.types.ts"), moduleTypesTemplate());
  write(path.join(base, "src", "config", "constants.ts"),    `export const APP_NAME = "${cfg.projectName}";\n`);
  write(path.join(base, "src", "config", "feature-flags.ts"), `export const flags = {\n  // featureName: true,\n};\n`);
  if (cfg.architecture === "modular") {
    write(path.join(base, "src", "config", "modules.ts"), modulesConfigTemplate(modulesList));
  }
  write(path.join(base, "src", "config", "i18n.ts"), i18nConfigTemplate(localesList, defaultLocale));

  // lib
  if (cfg.uiLib === "shadcn") write(path.join(base, "src", "lib", "cn.ts"), cnTemplate());
  if (extras.includes("sonner")) write(path.join(base, "src", "lib", "toast.ts"), toastTemplate());
  write(path.join(base, "src", "lib", "format.ts"), formatTemplate());

  // providers
  write(path.join(base, "src", "providers", "QueryProvider.tsx"), queryProviderTemplate());
  write(path.join(base, "src", "providers", "index.tsx"), appProvidersTemplate(extras.includes("sonner")));

  // styles
  write(path.join(base, "src", "styles", "globals.css"), globalsCssTemplate());
  write(path.join(base, "src", "styles", "fonts.css"),   "/* custom font-face declarations */\n");

  // middleware
  write(path.join(base, "src", "middleware.ts"), middlewareTemplate(auth));

  // root files
  write(path.join(base, "tsconfig.json"),  tsconfigTemplate());
  write(path.join(base, "next.config.ts"), nextConfigTemplate());
  write(path.join(base, ".env.local"),     envLocalTemplate());
  write(path.join(base, ".gitignore"),     gitignoreTemplate());
  write(path.join(base, "package.json"),   packageJsonTemplate(cfg.projectName, cfg));
}

function scaffoldModuleDirs(base, moduleName, locales) {
  const root = path.join(base, "src", "modules", moduleName);
  dir(path.join(root, "presentation", "pages"));
  dir(path.join(root, "presentation", "components"));
  dir(path.join(root, "presentation", "assets", "images"));
  dir(path.join(root, "presentation", "icons"));
  dir(path.join(root, "domain", "entities"));
  dir(path.join(root, "domain", "types"));
  dir(path.join(root, "application", "hooks"));
  dir(path.join(root, "application", "services"));
  dir(path.join(root, "infrastructure", "api"));
  dir(path.join(root, "infrastructure", "integrations"));
  for (const locale of locales) {
    const nsDir = path.join(root, "i18n", locale, "dashboard");
    dir(nsDir);
    write(path.join(nsDir, "index.json"), namespaceJsonTemplate("dashboard"));
  }
  write(path.join(root, "module.config.ts"), moduleConfigTemplate(moduleName));
}

function scaffoldSharedDirs(base, locales) {
  const root = path.join(base, "src", "shared");
  dir(path.join(root, "presentation", "layouts"));
  dir(path.join(root, "presentation", "components"));
  dir(path.join(root, "presentation", "icons"));
  dir(path.join(root, "presentation", "assets"));
  dir(path.join(root, "domain", "entities"));
  dir(path.join(root, "domain", "types"));
  dir(path.join(root, "application", "hooks"));
  dir(path.join(root, "application", "services"));
  dir(path.join(root, "infrastructure", "http"));
  dir(path.join(root, "infrastructure", "auth"));
  dir(path.join(root, "infrastructure", "integrations"));

  write(path.join(root, "domain", "types", "api.types.ts"),    sharedApiTypesTemplate());
  write(path.join(root, "domain", "types", "common.types.ts"), sharedCommonTypesTemplate());
  write(path.join(root, "application", "hooks", "useDebounce.ts"), useDebounceTemplate());
  write(path.join(root, "infrastructure", "http", "client.ts"), httpClientTemplate());
  write(path.join(root, "presentation", "layouts", "DashboardLayout.tsx"), dashboardLayoutTemplate());

  const sharedNs = ["common", "table", "pagination"];
  for (const locale of locales) {
    for (const ns of sharedNs) {
      const nsDir = path.join(root, "i18n", locale, ns);
      dir(nsDir);
      write(path.join(nsDir, "index.json"), namespaceJsonTemplate(ns));
    }
  }
}
