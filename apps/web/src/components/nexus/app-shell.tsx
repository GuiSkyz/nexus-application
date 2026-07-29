"use client";

import { usePathname } from "next/navigation";

import { AppSidebar } from "./app-sidebar";
import { AuthGate } from "./auth-provider";
import { RoleProvider } from "./role-selector";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") return children;

  return (
    <AuthGate>
      <RoleProvider>
        <AppSidebar />
        <div className="flex min-h-screen flex-col lg:ml-[var(--sidebar-width)]">
          {children}
        </div>
      </RoleProvider>
    </AuthGate>
  );
}
