/** Template: module.config.ts */
export function moduleConfigTemplate(moduleName) {
  return `import type { ModuleConfig } from "@/config/module.types";

export const ${moduleName}Module = {
  name: "${moduleName}",
  i18nNamespaces: ["dashboard"],
} satisfies ModuleConfig;
`;
}

/** Template: app/(module)/layout.tsx */
export function roleLayoutTemplate(moduleName, pascal, withAuth) {
  return `import { DashboardLayout } from "@/shared/presentation/layouts/DashboardLayout";
${withAuth ? `import { redirect } from "next/navigation";\nimport { getServerSession } from "next-auth";` : ""}

export default async function ${pascal}Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  ${
    withAuth
      ? `const session = await getServerSession();
  if (!session || session.user?.role !== "${moduleName}") redirect("/login");
  `
      : ""
  }
  return <DashboardLayout>{children}</DashboardLayout>;
}
`;
}

/** Template: app/(module)/dashboard/page.tsx */
export function rolePageTemplate(moduleName, pascal) {
  return `export { ${pascal}DashboardPage as default } from "@/modules/${moduleName}/presentation/pages/${pascal}DashboardPage";\n`;
}
