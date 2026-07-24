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
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <RoleProvider>
          <AppSidebar />
          {/* Área principal deslocada pela sidebar */}
          <div
            className="flex flex-col min-h-screen transition-[margin] duration-[140ms] ease-in-out"
            style={{ marginLeft: "var(--sidebar-width)" }}
          >
            {children}
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
