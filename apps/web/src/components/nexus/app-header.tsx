import React from "react";
import { RoleSelector } from "./role-selector";

interface AppHeaderProps {
  pageTitle: string;
  breadcrumb?: string[];
}

export function AppHeader({ pageTitle, breadcrumb }: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6"
      style={{
        height: "var(--header-height)",
        backgroundColor: "var(--surface-card)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            aria-label="Navegação estrutural"
            className="mb-1 flex items-center gap-1.5 text-xs"
          >
            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={`${crumb}-${index}`}>
                {index > 0 && (
                  <span style={{ color: "var(--text-muted)" }}>/</span>
                )}
                <span
                  className="truncate"
                  style={{
                    color:
                      index === breadcrumb.length - 1
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    fontWeight: index === breadcrumb.length - 1 ? 500 : 400,
                  }}
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1
          className="truncate text-[15px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {pageTitle}
        </h1>
      </div>

      <div className="flex-shrink-0">
        <RoleSelector />
      </div>
    </header>
  );
}
