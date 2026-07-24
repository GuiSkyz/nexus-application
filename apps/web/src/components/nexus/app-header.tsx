import React from "react";
import { Search, Bell, User } from "lucide-react";
import { RoleSelector } from "./role-selector";

interface AppHeaderProps {
  pageTitle: string;
  breadcrumb?: string[];
}

export function AppHeader({ pageTitle, breadcrumb }: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6"
      style={{
        height: "var(--header-height)",
        backgroundColor: "var(--surface-card)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      {/* Lado esquerdo: breadcrumb + título */}
      <div className="flex items-center gap-3">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span style={{ color: "var(--text-muted)" }}>/</span>
                )}
                <span
                  style={{
                    color: i === breadcrumb.length - 1
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                    fontWeight: i === breadcrumb.length - 1 ? 500 : 400,
                  }}
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1
          className="text-[15px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Lado direito: busca, seletor de perfil, notificações, usuário */}
      <div className="flex items-center gap-3">
        {/* Seletor de Perfil de Acesso (RBAC) */}
        <RoleSelector />

        {/* Busca rápida */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 text-sm transition-colors duration-[140ms]"
          style={{
            color: "var(--text-muted)",
            backgroundColor: "var(--surface-muted)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-strong)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-default)";
          }}
          aria-label="Buscar (Ctrl+K)"
        >
          <Search size={14} />
          <span className="hidden sm:inline text-xs">Buscar...</span>
          <kbd
            className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 ml-4"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-muted)",
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Notificações */}
        <button
          className="relative flex items-center justify-center w-9 h-9 transition-colors duration-[140ms]"
          style={{
            color: "var(--text-secondary)",
            borderRadius: "var(--radius-md)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--surface-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          aria-label="Notificações"
        >
          <Bell size={18} />
        </button>

        {/* Avatar / Perfil */}
        <button
          className="flex items-center gap-2 py-1 px-1.5 transition-colors duration-[140ms]"
          style={{ borderRadius: "var(--radius-md)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--surface-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          aria-label="Menu do usuário"
        >
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{
              backgroundColor: "var(--nexus-blue-50)",
              borderRadius: "50%",
              color: "var(--nexus-blue-600)",
            }}
          >
            <User size={16} />
          </div>
        </button>
      </div>
    </header>
  );
}
