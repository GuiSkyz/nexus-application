import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/nexus/app-shell";
import { AuthProvider } from "@/components/nexus/auth-provider";

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
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
