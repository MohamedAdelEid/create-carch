#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import { setTimeout as sleep } from "timers/promises";
import { write, dir } from "../utils/fs.js";
import { toPascal } from "../utils/naming.js";
import {
  tsconfigTemplate, componentsJsonTemplate, nextConfigTemplate,
  envLocalTemplate, gitignoreTemplate, rootLayoutTemplate,
  middlewareTemplate, moduleTypesTemplate, modulesConfigTemplate,
  i18nConfigTemplate, envTemplate, featureFlagsTemplate,
  cnTemplate, toastTemplate, formatTemplate,
  queryProviderTemplate, appProvidersTemplate,
  globalsCssTemplate, fontsCssTemplate,
  sharedApiTypesTemplate, sharedCommonTypesTemplate,
  useDebounceTemplate, packageJsonTemplate,
} from "../templates/project/project.templates.js";
import {
  axiosClientTemplate, interceptorsTemplate,
  tokenStoreTemplate, httpClientTemplate,
} from "../templates/project/http.templates.js";
import {
  moduleConfigTemplate, roleLayoutTemplate, roleDashboardPageTemplate,
} from "../templates/module/module.templates.js";
import { namespaceJsonTemplate } from "../templates/i18n/i18n.templates.js";

console.clear();
p.intro(pc.bgCyan(pc.black(" carch ")) + "  Clean Architecture scaffold for Next.js");

const config = await p.group(
  {
    projectName: () =>
      p.text({
        message:  "Project name",
        placeholder: "my-app",
        validate: (v) => (!v?.trim() ? "Required" : undefined),
      }),

    architecture: () =>
      p.select({
        message: "Architecture",
        options: [
          { value: "modular", label: "Modular Clean Architecture", hint: "independent modules with their own layers" },
          { value: "clean",   label: "Clean Architecture",         hint: "single app with shared layers" },
        ],
      }),

    modules: ({ results }) => {
      if (results.architecture !== "modular") return;
      return p.text({
        message:     "Modules  (space or comma separated)",
        placeholder: "moduleA moduleB moduleC",
        validate:    (v) => (!v?.trim() ? "Add at least one module" : undefined),
      });
    },

    locales: () =>
      p.text({
        message:      "Locales  (space or comma separated language codes)",
        placeholder:  "ar en fr",
        initialValue: "ar en",
        validate:     (v) => (!v?.trim() ? "Add at least one locale" : undefined),
      }),

    defaultLocale: ({ results }) => {
      const list = results.locales.split(/[\s,]+/).map((l) => l.trim()).filter(Boolean);
      return p.select({
        message: "Default locale",
        options: list.map((l) => ({ value: l, label: l })),
      });
    },

    withDashboard: () =>
      p.confirm({
        message:      "Add dashboard layout?  (sidebar + header from shadcn/ui)",
        initialValue: true,
      }),

    rtlSupport: ({ results }) => {
      if (!results.withDashboard) return;
      const locales = results.locales.split(/[\s,]+/).map((l) => l.trim()).filter(Boolean);
      const hasRtlLang = locales.some((l) => ["ar", "he", "fa", "ur"].includes(l));
      if (hasRtlLang) {
        p.log.info("RTL support will be enabled automatically (detected RTL locale).");
        return Promise.resolve(true);
      }
      return p.confirm({
        message:      "Enable RTL support?",
        initialValue: false,
      });
    },

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
        required:      false,
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
  { onCancel: () => { p.cancel("Cancelled."); process.exit(0); } },
);

config.modulesList = config.modules
  ? config.modules.split(/[\s,]+/).map((m) => m.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean)
  : [];
config.localesList = config.locales.split(/[\s,]+/).map((l) => l.trim().toLowerCase()).filter(Boolean);

p.note(
  [
    `${pc.bold("Project")}       ${config.projectName}`,
    `${pc.bold("Architecture")}  ${config.architecture === "modular" ? "Modular Clean Architecture" : "Clean Architecture"}`,
    config.modulesList.length ? `${pc.bold("Modules")}       ${config.modulesList.join(", ")}` : null,
    `${pc.bold("Locales")}       ${config.localesList.join(", ")}  (default: ${config.defaultLocale})`,
    `${pc.bold("Dashboard")}     ${config.withDashboard ? `yes${config.rtlSupport ? " (RTL+LTR)" : ""}` : "no"}`,
    `${pc.bold("Extras")}        ${config.extras.length ? config.extras.join(", ") : "none"}`,
    `${pc.bold("Package mgr")}   ${config.packageManager}`,
  ].filter(Boolean).join("\n"),
  "Summary",
);

const confirmed = await p.confirm({ message: "Create project?" });
if (!confirmed || p.isCancel(confirmed)) { p.cancel("Cancelled."); process.exit(0); }

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

const pm = config.packageManager;
const runCmd = pm === "npm" ? "npm run" : pm;

if (config.withDashboard) {
  p.note(
    [
      "shadcn/ui needs to be initialized before installing components.",
      "After installing dependencies, run:",
      "",
      pc.bold(`  cd ${config.projectName}`),
      pc.bold(`  ${pm} install`),
      pc.bold(`  carch add:dashboard`),
      "",
      pc.dim("This will initialize shadcn and install sidebar + header components."),
    ].join("\n"),
    "Next: initialize shadcn",
  );
} else {
  p.outro([
    pc.bold("Next steps:"),
    `  cd ${config.projectName}`,
    `  ${pm} install`,
    `  ${runCmd} dev`,
    "",
    pc.dim("add:module <n>  |  add:crud <m> <e>  |  add:i18n  |  add:auth  |  add:dashboard"),
  ].join("\n"));
}

async function buildProject(cfg) {
  const base   = path.resolve(process.cwd(), cfg.projectName);
  const isModular = cfg.architecture === "modular";
  const { modulesList, localesList, defaultLocale, extras } = cfg;

  dir(path.join(base, "public", "fonts"));
  dir(path.join(base, "public", "images"));
  dir(path.join(base, "public", "icons"));

  write(path.join(base, "src", "app", "layout.tsx"),    rootLayoutTemplate(defaultLocale));
  write(path.join(base, "src", "app", "not-found.tsx"), `export default function NotFound() {\n  return <div>404</div>;\n}\n`);

  for (const mod of (isModular ? modulesList : [])) {
    scaffoldModule(base, mod, localesList, cfg.withDashboard);
  }

  scaffoldShared(base, localesList, extras);

  write(path.join(base, "src", "config", "env.ts"),           envTemplate());
  write(path.join(base, "src", "config", "module.types.ts"),  moduleTypesTemplate());
  write(path.join(base, "src", "config", "constants.ts"),     `export const APP_NAME = "${cfg.projectName}";\n`);
  write(path.join(base, "src", "config", "feature-flags.ts"), featureFlagsTemplate(modulesList));
  write(path.join(base, "src", "config", "i18n.ts"),          i18nConfigTemplate(localesList, defaultLocale));

  if (isModular && modulesList.length) {
    write(path.join(base, "src", "config", "modules.ts"), modulesConfigTemplate(modulesList));
  }

  write(path.join(base, "src", "middleware.ts"), middlewareTemplate(false));
  write(path.join(base, "tsconfig.json"),        tsconfigTemplate());
  write(path.join(base, "next.config.ts"),       nextConfigTemplate());
  write(path.join(base, "components.json"),      componentsJsonTemplate(isModular));
  write(path.join(base, ".env.local"),           envLocalTemplate());
  write(path.join(base, ".gitignore"),           gitignoreTemplate());
  write(path.join(base, "package.json"),         packageJsonTemplate(cfg.projectName, cfg));
}

function scaffoldModule(base, moduleName, locales, withDashboard) {
  const root   = path.join(base, "src", "modules", moduleName);
  const pascal = toPascal(moduleName);

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
    roleLayoutTemplate(moduleName, pascal, withDashboard),
  );
  write(
    path.join(base, "src", "app", `(${moduleName})`, "dashboard", "page.tsx"),
    roleDashboardPageTemplate(moduleName, pascal),
  );
}

