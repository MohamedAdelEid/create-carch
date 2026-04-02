/**
 * Project-level file templates
 * Used during initial project creation (create command)
 */

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
    2
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
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
`;
}

export function gitignoreTemplate() {
  return `.next
node_modules
.env.local
.env
*.tsbuildinfo
`;
}

export function rootLayoutTemplate(defaultLocale) {
  return `import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AppProviders } from "@/providers";
import "@/styles/globals.css";

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
${withAuth ? `import { auth } from "./shared/infrastructure/auth/auth";` : ""}

const intlMiddleware = createMiddleware({
  locales: ["ar", "en"],
  defaultLocale,
});

${
  withAuth
    ? `export default auth((req) => intlMiddleware(req));`
    : `export default intlMiddleware;`
}

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
    .map(
      (m) =>
        `import { ${m}Module } from "@/modules/${m}/module.config";`
    )
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
    const mod = await import(\`../shared/i18n/\${locale}/\${ns}/index.json\`, {
      assert: { type: "json" },
    });
    Object.assign(sharedMessages, mod.default);
  }

  const moduleMessages: Record<string, unknown> = {};
  for (const module of appModules) {
    for (const ns of module.i18nNamespaces) {
      try {
        const mod = await import(
          \`../modules/\${module.name}/i18n/\${locale}/\${ns}/index.json\`,
          { assert: { type: "json" } }
        );
        moduleMessages[\`\${module.name}.\${ns}\`] = mod.default[ns];
      } catch {
        // namespace file not found — skip
      }
    }
  }

  return {
    locale,
    messages: { ...sharedMessages, ...moduleMessages },
  };
});
`;
}

export function envTemplate() {
  return `import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
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
    messages: { loading: string; success: string; error: string }
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

export function httpClientTemplate() {
  return `import axios from "axios";
import { env } from "@/config/env";

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // redirect or refresh token
    }
    return Promise.reject(error);
  }
);
`;
}

export function queryProviderTemplate() {
  return `"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
    })
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

export function dashboardLayoutTemplate() {
  return `"use client";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-e bg-background">
        {/* sidebar */}
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
`;
}

export function globalsCssTemplate() {
  return `@import "tailwindcss";

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}

* { box-sizing: border-box; }

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
`;
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

export function packageJsonTemplate(projectName, config) {
  const deps = {
    next: "latest",
    react: "latest",
    "react-dom": "latest",
    "next-intl": "latest",
  };
  const devDeps = {
    typescript: "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    tailwindcss: "latest",
  };
  if (config.auth) deps["next-auth"] = "latest";
  if (config.dataFetching === "tanstack-query") {
    deps["@tanstack/react-query"] = "latest";
    deps["axios"] = "latest";
  } else if (config.dataFetching === "swr") {
    deps["swr"] = "latest";
    deps["axios"] = "latest";
  } else {
    deps["axios"] = "latest";
  }
  if (config.uiLib === "shadcn") {
    deps["clsx"] = "latest";
    deps["tailwind-merge"] = "latest";
    deps["class-variance-authority"] = "latest";
    deps["@radix-ui/react-dialog"] = "latest";
    deps["lucide-react"] = "latest";
  }
  if (config.extras.includes("rhf-zod")) {
    deps["react-hook-form"] = "latest";
    deps["zod"] = "latest";
    deps["@hookform/resolvers"] = "latest";
  }
  if (config.extras.includes("tanstack-table"))
    deps["@tanstack/react-table"] = "latest";
  if (config.extras.includes("framer-motion"))
    deps["framer-motion"] = "latest";
  if (config.extras.includes("sonner")) deps["sonner"] = "latest";

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
    2
  );
}
