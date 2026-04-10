#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import { execSync } from "child_process";
import { write, dir, exists, detectLocales, getPackageManager } from "../utils/fs.js";
import { namespaceJsonTemplate } from "../templates/i18n/i18n.templates.js";
import {
  nextAuthTypesTemplate,
  nextAuthConfigTemplate,
  nextAuthTemplate,
  nextAuthRouteTemplate,
  authApiTemplate,
  authTypesTemplate,
  authSchemasTemplate,
  useLoginTemplate,
  useRegisterTemplate,
  useLogoutTemplate,
  loginPageTemplate,
  registerPageTemplate,
  shadcnAuthComponents,
} from "../templates/auth/auth.templates.js";

const base    = process.cwd();
const pm      = getPackageManager(base);
const locales = detectLocales(base);

const runners = {
  npm:  "npx shadcn@latest",
  pnpm: "pnpm dlx shadcn@latest",
  yarn: "npx shadcn@latest",
  bun:  "bunx --bun shadcn@latest",
};
const runner = runners[pm] ?? runners.npm;

p.intro(pc.bgCyan(pc.black(" carch ")) + "  add:auth — setup authentication module");

if (exists(path.join(base, "src", "modules", "auth"))) {
  p.log.warn("Auth module already exists. Files will be overwritten.");
}

const shadcnReady = exists(path.join(base, "components.json"));
if (!shadcnReady) {
  p.log.warn("components.json not found. Run 'carch add:dashboard' first or 'npx shadcn@latest init'.");
}

const spinner = p.spinner();

if (shadcnReady) {
  spinner.start("Installing shadcn/ui auth components");
  try {
    const components = shadcnAuthComponents().join(" ");
    execSync(`${runner} add ${components} -y`, { stdio: "pipe", cwd: base });
    spinner.stop("shadcn/ui components installed");
  } catch (err) {
    spinner.stop("Component install failed — continuing with file generation");
    p.log.warn(err.message);
  }
}

spinner.start("Generating auth module files");

const modRoot = path.join(base, "src", "modules", "auth");

write(path.join(modRoot, "presentation", "pages", "LoginPage.tsx"),    loginPageTemplate());
write(path.join(modRoot, "presentation", "pages", "RegisterPage.tsx"), registerPageTemplate());

for (const locale of locales) {
  const nsDir = path.join(modRoot, "presentation", "i18n", locale, "auth");
  dir(nsDir);
  write(path.join(nsDir, "index.json"), namespaceJsonTemplate("auth"));
}

write(path.join(modRoot, "domain", "types", "auth.types.ts"),            authTypesTemplate());
write(path.join(modRoot, "application", "schemas", "auth.schemas.ts"),  authSchemasTemplate());
write(path.join(modRoot, "application", "hooks", "useLogin.ts"),        useLoginTemplate());
write(path.join(modRoot, "application", "hooks", "useRegister.ts"),     useRegisterTemplate());
write(path.join(modRoot, "application", "hooks", "useLogout.ts"),       useLogoutTemplate());
write(path.join(modRoot, "infrastructure", "api", "auth.api.ts"),       authApiTemplate());

const authInfra = path.join(base, "src", "shared", "infrastructure", "auth");
write(path.join(authInfra, "nextAuth.types.ts"),  nextAuthTypesTemplate());
write(path.join(authInfra, "nextAuth.config.ts"), nextAuthConfigTemplate());
write(path.join(authInfra, "nextAuth.ts"),        nextAuthTemplate());

write(
  path.join(base, "src", "app", "api", "auth", "[...nextauth]", "route.ts"),
  nextAuthRouteTemplate(),
);
write(
  path.join(base, "src", "app", "(auth)", "login", "page.tsx"),
  `export { LoginPage as default } from "@/modules/auth/presentation/pages/LoginPage";\n`,
);
write(
  path.join(base, "src", "app", "(auth)", "register", "page.tsx"),
  `export { RegisterPage as default } from "@/modules/auth/presentation/pages/RegisterPage";\n`,
);

spinner.stop("Auth module created");

p.outro([
  pc.green("Files created:"),
  "  modules/auth/presentation/pages/LoginPage.tsx",
  "  modules/auth/presentation/pages/RegisterPage.tsx",
  "  modules/auth/domain/types/auth.types.ts",
  "  modules/auth/application/schemas/auth.schemas.ts",
  "  modules/auth/application/hooks/  (useLogin, useRegister, useLogout)",
  "  modules/auth/infrastructure/api/auth.api.ts",
  "  shared/infrastructure/auth/nextAuth.ts",
  "  app/api/auth/[...nextauth]/route.ts",
  "  app/(auth)/login/page.tsx  &  register/page.tsx",
  "",
  pc.dim("Add NEXTAUTH_SECRET and NEXTAUTH_URL to .env.local"),
].join("\n"));
