export function moduleConfigTemplate(moduleName) {
  return `import type { ModuleConfig } from "@/config/module.types";

export const ${moduleName}Module = {
  name: "${moduleName}",
  i18nNamespaces: ["dashboard"],
} satisfies ModuleConfig;
`;
}

export function roleLayoutTemplate(moduleName, pascal, withDashboard) {
  const dashboardImport = withDashboard
    ? `import { DashboardLayout } from "@/shared/presentation/layouts/DashboardLayout";`
    : "";
  const wrap = withDashboard
    ? `<DashboardLayout>{children}</DashboardLayout>`
    : `<>{children}</>`;

  return `import { redirect } from "next/navigation";
import { auth } from "@/shared/infrastructure/auth/nextAuth";
${dashboardImport}

export default async function ${pascal}Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "${moduleName}") redirect("/login");
  return ${wrap};
}
`;
}

export function roleDashboardPageTemplate(moduleName, pascal) {
  return `export { ${pascal}DashboardPage as default } from "@/modules/${moduleName}/presentation/pages/${pascal}DashboardPage";\n`;
}
