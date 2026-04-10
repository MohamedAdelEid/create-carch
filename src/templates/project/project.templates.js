export function tsconfigTemplate() {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "esnext"],
        jsx: "preserve",
        module: "esnext",
        moduleResolution: "bundler",
        strict: true,
        noUncheckedIndexedAccess: true,
        resolveJsonModule: true,
        allowJs: true,
        skipLibCheck: true,
        paths: { "@/*": ["./src/*"] },
        plugins: [{ name: "next" }],
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
      exclude: ["node_modules"],
    },
    null,
    2,
  );
}

export function componentsJsonTemplate(isModular) {
  const uiPath = isModular
    ? "src/shared/presentation/components/ui"
    : "src/presentation/components/ui";
  const cssPath = isModular
    ? "src/shared/presentation/styles/globals.css"
    : "src/presentation/styles/globals.css";

  return JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema.json",
      style: "default",
      rsc: true,
      tsx: true,
      tailwind: {
        config: "",
        css: cssPath,
        baseColor: "neutral",
        cssVariables: true,
      },
      aliases: {
        components: "@/shared/presentation/components",
        utils: "@/shared/application/lib/cn",
        ui: uiPath,
        lib: "@/shared/application/lib",
        hooks: "@/shared/application/hooks",
      },
    },
    null,
    2,
  );
}

export function nextConfigTemplate() {
  return `import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/config/i18n.ts");

const nextConfig: NextConfig = {
  images: { remotePatterns: [] },
};

export default withNextIntl(nextConfig);
`;
}

export function envLocalTemplate() {
  return `NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_TIMEOUT=15000
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
`;
}

export function gitignoreTemplate() {
  return `.next\nnode_modules\n.env.local\n.env\n*.tsbuildinfo\n`;
}

export function rootLayoutTemplate(defaultLocale) {
  return `import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AppProviders } from "@/shared/presentation/providers";
import "@/shared/presentation/styles/globals.css";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  return (
    <html lang={params.locale} dir={params.locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
`;
}

export function middlewareTemplate(withAuth) {
  return `import createMiddleware from "next-intl/middleware";
import { defaultLocale } from "./config/i18n";
${withAuth ? `import { auth } from "./shared/infrastructure/auth/nextAuth";` : ""}

const intlMiddleware = createMiddleware({
  locales: ["ar", "en"],
  defaultLocale,
});

${withAuth ? `export default auth((req) => intlMiddleware(req));` : `export default intlMiddleware;`}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\\\..*).*)"],
};
`;
}

export function moduleTypesTemplate() {
  return `export type ModuleConfig = {
  name: string;
  i18nNamespaces: string[];
};
`;
}

export function modulesConfigTemplate(modulesList) {
  const imports = modulesList
    .map((m) => `import { ${m}Module } from "@/modules/${m}/module.config";`)
    .join("\n");
  const array = modulesList.map((m) => `  ${m}Module`).join(",\n");
  return `${imports}

export const appModules = [
${array},
] as const;

export const allI18nNamespaces = appModules.flatMap((m) => m.i18nNamespaces);
`;
}

export function i18nConfigTemplate(locales, defaultLocale) {
  return `import { getRequestConfig } from "next-intl/server";
import { appModules } from "./modules";

const locales = ${JSON.stringify(locales)} as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "${defaultLocale}";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? defaultLocale;

  const sharedNs = ["common", "table", "pagination"];
  const sharedMessages: Record<string, unknown> = {};
  for (const ns of sharedNs) {
    const mod = await import(
      \`../shared/presentation/i18n/\${locale}/\${ns}/index.json\`,
      { assert: { type: "json" } }
    );
    Object.assign(sharedMessages, mod.default);
  }

  const moduleMessages: Record<string, unknown> = {};
  for (const module of appModules) {
    for (const ns of module.i18nNamespaces) {
      try {
        const mod = await import(
          \`../modules/\${module.name}/presentation/i18n/\${locale}/\${ns}/index.json\`,
          { assert: { type: "json" } }
        );
        moduleMessages[\`\${module.name}.\${ns}\`] = mod.default[ns];
      } catch {
      }
    }
  }

  return { locale, messages: { ...sharedMessages, ...moduleMessages } };
});
`;
}

export function envTemplate() {
  return `import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_API_URL:     z.string().url(),
  NEXT_PUBLIC_API_TIMEOUT: z.string().optional(),
  NEXTAUTH_SECRET:         z.string().min(1),
  NEXTAUTH_URL:            z.string().url(),
});

export const env = schema.parse(process.env);
`;
}

export function featureFlagsTemplate(modules) {
  const flags = modules.length
    ? modules.map((m) => `  ${m}: true,`).join("\n")
    : "  // featureName: true,";
  return `export const featureFlags = {
${flags}
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
`;
}

export function cnTemplate() {
  return `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
}

export function toastTemplate() {
  return `import { toast } from "sonner";

export const notify = {
  success: (message: string) => toast.success(message),
  error:   (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  dismiss: (id?: string | number) => toast.dismiss(id),
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
  ) => toast.promise(promise, messages),
};
`;
}

export function formatTemplate() {
  return `export function formatDate(date: string | Date, locale = "ar-EG"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric", month: "long", day: "numeric",
  }).format(new Date(date));
}

export function formatNumber(n: number, locale = "ar-EG"): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function formatCurrency(amount: number, currency = "EGP", locale = "ar-EG"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
`;
}

export function queryProviderTemplate() {
  return `"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
`;
}

export function appProvidersTemplate(withSonner) {
  return `"use client";
import { QueryProvider } from "./QueryProvider";
${withSonner ? `import { Toaster } from "sonner";` : ""}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      ${withSonner ? `<Toaster richColors position="top-right" />` : ""}
    </QueryProvider>
  );
}
`;
}

export function globalsCssTemplate() {
  return `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
}

* { box-sizing: border-box; }
body {
  background-color: var(--background);
  color: var(--foreground);
}
`;
}

export function fontsCssTemplate() {
  return `/* custom font-face declarations */\n`;
}

export function sharedApiTypesTemplate() {
  return `export type PaginatedResponse<T> = {
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
};

export type ApiError = {
  message:    string;
  statusCode: number;
  errors?:    Record<string, string[]>;
};
`;
}

export function sharedCommonTypesTemplate() {
  return `export type SelectOption<T = string> = {
  label: string;
  value: T;
};

export type SortOrder = "asc" | "desc";
export type ID = string;
`;
}

export function useDebounceTemplate() {
  return `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
`;
}

export function packageJsonTemplate(projectName, cfg) {
  const deps = {
    next: "latest",
    react: "latest",
    "react-dom": "latest",
    "next-intl": "latest",
    axios: "latest",
    "next-auth": "latest",
    "@tanstack/react-query": "latest",
  };
  const devDeps = {
    typescript: "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    tailwindcss: "latest",
    "tw-animate-css": "latest",
  };
  if (cfg.extras?.includes("rhf-zod")) {
    deps["react-hook-form"] = "latest";
    deps["zod"] = "latest";
    deps["@hookform/resolvers"] = "latest";
  }
  if (cfg.extras?.includes("tanstack-table")) deps["@tanstack/react-table"] = "latest";
  if (cfg.extras?.includes("framer-motion"))  deps["framer-motion"] = "latest";
  if (cfg.extras?.includes("sonner"))         deps["sonner"] = "latest";
  deps["clsx"] = "latest";
  deps["tailwind-merge"] = "latest";
  deps["lucide-react"] = "latest";

  return JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2,
  );
}
