import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusOps | Operational Compliance Platform",
  description: "Plataforma de conformidade operacional, inspeções, APR e auditoria de frotas para provedores de internet (ISPs). Complementar ao MK Solutions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col">
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
                N
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                NexusOps
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Core v0.1.0
              </span>
            </div>
            <nav className="text-sm text-muted-foreground flex items-center space-x-6">
              <span className="hover:text-foreground transition-colors cursor-pointer">Documentação</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Status API</span>
            </nav>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-6 py-12 flex flex-col justify-center">
          {children}
        </main>
        <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} NexusOps Platform. Complementar ao ERP MK Solutions.
        </footer>
      </body>
    </html>
  );
}
