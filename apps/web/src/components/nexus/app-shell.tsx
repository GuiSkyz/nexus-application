"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppSidebar } from "./app-sidebar";
import { AuthGate } from "./auth-provider";
import { RoleProvider, useRole } from "./role-selector";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") return children;

  return (
    <AuthGate>
      <AuthorizedShell>{children}</AuthorizedShell>
    </AuthGate>
  );
}

function AuthorizedShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <RoleAwareShell>{children}</RoleAwareShell>
    </RoleProvider>
  );
}

function RoleAwareShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeRole } = useRole();
  const technicianAllowed =
    pathname === "/vehicles" || pathname === "/incidents" || pathname === "/account";
  const mustRedirect = activeRole === "TECNICO" && !technicianAllowed;

  useEffect(() => {
    if (mustRedirect) router.replace("/vehicles");
  }, [mustRedirect, router]);

  if (mustRedirect) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-page">
        <p className="text-sm font-semibold text-text-secondary">
          Direcionando para sua área de acesso…
        </p>
      </main>
    );
  }

  return (
    <>
      <AppSidebar />
      <div className="flex min-h-screen flex-col lg:ml-[var(--sidebar-width)]">
        {children}
      </div>
    </>
  );
}
