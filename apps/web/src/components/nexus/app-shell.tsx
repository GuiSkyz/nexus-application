"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppSidebar } from "./app-sidebar";
import { AuthGate, useAuth } from "./auth-provider";
import { RoleProvider } from "./role-selector";

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
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const technicianAllowed =
    pathname === "/vehicles" || pathname === "/account";
  const mustRedirect = user?.role === "TECNICO" && !technicianAllowed;

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
    <RoleProvider>
      <AppSidebar />
      <div className="flex min-h-screen flex-col lg:ml-[var(--sidebar-width)]">
        {children}
      </div>
    </RoleProvider>
  );
}
