import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/components/nexus/app-sidebar";
import { RoleProvider } from "@/components/nexus/role-selector";

export const metadata: Metadata = {
  title: "NexusOps | Operational Compliance Platform",
  description:
    "Plataforma de conformidade operacional, inspeções, APR e auditoria de frotas para provedores de internet (ISPs). Complementar ao MK Solutions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <RoleProvider>
          <AppSidebar />
          <div className="flex min-h-screen flex-col lg:ml-[var(--sidebar-width)]">
            {children}
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
