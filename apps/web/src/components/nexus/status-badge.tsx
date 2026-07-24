import React from "react";

type ServiceStatus = "healthy" | "unhealthy" | "unknown" | "loading" | "ready" | "unready" | "error";

interface StatusBadgeProps {
  label: string;
  status: ServiceStatus;
  description?: string;
}

function resolveStatusConfig(status: ServiceStatus) {
  switch (status) {
    case "healthy":
    case "ready":
      return {
        label: "Operacional",
        dotColor: "var(--success)",
        bgColor: "var(--success-soft)",
        textColor: "var(--success-foreground)",
      };
    case "unhealthy":
    case "unready":
    case "error":
      return {
        label: "Indisponível",
        dotColor: "var(--danger)",
        bgColor: "var(--danger-soft)",
        textColor: "var(--danger-foreground)",
      };
    case "loading":
      return {
        label: "Verificando",
        dotColor: "var(--warning)",
        bgColor: "var(--warning-soft)",
        textColor: "var(--warning-foreground)",
      };
    default:
      return {
        label: "Desconhecido",
        dotColor: "var(--text-muted)",
        bgColor: "var(--surface-muted)",
        textColor: "var(--text-secondary)",
      };
  }
}

export function StatusBadge({ label, status, description }: StatusBadgeProps) {
  const config = resolveStatusConfig(status);

  return (
    <div
      className="flex items-center justify-between p-4 transition-colors duration-[140ms]"
      style={{
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Indicador de status — dot simples */}
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: config.dotColor,
            ...(status === "loading"
              ? { animation: "skeleton-pulse 1.4s ease-in-out infinite" }
              : {}),
          }}
          aria-hidden="true"
        />
        <div>
          <h4
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {label}
          </h4>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Badge de status */}
      <span
        className="text-[11px] font-medium px-2 py-0.5"
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor,
          borderRadius: "var(--radius-sm)",
        }}
      >
        {config.label}
      </span>
    </div>
  );
}