function scaffoldShared(base, locales, extras) {
  const root = path.join(base, "src", "shared");

  dir(path.join(root, "presentation", "layouts"));
  dir(path.join(root, "presentation", "components"));
  dir(path.join(root, "presentation", "assets"));

  const sharedNs = ["common", "table", "pagination"];
  for (const locale of locales) {
    for (const ns of sharedNs) {
      const nsDir = path.join(root, "presentation", "i18n", locale, ns);
      dir(nsDir);
      write(path.join(nsDir, "index.json"), namespaceJsonTemplate(ns));
    }
  }

  write(path.join(root, "presentation", "styles", "globals.css"), globalsCssTemplate());
  write(path.join(root, "presentation", "styles", "fonts.css"),   fontsCssTemplate());

  write(path.join(root, "presentation", "providers", "QueryProvider.tsx"), queryProviderTemplate());
  write(path.join(root, "presentation", "providers", "index.tsx"),         appProvidersTemplate(extras?.includes("sonner")));

  dir(path.join(root, "domain", "entities"));
  dir(path.join(root, "domain", "types"));
  write(path.join(root, "domain", "types", "api.types.ts"),    sharedApiTypesTemplate());
  write(path.join(root, "domain", "types", "common.types.ts"), sharedCommonTypesTemplate());

  dir(path.join(root, "application", "hooks"));
  dir(path.join(root, "application", "services"));
  write(path.join(root, "application", "hooks", "useDebounce.ts"), useDebounceTemplate());

  write(path.join(root, "application", "lib", "cn.ts"),     cnTemplate());
  if (extras?.includes("sonner")) {
    write(path.join(root, "application", "lib", "toast.ts"), toastTemplate());
  }
  write(path.join(root, "application", "lib", "format.ts"), formatTemplate());

  write(path.join(root, "infrastructure", "http", "axiosClient.ts"),  axiosClientTemplate());
  write(path.join(root, "infrastructure", "http", "interceptors.ts"), interceptorsTemplate());
  write(path.join(root, "infrastructure", "http", "tokenStore.ts"),   tokenStoreTemplate());
  write(path.join(root, "infrastructure", "http", "httpClient.ts"),   httpClientTemplate());

  dir(path.join(root, "infrastructure", "auth"));
  dir(path.join(root, "infrastructure", "integrations"));

  write(path.join(root, "infrastructure", "config", "env.ts"),           envTemplate());
}
