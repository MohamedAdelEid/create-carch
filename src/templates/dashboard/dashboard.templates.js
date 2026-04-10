export function dashboardLayoutTemplate(isModular, rtlSupport) {
    const layoutsPath = isModular
      ? "@/shared/presentation/layouts/dashboard"
      : "@/presentation/layouts/dashboard";
  
    return `import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
  import { AppSidebar } from "${layoutsPath}/AppSidebar";
  import { DashboardHeader } from "${layoutsPath}/DashboardHeader";
  
  export function DashboardLayout({
    children,
    locale,
  }: {
    children: React.ReactNode;
    locale?: string;
  }) {
    const dir${rtlSupport ? ` = locale === "ar" ? "rtl" : "ltr"` : ` = "ltr"`};
  
    return (
      <SidebarProvider>
        <AppSidebar side={dir === "rtl" ? "right" : "left"} dir={dir} />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex flex-1 flex-col gap-4 p-4">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }
  `;
  }
  
  export function appSidebarTemplate(isModular) {
    return `"use client";
  import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
  } from "@/components/ui/sidebar";
  import { LayoutDashboard, Settings } from "lucide-react";
  import Link from "next/link";
  import { usePathname } from "next/navigation";
  import type { ComponentProps } from "react";
  
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Settings",  href: "/settings",  icon: Settings },
  ];
  
  type Props = ComponentProps<typeof Sidebar>;
  
  export function AppSidebar({ side = "left", dir, ...props }: Props & { dir?: string }) {
    const pathname = usePathname();
  
    return (
      <Sidebar side={side} dir={dir} collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <span className="font-semibold">App</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
  
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
  
        <SidebarFooter />
      </Sidebar>
    );
  }
  `;
  }
  
  export function dashboardHeaderTemplate() {
    return `import {
    SidebarTrigger,
  } from "@/components/ui/sidebar";
  import { Separator } from "@/components/ui/separator";
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
  } from "@/components/ui/breadcrumb";
  
  export function DashboardHeader() {
    return (
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="me-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
    );
  }
  `;
  }
  
  export function shadcnInitScript(pm, rtl) {
    const runners = {
      npm:  "npx shadcn@latest",
      pnpm: "pnpm dlx shadcn@latest",
      yarn: "npx shadcn@latest",
      bun:  "bunx --bun shadcn@latest",
    };
    const runner = runners[pm] ?? runners.npm;
    const rtlFlag = rtl ? " --rtl" : "";
    return [
      `${runner} init -y${rtlFlag}`,
      `${runner} add sidebar -y`,
      `${runner} add breadcrumb -y`,
      `${runner} add separator -y`,
    ];
  }
  